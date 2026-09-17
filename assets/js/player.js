/**
 * RetroNFC.com.br — Player Script (play.html) v2.0
 * Leitor de Parâmetros NFC, Inicializador do EmulatorJS e Controles Virtuais
 */

// Mapeamento Expandido de ROMs e Emuladores (Multiconsoles)
const GAMES_MAP = {
  super_mario: {
    title: 'Super Mario World',
    console: 'snes',
    consoleName: 'Super Nintendo',
    romUrl: 'https://raw.githubusercontent.com/joeheyming/emulator/master/snes/roms/smw.sfc',
    icon: '🍄'
  },
  top_gear: {
    title: 'Top Gear',
    console: 'snes',
    consoleName: 'Super Nintendo',
    romUrl: 'https://raw.githubusercontent.com/joeheyming/emulator/master/snes/roms/top_gear.sfc',
    icon: '🏎️'
  },
  donkey_kong: {
    title: 'Donkey Kong Country',
    console: 'snes',
    consoleName: 'Super Nintendo',
    romUrl: 'https://raw.githubusercontent.com/joeheyming/emulator/master/snes/roms/dkc.sfc',
    icon: '🍌'
  },
  zelda_alttp: {
    title: 'Zelda: Link to the Past',
    console: 'snes',
    consoleName: 'Super Nintendo',
    romUrl: 'https://raw.githubusercontent.com/joeheyming/emulator/master/snes/roms/zelda.sfc',
    icon: '🗡️'
  },
  chrono_trigger: {
    title: 'Chrono Trigger',
    console: 'snes',
    consoleName: 'Super Nintendo',
    romUrl: 'https://raw.githubusercontent.com/joeheyming/emulator/master/snes/roms/chrono.sfc',
    icon: '⏳'
  },
  street_fighter: {
    title: 'Street Fighter II Turbo',
    console: 'snes',
    consoleName: 'Super Nintendo',
    romUrl: 'https://raw.githubusercontent.com/joeheyming/emulator/master/snes/roms/sf2.sfc',
    icon: '🥊'
  },
  mortal_kombat_2: {
    title: 'Mortal Kombat II',
    console: 'snes',
    consoleName: 'Super Nintendo',
    romUrl: 'https://raw.githubusercontent.com/joeheyming/emulator/master/snes/roms/mk2.sfc',
    icon: '🐉'
  },
  super_metroid: {
    title: 'Super Metroid',
    console: 'snes',
    consoleName: 'Super Nintendo',
    romUrl: 'https://raw.githubusercontent.com/joeheyming/emulator/master/snes/roms/metroid.sfc',
    icon: '🚀'
  },
  sonic_2: {
    title: 'Sonic the Hedgehog 2',
    console: 'segaMD',
    consoleName: 'Mega Drive',
    romUrl: 'https://raw.githubusercontent.com/joeheyming/emulator/master/genesis/roms/sonic2.md',
    icon: '🦔'
  },
  streets_of_rage_2: {
    title: 'Streets of Rage 2',
    console: 'segaMD',
    consoleName: 'Mega Drive',
    romUrl: 'https://raw.githubusercontent.com/joeheyming/emulator/master/genesis/roms/sor2.md',
    icon: '🥋'
  },
  pokemon_yellow: {
    title: 'Pokémon Yellow Special',
    console: 'gbc',
    consoleName: 'Game Boy Color',
    romUrl: 'https://raw.githubusercontent.com/joeheyming/emulator/master/gb/roms/pokemon.gbc',
    icon: '⚡'
  },
  mega_man_x: {
    title: 'Mega Man X',
    console: 'snes',
    consoleName: 'Super Nintendo',
    romUrl: 'https://raw.githubusercontent.com/joeheyming/emulator/master/snes/roms/mmx.sfc',
    icon: '🤖'
  }
};

let currentGame = null;
let crtActive = true;

document.addEventListener('DOMContentLoaded', () => {
  parseUrlAndBoot();
  initHudControls();
  renderGamePickerList();
});

// Parser de Parâmetros da Tag NFC
function parseUrlAndBoot() {
  const params = new URLSearchParams(window.location.search);
  const gameKey = params.get('game') || params.get('jogo') || params.get('rom');
  
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
    { pct: '25%', text: 'LENDO TAG RETRONFC...' },
    { pct: '50%', text: `LOCALIZANDO ROM: ${game.title.toUpperCase()}...` },
    { pct: '75%', text: 'INICIALIZANDO MOTOR WEBASSEMBLY...' },
    { pct: '100%', text: 'PRONTO! TOQUE NA TELA PARA JOGAR' }
  ];

  let currentStep = 0;
  const interval = setInterval(() => {
    if (currentStep < steps.length) {
      if (progressBar) progressBar.style.width = steps[currentStep].pct;
      if (statusText) statusText.textContent = steps[currentStep].text;
      currentStep++;
    } else {
      clearInterval(interval);
      setTimeout(() => {
        loadEmulatorEngine(game);
      }, 400);
    }
  }, 350);
}

// Carregamento Seguro do EmulatorJS
function loadEmulatorEngine(game) {
  const loader = document.getElementById('nfc-loader');

  window.EJS_player = '#game-container';
  window.EJS_core = game.console;
  window.EJS_gameUrl = game.romUrl;
  window.EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/';
  window.EJS_startOnLoad = true;
  window.EJS_Language = 'pt-BR';
  window.EJS_showMenu = false;
  window.EJS_virtualGamepadSettings = {
    type: 1,
    opacity: 0.75,
    color: '#00f0ff'
  };

  const existingScript = document.getElementById('emulator-loader-script');
  if (existingScript) existingScript.remove();

  const script = document.createElement('script');
  script.id = 'emulator-loader-script';
  script.src = 'https://cdn.emulatorjs.org/stable/data/loader.js';
  script.onload = () => {
    setTimeout(() => {
      if (loader) loader.style.display = 'none';
    }, 1200);
  };
  script.onerror = () => {
    if (loader) {
      loader.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 20px;">⚠️</div>
        <h3 style="color: var(--pink); margin-bottom: 12px;">Modo Demonstração</h3>
        <p style="color: #94a3b8; max-width: 480px; margin-bottom: 24px;">
          O emulador online está pronto para receber suas ROMs locais ou CDN. Para testar com seus próprios arquivos .sfc, adicione-os na pasta <strong>roms/</strong> do seu repositório.
        </p>
        <button onclick="location.reload()" class="btn btn-cyan btn-sm">Tentar Novamente</button>
      `;
    }
  };

  document.body.appendChild(script);
}

// Controles do HUD
function initHudControls() {
  const crtBtn = document.getElementById('btn-toggle-crt');
  const fullscreenBtn = document.getElementById('btn-fullscreen');
  const overlay = document.querySelector('.crt-overlay');

  if (crtBtn && overlay) {
    crtBtn.addEventListener('click', () => {
      crtActive = !crtActive;
      overlay.style.display = crtActive ? 'block' : 'none';
      crtBtn.classList.toggle('active', crtActive);
    });
  }

  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
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