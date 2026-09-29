/**
 * RetroNFC — WebRTC P2P Share Play (Versus & Coop 2 Players)
 * Permite que o Player 1 transmita o jogo em tempo real (60 FPS)
 * e o Player 2 jogue no segundo controle (Player 2) pelo próprio celular.
 */

// Hook global para capturar o áudio do emulador do Player 1 e transmitir ao Player 2
(function initAudioCaptureHook() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx || window.__retroAudioHooked) return;
    window.__retroAudioHooked = true;

    const origConnect = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function(dest, ...rest) {
      if (dest && (dest === this.context.destination || dest.numberOfInputs === 1)) {
        if (!this.__streamDest && this.context && this.context.createMediaStreamDestination) {
          try {
            const streamDest = this.context.createMediaStreamDestination();
            this.__streamDest = streamDest;
            origConnect.call(this, streamDest);
            if (window.RetroSharePlay) {
              window.RetroSharePlay.setHostAudioStream(streamDest.stream);
            }
          } catch(e) {}
        }
      }
      return origConnect.call(this, dest, ...rest);
    };
  } catch(err) {
    console.warn('[SharePlay] Áudio hook opcional não ativado:', err);
  }
})();

const RetroSharePlay = {
  serverUrl: 'https://retronfc-netplay.onrender.com',
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' }
  ],
  socket: null,
  pc: null,
  dataChannel: null,
  role: null,
  roomId: null,
  hostSocketId: null,
  guestSocketId: null,
  isGuestConnected: false,
  pendingCandidates: [],
  hostAudioStream: null,
  joinRetryTimer: null,

  setHostAudioStream(stream) {
    this.hostAudioStream = stream;
    if (this.pc && stream) {
      try {
        stream.getAudioTracks().forEach(track => {
          this.pc.addTrack(track, stream);
        });
      } catch(e) {}
    }
  },

  // HUD elegante e discreto de status
  showHud(msg, status = 'info') {
    let hud = document.getElementById('shareplay-hud');
    if (!hud) {
      hud = document.createElement('div');
      hud.id = 'shareplay-hud';
      hud.style.cssText = `
        position: fixed;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999999;
        background: rgba(15, 23, 42, 0.94);
        border: 1.5px solid #00f0ff;
        border-radius: 20px;
        padding: 5px 16px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 0.78rem;
        font-weight: 800;
        color: #fff;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.8);
        transition: all 0.3s ease;
        pointer-events: none;
      `;
      document.body.appendChild(hud);
    }
    const dotColor = status === 'connected' ? '#22c55e' : status === 'waiting' ? '#eab308' : '#38bdf8';
    hud.innerHTML = `
      <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${dotColor}; box-shadow:0 0 8px ${dotColor};"></span>
      <span>${msg}</span>
    `;
    hud.style.display = 'flex';
    hud.style.opacity = '1';
  },

  // ========================================================
  // 1. MODO HOST (PLAYER 1 - EMULAÇÃO PRINCIPAL)
  // ========================================================
  async startHost(roomId, game) {
    this.role = 'host';
    this.roomId = roomId;
    this.showHud(`Aguardando Player 2... (Sala: ${roomId})`, 'waiting');

    if (this.socket) {
      try { this.socket.disconnect(); } catch(e) {}
    }

    if (typeof io === 'undefined') {
      console.error('[SharePlay] Socket.IO não encontrado! Verifique a inclusão do script.');
      return;
    }

    this.socket = io(this.serverUrl, { transports: ['websocket', 'polling'] });
    const userId = 'host_' + Math.random().toString(36).substring(2, 9);

    this.socket.on('connect', () => {
      console.log('[SharePlay] Host conectado ao servidor de sinalização. Criando sala:', roomId);
      this.socket.emit('open-room', {
        extra: {
          sessionid: roomId,
          userid: userId,
          game_id: (game && (game.id || game.romParam)) || 'game',
          room_name: `Sala ${roomId}`
        },
        max_players: 2
      }, (err) => {
        if (err && err !== 'Room already exists') {
          console.warn('[SharePlay] Resposta ao abrir sala:', err);
        }
      });
    });

    // Detecta quando o Player 2 entra na sala
    this.socket.on('users-updated', async (users) => {
      const userList = Object.values(users);
      console.log('[SharePlay] Usuários na sala do Host:', userList);
      const guest = userList.find(u => u.userid !== userId);
      if (guest && guest.socketId && (!this.isGuestConnected || this.guestSocketId !== guest.socketId)) {
        this.guestSocketId = guest.socketId;
        console.log('[SharePlay] Player 2 detectado (Socket:', guest.socketId, '). Iniciando conexão WebRTC...');
        await this.initHostWebRTC(guest.socketId);
      }
    });

    // Sinais WebRTC (Answer e ICE Candidates do Player 2)
    this.socket.on('webrtc-signal', async (data) => {
      if (!this.pc) return;
      if (data.answer) {
        console.log('[SharePlay] Host recebeu Answer do Player 2.');
        try {
          await this.pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        } catch(err) {
          console.error('[SharePlay] Erro ao aplicar Answer no Host:', err);
        }
      } else if (data.candidate) {
        try {
          await this.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.error('[SharePlay] Erro ao adicionar ICE candidate no Host:', e);
        }
      }
    });
  },

  async initHostWebRTC(guestSocketId) {
    if (this.pc) {
      try { this.pc.close(); } catch(e) {}
    }

    this.isGuestConnected = true;
    this.pc = new RTCPeerConnection({ iceServers: this.iceServers });

    // Envia ICE candidates para o Player 2
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('webrtc-signal', {
          target: guestSocketId,
          candidate: event.candidate
        });
      }
    };

    // Cria o DataChannel para receber os comandos do controle do Player 2
    this.dataChannel = this.pc.createDataChannel('retronfc_gamepad', { ordered: true });
    this.dataChannel.onopen = () => {
      console.log('[SharePlay] DataChannel aberto! Player 2 pronto para jogar.');
      this.showHud('🟢 PLAYER 2 CONECTADO (VERSUS ATIVO)', 'connected');
      setTimeout(() => {
        const hud = document.getElementById('shareplay-hud');
        if (hud) hud.style.opacity = '0.4';
      }, 5000);
    };

    this.dataChannel.onclose = () => {
      this.showHud('Player 2 desconectou', 'waiting');
      this.isGuestConnected = false;
    };

    // Processa os toques de botões enviados pelo Player 2
    this.dataChannel.onmessage = (event) => {
      try {
        const input = JSON.parse(event.data);
        if (window.EJS_emulator) {
          // 1 = Player 2 (Segundo jogador / Controle 2)
          if (window.EJS_emulator.gameManager && typeof window.EJS_emulator.gameManager.simulateInput === 'function') {
            window.EJS_emulator.gameManager.simulateInput(1, input.btn, input.val);
          } else if (typeof window.EJS_emulator.simulateInput === 'function') {
            window.EJS_emulator.simulateInput(1, input.btn, input.val);
          }
        }
      } catch (err) {
        console.error('[SharePlay] Erro ao injetar input do Player 2:', err);
      }
    };

    // Aguarda o canvas do emulador estar pronto e captura o vídeo a 60 FPS
    let attempts = 0;
    const waitForCanvas = () => {
      const canvas = document.querySelector('#game-container canvas');
      if (canvas) {
        try {
          const stream = canvas.captureStream ? canvas.captureStream(60) : (canvas.mozCaptureStream ? canvas.mozCaptureStream(60) : null);
          if (stream) {
            // Adiciona vídeo
            stream.getVideoTracks().forEach(track => this.pc.addTrack(track, stream));
            // Adiciona áudio capturado se disponível
            if (this.hostAudioStream) {
              this.hostAudioStream.getAudioTracks().forEach(track => this.pc.addTrack(track, this.hostAudioStream));
            }
            console.log('[SharePlay] Canvas stream capturado com sucesso a 60 FPS.');
          }
          this.createAndSendOffer(guestSocketId);
        } catch (err) {
          console.error('[SharePlay] Falha ao capturar canvas stream:', err);
          this.createAndSendOffer(guestSocketId);
        }
      } else if (attempts < 60) {
        attempts++;
        setTimeout(waitForCanvas, 300);
      } else {
        console.warn('[SharePlay] Timeout aguardando canvas do emulador.');
        this.createAndSendOffer(guestSocketId);
      }
    };
    waitForCanvas();
  },

  async createAndSendOffer(guestSocketId) {
    try {
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      this.socket.emit('webrtc-signal', {
        target: guestSocketId,
        offer: offer
      });
      console.log('[SharePlay] Host enviou Offer WebRTC para o Player 2.');
    } catch(err) {
      console.error('[SharePlay] Erro ao criar/enviar offer:', err);
    }
  },

  // ========================================================
  // 2. MODO GUEST (PLAYER 2 - TELA REMOTA E CONTROLES P2)
  // ========================================================
  async startGuest(roomId, game) {
    this.role = 'guest';
    this.roomId = roomId;
    this.pendingCandidates = [];
    this.showHud(`Conectando à Sala ${roomId}...`, 'waiting');

    // Monta a tela de recepção do vídeo e os botões virtuais P2
    this.setupGuestScreen();

    if (this.socket) {
      try { this.socket.disconnect(); } catch(e) {}
    }

    if (typeof io === 'undefined') {
      alert('Biblioteca de rede não carregada. Atualize a página.');
      return;
    }

    this.socket = io(this.serverUrl, { transports: ['websocket', 'polling'] });
    const userId = 'guest_' + Math.random().toString(36).substring(2, 9);

    this.socket.on('connect', () => {
      console.log('[SharePlay] Guest conectado ao servidor de sinalização. Entrando na sala:', roomId);
      
      const tryJoin = () => {
        this.socket.emit('join-room', {
          extra: {
            sessionid: roomId,
            userid: userId,
            game_id: (game && (game.id || game.romParam)) || 'game',
            room_name: `Sala ${roomId}`
          }
        }, (err) => {
          if (err) {
            console.log('[SharePlay] Sala ainda não encontrada, aguardando Player 1 abrir...');
            this.showHud(`Aguardando Player 1 abrir a Sala-${roomId}...`, 'waiting');
            clearTimeout(this.joinRetryTimer);
            this.joinRetryTimer = setTimeout(tryJoin, 2000);
          } else {
            console.log('[SharePlay] Guest entrou na sala com sucesso!');
            this.showHud(`🟢 Sala ${roomId} conectada! Recebendo jogo...`, 'waiting');
          }
        });
      };
      tryJoin();
    });

    if (this.pc) {
      try { this.pc.close(); } catch(e) {}
    }

    this.pc = new RTCPeerConnection({ iceServers: this.iceServers });

    // Envia ICE candidates para o Host
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        if (this.hostSocketId) {
          this.socket.emit('webrtc-signal', {
            target: this.hostSocketId,
            candidate: event.candidate
          });
        } else {
          this.pendingCandidates.push(event.candidate);
        }
      }
    };

    // Recebe o stream de vídeo do Player 1 em 60 FPS
    this.pc.ontrack = (event) => {
      console.log('[SharePlay] Guest recebeu track de mídia do Host:', event.track.kind);
      const video = document.getElementById('guest-video-stream');
      if (video) {
        if (video.srcObject !== event.streams[0]) {
          video.srcObject = event.streams[0];
        }
        video.play().catch(e => console.log('Autoplay com som silenciado:', e));
      }
      this.showHud('🟢 CONECTADO AO HOST! VOCÊ É O PLAYER 2', 'connected');
      setTimeout(() => {
        const hud = document.getElementById('shareplay-hud');
        if (hud) hud.style.opacity = '0.4';
      }, 5000);
    };

    // Recebe o DataChannel para os controles
    this.pc.ondatachannel = (event) => {
      this.dataChannel = event.channel;
      console.log('[SharePlay] DataChannel recebido pelo Guest!');
      this.dataChannel.onopen = () => {
        console.log('[SharePlay] Canal de controles P2 aberto e pronto!');
      };
    };

    // Sinais WebRTC enviados pelo Host
    this.socket.on('webrtc-signal', async (data) => {
      if (data.sender) {
        this.hostSocketId = data.sender;
        // Envia candidatos pendentes acumulados
        if (this.pendingCandidates.length > 0) {
          this.pendingCandidates.forEach(cand => {
            this.socket.emit('webrtc-signal', {
              target: this.hostSocketId,
              candidate: cand
            });
          });
          this.pendingCandidates = [];
        }
      }

      if (data.offer) {
        console.log('[SharePlay] Guest recebeu Offer do Host. Respondendo com Answer...');
        try {
          await this.pc.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await this.pc.createAnswer();
          await this.pc.setLocalDescription(answer);
          this.socket.emit('webrtc-signal', {
            target: data.sender,
            answer: answer
          });
          console.log('[SharePlay] Answer enviado com sucesso ao Host.');
        } catch(err) {
          console.error('[SharePlay] Erro ao responder offer no Guest:', err);
        }
      } else if (data.candidate) {
        try {
          await this.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.error('[SharePlay] Erro ao adicionar ICE candidate no Guest:', e);
        }
      }
    });
  },

  // Monta a tela de vídeo e controles touch virtuais para o Player 2
  setupGuestScreen() {
    const container = document.getElementById('game-container');
    if (!container) return;
    container.innerHTML = `
      <div id="guest-screen-wrap" style="position:fixed; inset:0; background:#000; display:flex; align-items:center; justify-content:center; z-index:10; overflow:hidden;">
        <video id="guest-video-stream" autoplay playsinline muted style="height:100vh; height:100dvh; max-height:100vh; width:calc(100vh * (4/3)); max-width:100vw; aspect-ratio:4/3; object-fit:contain; margin:0 auto; box-shadow:0 0 50px rgba(0,0,0,0.95);"></video>
      </div>
    `;

    // Renderiza controles touch virtuais para o Player 2
    this.renderGuestGamepad();
  },

  // Envia comando do controle do Player 2 para o Player 1
  sendInput(btnIndex, val) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      try {
        this.dataChannel.send(JSON.stringify({ btn: btnIndex, val }));
      } catch(e) {}
    }
  },

  // Controles virtuais do Player 2 com visual Arcade Neo Geo e feedback tátil
  renderGuestGamepad() {
    let pad = document.getElementById('guest-gamepad-overlay');
    if (pad) pad.remove();

    pad = document.createElement('div');
    pad.id = 'guest-gamepad-overlay';
    pad.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 99999;
      pointer-events: none;
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
    `;

    pad.innerHTML = `
      <!-- Botões de Topo: Sair e Ativar Som -->
      <div style="position:fixed; top:12px; left:14px; display:flex; gap:8px; pointer-events:auto; z-index:100000;">
        <button id="gpad-btn-exit" style="padding:6px 12px; border-radius:14px; background:rgba(15,23,42,0.85); border:1px solid #ef4444; color:#fca5a5; font-weight:800; font-size:11px; cursor:pointer;">SAIR</button>
        <button id="gpad-btn-sound" style="padding:6px 12px; border-radius:14px; background:rgba(15,23,42,0.85); border:1px solid #00f0ff; color:#67e8f9; font-weight:800; font-size:11px; cursor:pointer;">🔊 SOM</button>
      </div>

      <!-- D-Pad Direcional do Player 2 (Esquerda) -->
      <div style="position:fixed; bottom:20px; left:20px; width:150px; height:150px; pointer-events:auto;">
        <button id="gpad-up" style="position:absolute; top:0; left:50px; width:50px; height:50px; background:rgba(255,255,255,0.14); border:1.5px solid rgba(255,255,255,0.3); border-radius:10px; color:#fff; font-size:1.3rem; box-shadow:0 4px 10px rgba(0,0,0,0.5);">▲</button>
        <button id="gpad-down" style="position:absolute; bottom:0; left:50px; width:50px; height:50px; background:rgba(255,255,255,0.14); border:1.5px solid rgba(255,255,255,0.3); border-radius:10px; color:#fff; font-size:1.3rem; box-shadow:0 4px 10px rgba(0,0,0,0.5);">▼</button>
        <button id="gpad-left" style="position:absolute; top:50px; left:0; width:50px; height:50px; background:rgba(255,255,255,0.14); border:1.5px solid rgba(255,255,255,0.3); border-radius:10px; color:#fff; font-size:1.3rem; box-shadow:0 4px 10px rgba(0,0,0,0.5);">◀</button>
        <button id="gpad-right" style="position:absolute; top:50px; right:0; width:50px; height:50px; background:rgba(255,255,255,0.14); border:1.5px solid rgba(255,255,255,0.3); border-radius:10px; color:#fff; font-size:1.3rem; box-shadow:0 4px 10px rgba(0,0,0,0.5);">▶</button>
      </div>

      <!-- Botões de Ação ABCD Arcade Neo Geo (Direita) -->
      <div style="position:fixed; bottom:20px; right:20px; width:160px; height:160px; pointer-events:auto;">
        <!-- Botão C (Verde) -->
        <button id="gpad-btn-c" style="position:absolute; top:0; left:55px; width:52px; height:52px; border-radius:50%; background:radial-gradient(circle at 35% 30%, #57e389 0%, #33d17a 55%, #26a269 100%); color:#0c381c; font-weight:900; border:2px solid #fff; box-shadow:0 0 15px rgba(51,209,122,0.7); font-size:1.2rem;">C</button>
        <!-- Botão A (Vermelho) -->
        <button id="gpad-btn-a" style="position:absolute; top:55px; left:0; width:52px; height:52px; border-radius:50%; background:radial-gradient(circle at 35% 30%, #f66151 0%, #e01b24 55%, #a51d2d 100%); color:#44070a; font-weight:900; border:2px solid #fff; box-shadow:0 0 15px rgba(224,27,36,0.7); font-size:1.2rem;">A</button>
        <!-- Botão D (Azul) -->
        <button id="gpad-btn-d" style="position:absolute; top:55px; right:0; width:52px; height:52px; border-radius:50%; background:radial-gradient(circle at 35% 30%, #5e97d8 0%, #3584e4 55%, #1c71d8 100%); color:#0b2247; font-weight:900; border:2px solid #fff; box-shadow:0 0 15px rgba(53,132,228,0.7); font-size:1.2rem;">D</button>
        <!-- Botão B (Amarelo) -->
        <button id="gpad-btn-b" style="position:absolute; bottom:0; left:55px; width:52px; height:52px; border-radius:50%; background:radial-gradient(circle at 35% 30%, #f9f06b 0%, #f6d32d 55%, #e5a50a 100%); color:#573a00; font-weight:900; border:2px solid #fff; box-shadow:0 0 15px rgba(246,211,45,0.7); font-size:1.2rem;">B</button>
      </div>

      <!-- Fichas e Start P2: COIN 2 e START 2 (Topo Direito) -->
      <div style="position:fixed; top:12px; right:14px; display:flex; flex-direction:column; gap:6px; pointer-events:auto; z-index:100000;">
        <button id="gpad-btn-select" style="width:78px; height:28px; border-radius:6px; background:rgba(0,0,0,0.75); border:1.5px solid #eab308; color:#fde047; font-weight:900; font-size:10px; cursor:pointer; box-shadow:0 0 10px rgba(234,179,8,0.5);">COIN 2</button>
        <button id="gpad-btn-start" style="width:78px; height:28px; border-radius:6px; background:rgba(0,0,0,0.75); border:1.5px solid #22c55e; color:#86efac; font-weight:900; font-size:10px; cursor:pointer; box-shadow:0 0 10px rgba(34,197,94,0.5);">START 2</button>
      </div>
    `;

    document.body.appendChild(pad);

    // Botão Sair
    const exitBtn = document.getElementById('gpad-btn-exit');
    if (exitBtn) {
      exitBtn.onclick = () => {
        if (confirm('Deseja sair da partida de Player 2?')) {
          window.location.href = 'index.html';
        }
      };
    }

    // Botão Ativar Som
    const soundBtn = document.getElementById('gpad-btn-sound');
    if (soundBtn) {
      soundBtn.onclick = () => {
        const vid = document.getElementById('guest-video-stream');
        if (vid) {
          vid.muted = !vid.muted;
          vid.volume = 1.0;
          soundBtn.textContent = vid.muted ? '🔇 MUDO' : '🔊 SOM ON';
          soundBtn.style.borderColor = vid.muted ? '#64748b' : '#22c55e';
          soundBtn.style.color = vid.muted ? '#94a3b8' : '#86efac';
        }
      };
    }

    // Mapeamento dos botões para o protocolo RetroArch FBNeo:
    // Up: 4, Down: 5, Left: 6, Right: 7
    // A: 1 (Y), B: 0 (B), C: 9 (X), D: 8 (A)
    // Select (Coin 2): 2, Start (Start 2): 3
    const bindings = [
      ['gpad-up', 4],
      ['gpad-down', 5],
      ['gpad-left', 6],
      ['gpad-right', 7],
      ['gpad-btn-a', 1],
      ['gpad-btn-b', 0],
      ['gpad-btn-c', 9],
      ['gpad-btn-d', 8],
      ['gpad-btn-start', 3],
      ['gpad-btn-select', 2]
    ];

    bindings.forEach(([elemId, btnIdx]) => {
      const btn = document.getElementById(elemId);
      if (!btn) return;
      const press = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        btn.style.transform = 'scale(0.88)';
        this.sendInput(btnIdx, 1);
      };
      const release = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        btn.style.transform = 'scale(1)';
        this.sendInput(btnIdx, 0);
      };
      btn.addEventListener('touchstart', press, { passive: false });
      btn.addEventListener('touchend', release, { passive: false });
      btn.addEventListener('touchcancel', release, { passive: false });
      btn.addEventListener('mousedown', press);
      btn.addEventListener('mouseup', release);
    });
  }
};

window.RetroSharePlay = RetroSharePlay;
