const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Memória em tempo real das salas ativas
const rooms = new Map(); // session_id -> Room
const socketIndex = new Map(); // socket_id -> { session_id, player_id, last_chat_at }
const gamesCache = {};

function normalizePassword(p) {
  if (!p) return null;
  const s = String(p).trim();
  if (!s || s.toLowerCase() === 'none') return null;
  return s;
}

// Rotas HTTP da API EmulatorJS Netplay
app.get('/', (req, res) => {
  res.json({
    name: 'RetroNFC Netplay Signaling Server',
    status: 'online',
    version: '1.0.0',
    activeRooms: rooms.size
  });
});

app.get('/health', (req, res) => {
  res.send('OK');
});

app.get('/list', (req, res) => {
  const dom = req.query.domain;
  const gid = req.query.game_id;
  const out = {};

  for (const [sessionId, room] of rooms.entries()) {
    if (dom && room.domain !== dom) continue;
    if (gid && room.game_id !== gid) continue;

    let ownerName = 'Unknown';
    for (const p of Object.values(room.players)) {
      if (p.socketId === room.owner) {
        ownerName = p.player_name || 'Host';
        break;
      }
    }

    out[sessionId] = {
      room_name: room.room_name,
      current: Object.keys(room.players).length,
      max: room.max_players,
      player_name: ownerName,
      hasPassword: !!room.password,
      gameId: room.game_id
    };
  }

  res.json(out);
});

app.get('/games', (req, res) => {
  res.json(gamesCache);
});

// Limpeza de salas inativas a cada 60s
setInterval(() => {
  for (const [sessionId, room] of rooms.entries()) {
    if (!room.players || Object.keys(room.players).length === 0) {
      rooms.delete(sessionId);
    }
  }
}, 60000);

function leaveInternal(socket) {
  const sid = socket.id;
  const idx = socketIndex.get(sid);
  if (!idx) return;

  const { session_id, player_id } = idx;
  const room = rooms.get(session_id);

  if (room) {
    delete room.players[player_id];
    room.peers = room.peers.filter(p => p.source !== sid && p.target !== sid);

    // Se o host saiu e ainda há jogadores, transfere a liderança
    if (room.owner === sid) {
      const remaining = Object.values(room.players);
      if (remaining.length > 0) {
        const nextOwner = remaining[0].socketId;
        room.owner = nextOwner;
        for (const peer of room.peers) {
          if (peer.source === sid) peer.source = nextOwner;
        }
        if (room.peers.length > 0) {
          const firstTarget = (room.peers[0].source === nextOwner) ? room.peers[0].target : room.peers[0].source;
          io.to(nextOwner).emit('webrtc-signal', {
            target: firstTarget,
            requestRenegotiate: true
          });
        }
      } else {
        rooms.delete(session_id);
      }
    }

    if (rooms.has(session_id)) {
      const remainingSockets = Object.values(room.players).map(p => p.socketId).filter(Boolean);
      for (const targetSid of remainingSockets) {
        if (targetSid !== sid) {
          io.to(targetSid).emit('users-updated', room.players);
        }
      }
    }
  }

  socketIndex.delete(sid);
  socket.leave(session_id);
}

