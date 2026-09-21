/**
 * RetroNFC.com.br — Player Script (play.html) v2.0
 * Leitor de Parâmetros NFC, Inicializador do EmulatorJS e Controles Virtuais
 */

// Mapeamento Expandido de ROMs e Emuladores (Multiconsoles: SNES, PS1, N64, GBA, Genesis, Arcade)

// Mapeamento de apelidos e atalhos de jogos
const GAME_ALIASES = {
  'sonic': 'sonic_2',
  'sonic2': 'sonic_2',
  'kof2002': 'kof_2002',
  'kof': 'kof_2002',
  'metal_slug_x': 'metal_slug',
  'metalslug': 'metal_slug',
  'cadillacs': 'cadillacs',
  'cadillac': 'cadillacs',
  'dino': 'cadillacs',
  'sf2': 'street_fighter',
  'dkc': 'donkey_kong',
  'smw': 'super_mario',
  'mk2': 'mortal_kombat_2',
  'sor2': 'streets_of_rage_2',
  'zelda': 'zelda_alttp'
};

function resolveGameKey(rawKey) {
  if (!rawKey) return null;
  // Remove aspas, barras invertidas ou caracteres de escape
  const clean = rawKey.replace(/['"\/]/g, '').trim().toLowerCase();
  return GAME_ALIASES[clean] || clean;
}

const GAMES_MAP = {
    cadillacs: {
    title: 'Cadillacs and Dinosaurs',
    console: 'arcade',
    consoleName: 'Capcom Arcade (MAME)',
    romUrl: 'roms/dino.zip',
    icon: '🦖'
  },
  // SNES (Super Nintendo)
  super_mario: {
    title: 'Super Mario World',
    console: 'snes',
    consoleName: 'Super Nintendo',
    romUrl: 'roms/super_mario.smc',
    icon: '🍄'
  },
  top_gear: {
    title: 'Top Gear',
    console: 'snes',
    consoleName: 'Super Nintendo',
    romUrl: 'roms/top_gear.smc',
    icon: '🏎️'
  },
  donkey_kong: {
    title: 'Donkey Kong Country',
    console: 'snes',
    consoleName: 'Super Nintendo',
    romUrl: 'roms/donkey_kong.smc',
    icon: '🍌'
  },
  super_mario_kart: {
    title: 'Super Mario Kart',
    console: 'snes',
    consoleName: 'Super Nintendo',
    romUrl: 'roms/super_mario_kart.smc',
    icon: '🏎️'
  },
  zelda_alttp: {
    title: 'Zelda: Link to the Past',
    console: 'snes',
    consoleName: 'Super Nintendo',
    romUrl: 'roms/zelda_alttp.smc',
    icon: '🗡️'
  },
  street_fighter: {
    title: 'Street Fighter II Turbo',
    console: 'snes',
    consoleName: 'Super Nintendo',
    romUrl: 'roms/street_fighter.smc',
    icon: '🥊'
  },
  mega_man_x: {
    title: 'Mega Man X',
    console: 'snes',
    consoleName: 'Super Nintendo',
    romUrl: 'roms/mega_man_x.smc',
    icon: '🤖'
  },
  chrono_trigger: {
    title: 'Chrono Trigger',
    console: 'snes',
    consoleName: 'Super Nintendo',
    romUrl: 'https://raw.githubusercontent.com/joeheyming/emulator/master/snes/roms/chrono.sfc',
    icon: '⏳'
  },
  super_metroid: {
    title: 'Super Metroid',
    console: 'snes',
    consoleName: 'Super Nintendo',
    romUrl: 'https://raw.githubusercontent.com/joeheyming/emulator/master/snes/roms/metroid.sfc',
    icon: '🚀'
  },

  // MEGA DRIVE / SEGA GENESIS
  moonwalker: {
    title: "Michael Jackson's Moonwalker",
    console: 'segaMD',
    consoleName: 'Mega Drive',
    romUrl: 'roms/moonwalker.bin',
    icon: '🎩'
  },
  sonic_2: {
    title: 'Sonic the Hedgehog 2',
    console: 'segaMD',
    consoleName: 'Mega Drive',
    romUrl: 'roms/sonic_2.bin',
    icon: '🦔'
  },
  mortal_kombat_2: {
    title: 'Mortal Kombat II',
    console: 'segaMD',
    consoleName: 'Mega Drive',
    romUrl: 'roms/mortal_kombat_2.bin',
    icon: '🐉'
  },
  streets_of_rage_2: {
    title: 'Streets of Rage 2',
    console: 'segaMD',
    consoleName: 'Mega Drive',
    romUrl: 'roms/streets_of_rage_2.bin',
    icon: '🥋'
  },
  golden_axe: {
    title: 'Golden Axe',
    console: 'segaMD',
    consoleName: 'Mega Drive',
    romUrl: 'roms/golden_axe.bin',
    icon: '🪓'
  },

  // PS1
  crash_bandicoot: {
    title: 'Crash Bandicoot',
    console: 'psx',
    consoleName: 'PlayStation 1',
    romUrl: 'roms/crash.chd',
    icon: '🦊'
  },
  tekken_3: {
    title: 'Tekken 3',
    console: 'psx',
    consoleName: 'PlayStation 1',
    romUrl: 'roms/tekken3.chd',
    icon: '🥋'
  },
  winning_eleven: {
    title: 'Winning Eleven / Bomba Patch',
    console: 'psx',
    consoleName: 'PlayStation 1',
    romUrl: 'roms/we.chd',
    icon: '⚽'
  },
  gran_turismo: {
    title: 'Gran Turismo',
    console: 'psx',
    consoleName: 'PlayStation 1',
    romUrl: 'roms/gt.chd',
    icon: '🏎️'
  },
  resident_evil: {
    title: 'Resident Evil Director s Cut',
    console: 'psx',
    consoleName: 'PlayStation 1',
    romUrl: 'roms/re.chd',
    icon: '🧟'
  },

  // N64
  mario_64: {
    title: 'Super Mario 64',
    console: 'n64',
    consoleName: 'Nintendo 64',
    romUrl: 'https://raw.githubusercontent.com/joeheyming/emulator/master/n64/roms/sm64.z64',
    icon: '⭐'
  },
  mario_kart_64: {
    title: 'Mario Kart 64',
    console: 'n64',
    consoleName: 'Nintendo 64',
    romUrl: 'https://raw.githubusercontent.com/joeheyming/emulator/master/n64/roms/mk64.z64',
    icon: '🏎️'
  },
  zelda_oot: {
    title: 'Zelda: Ocarina of Time',
    console: 'n64',
    consoleName: 'Nintendo 64',
    romUrl: 'https://raw.githubusercontent.com/joeheyming/emulator/master/n64/roms/oot.z64',
    icon: '🧝'
  },
  goldeneye_007: {
    title: '007 GoldenEye',
    console: 'n64',
    consoleName: 'Nintendo 64',
    romUrl: 'https://raw.githubusercontent.com/joeheyming/emulator/master/n64/roms/007.z64',
    icon: '🔫'
  },

  // GBA
  pokemon_firered: {
    title: 'Pokémon FireRed',
    console: 'gba',
    consoleName: 'Game Boy Advance',
    romUrl: 'https://raw.githubusercontent.com/joeheyming/emulator/master/gba/roms/firered.gba',
    icon: '🔥'
  },
  pokemon_emerald: {
    title: 'Pokémon Emerald',
    console: 'gba',
    consoleName: 'Game Boy Advance',
    romUrl: 'https://raw.githubusercontent.com/joeheyming/emulator/master/gba/roms/emerald.gba',
    icon: '🐉'
  },
  mario_kart_gba: {
    title: 'Mario Kart Super Circuit',
    console: 'gba',
    consoleName: 'Game Boy Advance',
    romUrl: 'https://raw.githubusercontent.com/joeheyming/emulator/master/gba/roms/mksc.gba',
    icon: '🍄'
  },
  zelda_minish_cap: {
    title: 'Zelda: The Minish Cap',
    console: 'gba',
    consoleName: 'Game Boy Advance',
    romUrl: 'https://raw.githubusercontent.com/joeheyming/emulator/master/gba/roms/minish.gba',
    icon: '👒'
  },

  // Arcade
  kof_98: {
    title: 'The King of Fighters 98',
    console: 'arcade',
    consoleName: 'Fliperama / Neo Geo',
    romUrl: 'roms/kof98.zip',
    icon: '🔥'
  },
  kof_2002: {
    title: 'The King of Fighters 2002',
    console: 'arcade',
    consoleName: 'Fliperama / Neo Geo',
    romUrl: 'roms/kof2002.zip',
    biosUrl: 'roms/neogeo.zip',
    icon: '??'
  },
  metal_slug: {
    title: 'Metal Slug Super Vehicle',
    console: 'arcade',
    consoleName: 'Fliperama / Neo Geo',
    romUrl: 'roms/mslug.zip',
    biosUrl: 'roms/neogeo.zip',
    icon: '??'
  },

  // GBC
  pokemon_yellow: {
    title: 'Pokémon Yellow Special',
    console: 'gbc',
    consoleName: 'Game Boy Color',
    romUrl: 'https://raw.githubusercontent.com/joeheyming/emulator/master/gb/roms/pokemon.gbc',
    icon: '⚡'
  }
};

// Sincroniza automaticamente com o Mega Catálogo (games-data.js)
if (typeof GAMES_DATABASE !== 'undefined') {
  GAMES_DATABASE.forEach(g => {
    if (!GAMES_MAP[g.romParam]) {
      let core = g.console;
      if (core === 'ps1') core = 'psx';
      if (core === 'genesis') core = 'segaMD';
      if (core === 'gameboy') core = 'gbc';
      if (core === 'arcade') core = 'fba';
      GAMES_MAP[g.romParam] = {
        title: g.title,
        console: core,
        consoleName: g.consoleName,
        romUrl: `roms/${g.romParam}.sfc`,
        icon: g.icon
      };
    }
  });
}

let currentGame = null;
let crtActive = true;


function isMobileOrSimulator() {
  // Permite mobile real ou telas reduzidas simulando smartphone
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isSmallScreen = window.innerWidth <= 820;
  return isMobileUA || isSmallScreen;
}


// ==========================================================================
// 🔒 RETROPASS DIGITAL - VALIDADOR ANTIFRAUDE E EXPIRAÇÃO SUPABASE
// ==========================================================================
const SUPABASE_CONFIG = {
  url: 'https://wxgyhxwykspgdtszhuen.supabase.co',
  key: 'sb_publishable_fhnF2vvyh0f-kP1GSTB8Xg_Rb-Bk-WG'
};

async function validateRetroPass(token, requestedGameKey) {
  const guard = document.getElementById('pass-guard-screen');
  const guardTitle = document.getElementById('pass-guard-title');
  const guardDesc = document.getElementById('pass-guard-desc');
  const guardIcon = document.getElementById('pass-guard-icon');

  function showBlock(icon, title, desc) {
    if (guardIcon) guardIcon.textContent = icon;
    if (guardTitle) guardTitle.textContent = title;
    if (guardDesc) guardDesc.innerHTML = desc;
    if (guard) guard.style.display = 'flex';
    const loader = document.getElementById('nfc-loader');
    if (loader) loader.style.display = 'none';
  }

  // Gera ou resgata a digital única do aparelho atual no navegador (Device ID)
  let deviceId = localStorage.getItem('retronfc_pass_device_id');
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
    localStorage.setItem('retronfc_pass_device_id', deviceId);
  }

  try {
    const resp = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/retronfc_passes?token=eq.${encodeURIComponent(token)}&select=*`, {
      headers: {
        'apikey': SUPABASE_CONFIG.key,
        'Authorization': `Bearer ${SUPABASE_CONFIG.key}`
      }
    });

    if (!resp.ok) {
      showBlock('⚠️', 'ERRO NO SERVIDOR', 'Não foi possível consultar seu passe no momento. Tente novamente em alguns instantes.');
      return false;
    }

    const rows = await resp.json();
    if (!rows || rows.length === 0) {
      showBlock('❌', 'PASSE NÃO ENCONTRADO', 'Este QR Code ou token de ativação não existe no sistema oficial da RetroNFC.<br><br>Verifique se você escaneou o código correto.');
      return false;
    }

    const pass = rows[0];

    // Se o passe tiver jogo específico vinculado e o link pedir outro jogo diferente
    if (requestedGameKey && pass.game_key && requestedGameKey !== pass.game_key) {
      showBlock('🚫', 'JOGO INCOMPATÍVEL', `Este RetroPass pertence exclusivamente ao jogo <strong>${pass.game_title}</strong> e não pode ser transferido para outro clássico.`);
      return false;
    }

    const now = new Date();

    // CASO 1: Primeiro acesso (Ativação automática e vinculação ao aparelho)
    if (pass.status === 'disponivel' || !pass.device_id) {
      const expDate = new Date();
      expDate.setMonth(expDate.getMonth() + (pass.validade_meses || 6));

      await fetch(`${SUPABASE_CONFIG.url}/rest/v1/retronfc_passes?token=eq.${encodeURIComponent(token)}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_CONFIG.key,
          'Authorization': `Bearer ${SUPABASE_CONFIG.key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'ativo',
          device_id: deviceId,
          ativado_em: now.toISOString(),
          expira_em: expDate.toISOString()
        })
      });

      console.log(`[RetroPass] Passe ${token} ativado com sucesso! Válido até ${expDate.toLocaleDateString('pt-BR')}.`);
      return pass.game_key || requestedGameKey;
    }

    // CASO 2: Passe expirado após os 6 meses
    if (pass.expira_em && now > new Date(pass.expira_em)) {
      showBlock('⏰', 'RETROPASS EXPIRADO', `O período de validade de 6 meses deste passe encerrou em <strong>${new Date(pass.expira_em).toLocaleDateString('pt-BR')}</strong>.<br><br>Adquira uma renovação semestral ou faça upgrade para a Tag NFC Vitalícia!`);
      return false;
    }

    // CASO 3: Tentativa de compartilhamento por print / outro celular
    if (pass.device_id && pass.device_id !== deviceId) {
      showBlock('⛔', 'CONSOLE BLOQUEADO', `Este RetroPass já está vinculado e ativado no smartphone do comprador original e <strong>não pode ser compartilhado por print de tela</strong>.<br><br>Adquira o seu passe individual com acesso exclusivo no site.`);
      return false;
    }

    // Dono legítimo no aparelho original dentro do prazo!
    return pass.game_key || requestedGameKey;

  } catch (err) {
    console.error('Erro na validação do RetroPass:', err);
    showBlock('⚠️', 'ERRO DE CONEXÃO', 'Verifique sua conexão com a internet para validar seu RetroPass.');
    return false;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const isAdministrator = checkAdminTestAccess();

  // Bloqueio Desktop só se aplica a clientes comuns
  if (!isMobileOrSimulator() && !isAdministrator) {
    const guard = document.getElementById('desktop-guard-screen');
    if (guard) guard.style.display = 'flex';
    const loader = document.getElementById('nfc-loader');
    if (loader) loader.style.display = 'none';
    return;
  }
  await parseUrlAndBoot();
  initHudControls();
  renderGamePickerList();
});

// Parser de Parâmetros da Tag NFC

// ==========================================================================
// 👑 VERIFICAÇÃO DE SESSÃO DO ADMINISTRADOR PARA TESTES DE JOGOS
// ==========================================================================
function checkAdminTestAccess() {
  const params = new URLSearchParams(window.location.search);
  const isAdminParam = params.get('admin') === '1';
  let isAdminSession = false;
  try {
    const raw = sessionStorage.getItem('retronfc_session') || localStorage.getItem('retronfc_session');
    if (raw) {
      const sess = JSON.parse(raw);
      if (sess && sess.authenticated && sess.expiresAt > Date.now()) {
        isAdminSession = true;
      }
    }
  } catch (e) {}

  return isAdminParam && (isAdminSession || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
}

function showAdminTestBadge(gameTitle) {
  if (document.getElementById('admin-test-hud-badge')) return;
  const badge = document.createElement('div');
  badge.id = 'admin-test-hud-badge';
  badge.style.cssText = `
    position: fixed;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(15, 23, 42, 0.9);
    border: 1px solid rgba(0, 240, 255, 0.6);
    border-radius: 20px;
    padding: 4px 14px;
    z-index: 9999999;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.6);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    transition: opacity 0.5s ease, transform 0.5s ease;
  `;
  badge.innerHTML = `
    <span style="font-size: 0.9rem;">👑</span>
    <span style="color: #00f0ff; font-weight: 700; font-size: 0.72rem; letter-spacing: 0.3px;">TESTE ADMIN: ${gameTitle || ''}</span>
    <button type="button" onclick="document.getElementById('admin-test-hud-badge').remove()" style="background: rgba(239, 68, 68, 0.25); border: 1px solid #ef4444; color: #fca5a5; font-size: 0.68rem; font-weight: 700; padding: 1px 6px; border-radius: 10px; cursor: pointer;">✕</button>
  `;
  document.body.appendChild(badge);

  // Auto-esmaece apos 3.5 segundos para liberar a visao completa do jogo
  setTimeout(() => {
    if (badge && badge.parentNode) {
      badge.style.opacity = '0';
      badge.style.pointerEvents = 'none';
      badge.style.transform = 'translateX(-50%) translateY(-10px)';
      setTimeout(() => badge.remove(), 600);
    }
  }, 3500);
}

async function parseUrlAndBoot() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('pass') || params.get('token') || params.get('p');
  let gameKey = params.get('game') || params.get('jogo') || params.get('rom');

  const isAdministrator = checkAdminTestAccess();

  // Sanitiza a chave do jogo recebida na URL
  gameKey = resolveGameKey(gameKey);

  // Se for o Administrador testando a partir do painel
  if (isAdministrator) {
    console.log('[RetroNFC] Acesso de Administrador confirmado para teste de emulação do jogo:', gameKey);
    const loader = document.getElementById('nfc-loader');
    if (loader) loader.style.display = 'none';

    if (gameKey && GAMES_MAP[gameKey]) {
      currentGame = GAMES_MAP[gameKey];
    } else if (gameKey) {
      // Jogo avulso ou customizado
      currentGame = {
        title: gameKey.replace(/_/g, ' ').toUpperCase(),
        console: params.get('console') || 'snes',
        consoleName: 'Console Retrô',
        romUrl: `roms/${gameKey}.smc`,
        icon: '🎮'
      };
    } else {
      currentGame = GAMES_MAP['super_mario'];
    }
    showAdminTestBadge(currentGame.title);
    bootGame(currentGame);
    return;
  }

  // Se houver token de RetroPass QR Code, valida no Supabase!
  if (token) {
    const loader = document.getElementById('nfc-loader');
    const statusText = document.getElementById('loader-status-text');
    if (loader) loader.style.display = 'flex';
    if (statusText) statusText.textContent = 'VALIDANDO RETROPASS DIGITAL...';

    const validGameKey = await validateRetroPass(token, gameKey);
    if (!validGameKey) {
      return; // Bloqueado pelo validador
    }
    gameKey = validGameKey;
  }
  
  if (gameKey && GAMES_MAP[gameKey]) {
    currentGame = GAMES_MAP[gameKey];
    bootGame(currentGame);
  } else if (gameKey) {
    currentGame = {
      title: gameKey.replace(/_/g, ' ').toUpperCase(),
      console: params.get('console') || 'snes',
      consoleName: 'Console Retrô',
      romUrl: `roms/${gameKey}.sfc`,
      icon: '🎮'
    };
    bootGame(currentGame);
  } else {
    openGamePicker();
  }
}

// Inicialização com Animação de Carregamento da Tag NFC
function bootGame(game) {
  const loader = document.getElementById('nfc-loader');
  const hudTitle = document.getElementById('hud-game-title');
  const progressBar = document.getElementById('progress-bar-fill');
  const statusText = document.getElementById('loader-status-text');

  if (hudTitle) hudTitle.textContent = `${game.icon} ${game.title}`;
  if (loader) loader.style.display = 'flex';

  const steps = [
    { pct: '30%', text: 'LENDO TAG RETRONFC...' },
    { pct: '65%', text: `SINCRONIZANDO: ${game.title.toUpperCase()}...` },
    { pct: '90%', text: 'CONFIGURANDO CONTROLES TOUCH RETRO...' },
    { pct: '100%', text: 'PRONTO!' }
  ];

  let currentStep = 0;
  const interval = setInterval(() => {
    if (currentStep < steps.length) {
      if (progressBar) progressBar.style.width = steps[currentStep].pct;
      if (statusText) statusText.textContent = steps[currentStep].text;
      currentStep++;
    } else {
      clearInterval(interval);
      showStartPrompt(game);
    }
  }, 250);
}

function showStartPrompt(game) {
  const loader = document.getElementById('nfc-loader');
  const statusText = document.getElementById('loader-status-text');
  
  if (statusText) {
    statusText.innerHTML = `
      <div style="font-size: 1.2rem; color: #67e8f9; font-weight: 800; margin-bottom: 18px; text-shadow: 0 0 15px rgba(0,240,255,0.7);">
        🎮 ${game.title} Sincronizado!
      </div>
      <button id="btn-start-play" class="btn btn-cyan btn-lg" style="font-size: 1.25rem; font-weight: 900; padding: 20px 40px; border-radius: 9999px; background: #00f0ff; color: #05070d; border: 2px solid #fff; box-shadow: 0 0 35px rgba(0, 240, 255, 0.95); cursor: pointer; animation: pulse 1.5s infinite; letter-spacing: 0.5px;">
        ▶️ TOQUE PARA JOGAR
      </button>
      <div style="margin-top: 14px; font-size: 0.85rem; color: #94a3b8;">
        📱 Abre automaticamente em Tela Cheia com controles touch!
      </div>
    `;

    const startBtn = document.getElementById('btn-start-play');
    let hasTriggered = false;
    const triggerStart = (e) => {
      if (hasTriggered) return;
      hasTriggered = true;
      if (e && e.preventDefault) e.preventDefault();

      // Ativa Tela Cheia automaticamente no gesto do toque
      const elem = document.documentElement;
      const requestFS = elem.requestFullscreen || elem.webkitRequestFullscreen || elem.mozRequestFullScreen || elem.msRequestFullscreen;
      if (requestFS) {
        try { requestFS.call(elem); } catch(err) {}
      }

      // Sugere / trava orientação horizontal para pegada de controle
      if (screen.orientation && screen.orientation.lock) {
        try { screen.orientation.lock('landscape').catch(() => {}); } catch(err) {}
      }

      loadEmulatorEngine(game);
      if (loader) loader.style.display = 'none';
    };

    if (startBtn) {
      startBtn.addEventListener('click', triggerStart);
      startBtn.addEventListener('touchend', triggerStart);
    }
  } else {
    loadEmulatorEngine(game);
    if (loader) loader.style.display = 'none';
  }
}

// Carregamento Seguro do EmulatorJS com Controles Touch Mobile e Tela Cheia
function loadEmulatorEngine(game) {
  const container = document.getElementById('game-container');
  if (container) container.innerHTML = '';

  const absoluteRomUrl = new URL(game.romUrl, window.location.href).href;

  window.EJS_player = '#game-container';
  let targetCore = game.console || 'snes';
  if (targetCore === 'fba' || targetCore === 'neogeo' || targetCore === 'fbneo') {
    targetCore = 'arcade';
  }
  window.EJS_core = targetCore;
  window.EJS_gameUrl = absoluteRomUrl;
  window.EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/';

  // Suporte a BIOS de Neo Geo para Arcade
  if (targetCore === 'arcade' && game.biosUrl) {
    window.EJS_biosUrl = new URL(game.biosUrl, window.location.href).href;
  }
  window.EJS_gameName = game.title;
  window.EJS_startOnLoaded = true;
  window.EJS_fullscreenOnLoaded = true;
  window.EJS_color = '#00f0ff';
  window.EJS_language = 'pt-BR';
  window.EJS_threads = false;
  window.EJS_defaultOptions = {
    'video_smooth': 'false',
    'video_vsync': 'true'
  };

  // Garante controles touch e menu de 3 barrinhas visíveis e ativos no smartphone
  window.EJS_onGameStart = () => {
    if (window.EJS_emulator) {
      window.EJS_emulator.touch = true;
      if (window.EJS_emulator.virtualGamepad) {
        window.EJS_emulator.virtualGamepad.style.display = 'block';
        window.EJS_emulator.virtualGamepad.style.opacity = '1';
      }
      if (window.EJS_emulator.elements && window.EJS_emulator.elements.menuToggle) {
        window.EJS_emulator.elements.menuToggle.style.display = 'flex';
        window.EJS_emulator.elements.menuToggle.style.opacity = '1';
      }
    }
    // Suaviza o HUD após o jogo iniciar para dar foco 100% na tela do jogo
    setTimeout(() => {
      const hud = document.querySelector('.arcade-hud');
      if (hud) hud.classList.add('auto-hide');
    }, 2500);
  };

  const existingScript = document.getElementById('emulator-loader-script');
  if (existingScript) existingScript.remove();

  const script = document.createElement('script');
  script.id = 'emulator-loader-script';
  script.src = 'https://cdn.emulatorjs.org/stable/data/loader.js';
  document.body.appendChild(script);
}

// Controles do HUD
function initHudControls() {

  // Conecta o botão flutuante de Sair da Tela Cheia
  const floatingExitBtn = document.getElementById('btn-floating-exit-fs');
  if (floatingExitBtn) {
    floatingExitBtn.addEventListener('click', () => {
      if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) {
        if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      } else {
        window.location.href = 'index.html';
      }
    });

    // Atualiza o texto do botão conforme entra/sai de tela cheia
    const updateFsBtnText = () => {
      const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
      floatingExitBtn.innerHTML = isFs ? '⛶ Sair' : '🏠 Loja';
    };
    document.addEventListener('fullscreenchange', updateFsBtnText);
    document.addEventListener('webkitfullscreenchange', updateFsBtnText);
  }

  const crtBtn = document.getElementById('btn-toggle-crt');
  const fullscreenBtn = document.getElementById('btn-fullscreen');
  const overlay = document.querySelector('.crt-overlay');

  if (crtBtn && overlay) {
    crtBtn.addEventListener('click', () => {
      crtActive = !crtActive;
      overlay.style.display = crtActive ? 'block' : 'none';
      crtBtn.classList.toggle('active', crtActive);
      crtBtn.innerHTML = crtActive ? '📺 CRT Scanlines' : '✨ Imagem HD';
    });
  }

  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        const elem = document.documentElement;
        if (elem.requestFullscreen) elem.requestFullscreen().catch(() => {});
        else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
      } else {
        if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      }
    });
  }
}

// Seletor de Jogos (Modal)
function renderGamePickerList() {
  const list = document.getElementById('picker-games-list');
  if (!list) return;

  list.innerHTML = Object.keys(GAMES_MAP).map(key => {
    const game = GAMES_MAP[key];
    return `
      <a href="play.html?game=${key}" class="picker-item">
        <div class="picker-icon">${game.icon}</div>
        <div>
          <div class="picker-title">${game.title}</div>
          <div class="picker-console">${game.consoleName}</div>
        </div>
      </a>
    `;
  }).join('');
}

function openGamePicker() {
  const modal = document.getElementById('game-picker-modal');
  if (modal) modal.classList.add('active');
}

function closeGamePicker() {
  const modal = document.getElementById('game-picker-modal');
  if (modal) modal.classList.remove('active');
}

// Exibe opção de carregar ROM local se o link remoto falhar
function showRomPickerFallback(game) {
  const loader = document.getElementById('nfc-loader');
  if (loader) {
    loader.innerHTML = `
      <div style="font-size: 3rem; margin-bottom: 16px;">🎮</div>
      <h3 style="color: var(--cyan); margin-bottom: 8px;">Pronto para Rodar: ${game.title}</h3>
      <p style="color: #94a3b8; max-width: 460px; font-size: 0.9rem; margin-bottom: 24px;">
        Para jogar este clássico agora, selecione o arquivo da ROM (.sfc, .md, .gba) do seu celular ou computador:
      </p>
      
      <label class="btn btn-cyan btn-md" style="cursor: pointer; margin-bottom: 16px; display: inline-flex; align-items: center; gap: 8px;">
        📁 Carregar Arquivo de ROM (.sfc / .md)
        <input type="file" id="local-rom-file-input" accept=".sfc,.smc,.md,.gen,.gba,.gbc,.zip" style="display: none;" onchange="bootFromLocalFile(this, '${game.console}')">
      </label>

      <div>
        <a href="index.html#catalogo" class="btn btn-glass btn-sm">← Voltar ao Catálogo</a>
      </div>
    `;
  }
}

function bootFromLocalFile(input, consoleCore) {
  const file = input.files[0];
  if (!file) return;

  const objectUrl = URL.createObjectURL(file);
  const loader = document.getElementById('nfc-loader');
  if (loader) loader.style.display = 'none';

  window.EJS_player = '#game-container';
  window.EJS_core = consoleCore || 'snes';
  window.EJS_gameUrl = objectUrl;
  window.EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/';
  window.EJS_startOnLoad = true;
  window.EJS_Language = 'pt-BR';
  window.EJS_virtualGamepadSettings = {
    type: 1,
    opacity: 0.75,
    color: '#00f0ff'
  };

  const script = document.createElement('script');
  script.src = 'https://cdn.emulatorjs.org/stable/data/loader.js';
  document.body.appendChild(script);
}

// Sincronizacao Dinamica de Viewport para iOS Safari e Android
function syncRealViewportHeight() {
  const vh = window.innerHeight;
  document.documentElement.style.setProperty('--real-vh', `${vh}px`);
  const viewport = document.getElementById('player-viewport');
  if (viewport) {
    viewport.style.height = `${vh}px`;
  }
  const container = document.getElementById('game-container');
  if (container) {
    container.style.height = `${Math.max(100, vh - 36)}px`;
  }
}
window.addEventListener('resize', syncRealViewportHeight);
window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    syncRealViewportHeight();
    window.dispatchEvent(new Event('resize'));
  }, 200);
});
document.addEventListener('DOMContentLoaded', syncRealViewportHeight);
syncRealViewportHeight();