// WebSocket Eventos EmulatorJS Netplay
io.on('connection', (socket) => {
  socket.join(socket.id);

  // 1. Criar Sala (Host / Player 1)
  socket.on('open-room', (data, ack) => {
    try {
      const extra = (data && typeof data.extra === 'object' && data.extra) ? data.extra : {};
      const session_id = String(extra.sessionid || '').trim();
      const player_id = String(extra.userid || extra.playerId || '').trim();

      if (!session_id || !player_id) {
        if (typeof ack === 'function') ack('Invalid data: sessionId and playerId required');
        return;
      }

      if (rooms.has(session_id)) {
        if (typeof ack === 'function') ack('Room already exists');
        return;
      }

      const room_name = extra.room_name || `Sala ${session_id}`;
      const game_id = String(extra.game_id || 'default');
      const domain = String(extra.domain || 'retronfc.com.br');
      const max_players = Number(data.max_players) || 4;
      const password = normalizePassword(data.password);

      extra.socketId = socket.id;
      const players = { [player_id]: extra };

      rooms.set(session_id, {
        owner: socket.id,
        players,
        peers: [],
        room_name,
        game_id,
        domain,
        password,
        max_players
      });

      socket.join(session_id);
      socketIndex.set(socket.id, {
        session_id,
        player_id,
        last_chat_at: 0
      });

      if (typeof ack === 'function') ack(null);
      io.to(socket.id).emit('users-updated', players);
    } catch (err) {
      console.error('Error on open-room:', err);
      if (typeof ack === 'function') ack('Internal Server Error');
    }
  });

  // 2. Entrar na Sala (Guest / Player 2)
  socket.on('join-room', (data, ack) => {
    try {
      const extra = (data && typeof data.extra === 'object' && data.extra) ? data.extra : {};
      const session_id = String(extra.sessionid || '').trim();
      const player_id = String(extra.userid || extra.playerId || '').trim();

      if (!session_id || !player_id) {
        if (typeof ack === 'function') ack('Invalid data: sessionId and playerId required');
        return;
      }

      const room = rooms.get(session_id);
      if (!room) {
        if (typeof ack === 'function') ack('Room not found');
        return;
      }

      const providedPw = normalizePassword(data.password);
      if (room.password && room.password !== providedPw) {
        if (typeof ack === 'function') ack('Incorrect password');
        return;
      }

      if (Object.keys(room.players).length >= room.max_players) {
        if (typeof ack === 'function') ack('Room full');
        return;
      }

      extra.socketId = socket.id;
      room.players[player_id] = extra;

      socket.join(session_id);
      socketIndex.set(socket.id, {
        session_id,
        player_id,
        last_chat_at: 0
      });

      if (typeof ack === 'function') ack(null, room.players);

      // Notifica todos na sala com a lista atualizada de jogadores
      for (const p of Object.values(room.players)) {
        if (p.socketId) {
          io.to(p.socketId).emit('users-updated', room.players);
        }
      }
    } catch (err) {
      console.error('Error on join-room:', err);
      if (typeof ack === 'function') ack('Internal Server Error');
    }
  });

  // 3. Sinalização WebRTC (Offer, Answer, ICE Candidates)
  socket.on('webrtc-signal', (data) => {
    const sender = socket.id;
    const idx = socketIndex.get(sender);
    const target = data && data.target;

    if (!target && !data.requestRenegotiate) return;

    if (data.offer && idx) {
      const room = rooms.get(idx.session_id);
      if (room) {
        const exists = room.peers.some(p => p.source === sender && p.target === target);
        if (!exists) {
          room.peers.push({ source: sender, target });
        }
      }
    }

    const payload = { sender };
    if (data.requestRenegotiate) {
      payload.requestRenegotiate = true;
    } else {
      if (data.candidate) payload.candidate = data.candidate;
      if (data.offer) payload.offer = data.offer;
      if (data.answer) payload.answer = data.answer;
    }

    if (target) {
      io.to(target).emit('webrtc-signal', payload);
    }
  });

  // 4. Mensagens e Controles do Emulador
  socket.on('input', (data) => {
    const idx = socketIndex.get(socket.id);
    if (!idx) return;
    socket.to(idx.session_id).emit('input', data);
  });

  socket.on('snapshot', (data) => {
    const idx = socketIndex.get(socket.id);
    if (!idx) return;
    socket.to(idx.session_id).emit('snapshot', data);
  });

  socket.on('data-message', (data) => {
    const idx = socketIndex.get(socket.id);
    if (!idx) return;
    socket.to(idx.session_id).emit('data-message', data);
  });

  socket.on('chat-message', (data, ack) => {
    const idx = socketIndex.get(socket.id);
    if (!idx) {
      if (typeof ack === 'function') ack({ ok: false, error: 'Not in a room' });
      return;
    }

    const now = Date.now();
    if (now - idx.last_chat_at < 400) {
      if (typeof ack === 'function') ack({ ok: false, error: 'Slow down' });
      return;
    }
    idx.last_chat_at = now;

    const room = rooms.get(idx.session_id);
    if (!room) {
      if (typeof ack === 'function') ack({ ok: false, error: 'Room not found' });
      return;
    }

    const player = room.players[idx.player_id];
    const playerName = (player && player.player_name) || 'Player';
    const message = (typeof data === 'string' ? data : (data && data.message ? String(data.message) : '')).trim();

    const payload = {
      ts: now,
      to: 'all',
      userid: idx.player_id,
      player_name: playerName,
      message
    };

    io.to(idx.session_id).emit('chat-message', payload);
    if (typeof ack === 'function') ack({ ok: true });
  });

  socket.on('leave-room', () => {
    leaveInternal(socket);
  });

  socket.on('disconnect', () => {
    leaveInternal(socket);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 RetroNFC Netplay Server rodando na porta ${PORT}`);
});
