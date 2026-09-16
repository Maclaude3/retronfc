/**
 * RetroNFC.com.br — Script Principal
 * Lógica do Simulador NFC de Smartphone, Catálogo, Checkout WhatsApp e Calculadora B2B
 */

// Configurações Gerais
const CONFIG = {
  whatsappNumber: '5511999999999', // Substitua pelo seu WhatsApp oficial
  currencySymbol: 'R$',
  retailPrice: 29.90,
  wholesalePrice: 7.50,
  suggestedResell: 25.00
};

// Banco de Dados dos Jogos / Cartuchos
const GAMES_DATABASE = [
  {
    id: 'super_mario',
    title: 'Super Mario World',
    console: 'snes',
    consoleName: 'Super Nintendo',
    badgeClass: 'badge-snes',
    icon: '🍄',
    desc: 'O maior clássico de plataforma de todos os tempos. Encoste a tag e jogue com Yoshi pelas 96 fases!',
    romParam: 'super_mario',
    price: 29.90
  },
  {
    id: 'top_gear',
    title: 'Top Gear',
    console: 'snes',
    consoleName: 'Super Nintendo',
    badgeClass: 'badge-snes',
    icon: '🏎️',
    desc: 'Aqueça os motores com a trilha sonora mais nostálgica dos 16-bits. Corridas em pistas clássicas!',
    romParam: 'top_gear',
    price: 29.90
  },
  {
    id: 'donkey_kong',
    title: 'Donkey Kong Country',
    console: 'snes',
    consoleName: 'Super Nintendo',
    badgeClass: 'badge-snes',
    icon: '🍌',
    desc: 'Gráficos pré-renderizados revolucionários e a trilha lendária de David Wise direto no seu bolso.',
    romParam: 'donkey_kong',
    price: 29.90
  },
  {
    id: 'zelda_alttp',
    title: 'Zelda: Link to the Past',
    console: 'snes',
    consoleName: 'Super Nintendo',
    badgeClass: 'badge-snes',
    icon: '🗡️',
    desc: 'Explore Hyrule e o Dark World na jornada definitiva de Link. O ápice dos RPGs de ação.',
    romParam: 'zelda_alttp',
    price: 29.90
  },
  {
    id: 'sonic_2',
    title: 'Sonic the Hedgehog 2',
    console: 'genesis',
    consoleName: 'Mega Drive',
    badgeClass: 'badge-genesis',
    icon: '🦔',
    desc: 'Velocidade máxima em 16-bits com Sonic & Tails na clássica carcaça preta do Mega Drive!',
    romParam: 'sonic_2',
    price: 29.90
  },
  {
    id: 'street_fighter',
    title: 'Street Fighter II Turbo',
    console: 'snes',
    consoleName: 'Super Nintendo',
    badgeClass: 'badge-snes',
    icon: '🥊',
    desc: 'Hadouken no bolso! O jogo de luta definitivo com Ryu, Ken, Chun-Li e todos os guerreiros mundiais.',
    romParam: 'street_fighter',
    price: 29.90
  },
  {
    id: 'pokemon_yellow',
    title: 'Pokémon Yellow Special',
    console: 'gameboy',
    consoleName: 'Game Boy Color',
    badgeClass: 'badge-gb',
    icon: '⚡',
    desc: 'Inicie sua jornada com Pikachu te seguindo por Kanto no inconfundível cartucho amarelo!',
    romParam: 'pokemon_yellow',
    price: 29.90
  },
  {
    id: 'mega_man_x',
    title: 'Mega Man X',
    console: 'snes',
    consoleName: 'Super Nintendo',
    badgeClass: 'badge-snes',
    icon: '🤖',
    desc: 'Ação futurista, dash, escalada em paredes e as armaduras lendárias do robô azul.',
    romParam: 'mega_man_x',
    price: 29.90
  }
];

// Sintetizador Web Audio para Efeitos Sonoros Retrô (Sem arquivos pesados)
const SoundFX = {
  ctx: null,
  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },
  playBeep(freq = 880, type = 'square', duration = 0.1) {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio autoplay restrictions
    }
  },
  playNfcSuccess() {
    this.playBeep(587, 'square', 0.08); // D5
    setTimeout(() => this.playBeep(880, 'square', 0.15), 90); // A5
  }
};

// Inicialização da Página
document.addEventListener('DOMContentLoaded', () => {
  renderCatalog('all');
  initSimulator();
  initWholesaleCalc();
  initFaq();
  initNavbar();
});

// Renderização Dinâmica do Catálogo
function renderCatalog(filter = 'all') {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  const filtered = filter === 'all' 
    ? GAMES_DATABASE 
    : GAMES_DATABASE.filter(g => g.console === filter);

  grid.innerHTML = filtered.map(game => `
    <div class="product-card" data-console="${game.console}">
      <span class="product-badge ${game.badgeClass}">${game.consoleName}</span>
      
      <div class="cartridge-visual">
        <div class="cartridge-top-groove"></div>
        <div class="cartridge-sticker">
          <div class="cartridge-art-icon">${game.icon}</div>
          <div class="cartridge-game-title">${game.title}</div>
          <span class="nfc-chip-indicator" title="Chip NTAG213 Embutido">⚡ NFC</span>
        </div>
      </div>

      <div class="product-info">
        <h3 class="product-title">${game.title}</h3>
        <p class="product-desc">${game.desc}</p>
        
        <div class="product-specs">
          <span class="spec-pill">Chip NTAG213</span>
          <span class="spec-pill">PLA Biodegradável</span>
          <span class="spec-pill">Label Laminada UV</span>
        </div>

        <div class="product-footer">
          <div class="product-price-box">
            <span class="price-label">Preço Unitário</span>
            <span class="price-value">${CONFIG.currencySymbol} ${game.price.toFixed(2).replace('.', ',')}</span>
          </div>

          <div class="product-actions">
            <a href="play.html?game=${game.romParam}" target="_blank" class="btn btn-glass btn-sm" title="Testar no Navegador">
              ▶ Testar
            </a>
            <button onclick="orderViaWhatsApp('${game.title}')" class="btn btn-cyan btn-sm">
              Pedir
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

// Filtros do Catálogo
function filterCatalog(consoleType, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderCatalog(consoleType);
}

// Simulador Interativo de Smartphone NFC
function initSimulator() {
  const trayItems = document.querySelectorAll('.tray-item');
  const phoneScreen = document.getElementById('phone-screen');
  
  if (!trayItems.length || !phoneScreen) return;

  trayItems.forEach(item => {
    item.addEventListener('click', () => {
      trayItems.forEach(t => t.classList.remove('active'));
      item.classList.add('active');
      
      const gameId = item.getAttribute('data-game');
      const game = GAMES_DATABASE.find(g => g.id === gameId);
      
      if (game) {
        triggerNfcTapSimulation(game);
      }
    });
  });
}

function triggerNfcTapSimulation(game) {
  const phoneScreen = document.getElementById('phone-screen');
  if (!phoneScreen) return;

  // Feedback Haptico e Sonoro
  SoundFX.playNfcSuccess();
  if (navigator.vibrate) navigator.vibrate([80, 50, 80]);

  // Animação da Leitura NFC no Celular Virtual
  phoneScreen.innerHTML = `
    <div style="animation: pulse-dot 0.5s ease; width: 100%;">
      <div style="font-size: 2.2rem; margin-bottom: 8px;">📶</div>
      <div style="font-family: var(--font-pixel); font-size: 0.65rem; color: var(--green); margin-bottom: 6px;">
        TAG NFC LIDA!
      </div>
      <div style="font-size: 0.72rem; color: var(--text-muted); margin-bottom: 12px;">
        https://retronfc.com.br/play
      </div>
      <div style="background: rgba(0, 240, 255, 0.15); border: 1px solid var(--cyan); border-radius: 8px; padding: 10px; margin-bottom: 12px;">
        <div style="font-size: 1.8rem; margin-bottom: 4px;">${game.icon}</div>
        <div style="font-weight: 700; font-size: 0.85rem; color: #fff;">${game.title}</div>
        <div style="font-size: 0.7rem; color: var(--cyan);">${game.consoleName}</div>
      </div>
      <a href="play.html?game=${game.romParam}" target="_blank" class="btn btn-cyan btn-sm" style="width: 100%; font-size: 0.75rem; padding: 8px;">
        ▶ Abrir Jogo
      </a>
    </div>
  `;
}

// Calculadora de Lucro para Atacado e Lojistas
function initWholesaleCalc() {
  const slider = document.getElementById('wholesale-qty-slider');
  const qtyDisplay = document.getElementById('wholesale-qty-val');
  const costDisplay = document.getElementById('wholesale-total-cost');
  const revDisplay = document.getElementById('wholesale-total-rev');
  const profitDisplay = document.getElementById('wholesale-total-profit');

  if (!slider) return;

  function updateCalc() {
    const qty = parseInt(slider.value, 10);
    const totalCost = qty * CONFIG.wholesalePrice;
    const totalRevenue = qty * CONFIG.suggestedResell;
    const totalProfit = totalRevenue - totalCost;

    if (qtyDisplay) qtyDisplay.textContent = `${qty} unidades`;
    if (costDisplay) costDisplay.textContent = `${CONFIG.currencySymbol} ${totalCost.toFixed(2).replace('.', ',')}`;
    if (revDisplay) revDisplay.textContent = `${CONFIG.currencySymbol} ${totalRevenue.toFixed(2).replace('.', ',')}`;
    if (profitDisplay) profitDisplay.textContent = `+ ${CONFIG.currencySymbol} ${totalProfit.toFixed(2).replace('.', ',')}`;
  }

  slider.addEventListener('input', updateCalc);
  updateCalc();
}

// Checkout & Contato via WhatsApp
function orderViaWhatsApp(gameTitle = '') {
  let message = '';
  if (gameTitle) {
    message = `Olá! Vi o site RetroNFC.com.br e gostaria de encomendar o chaveiro NFC do *${gameTitle}* (R$ 29,90). Como podemos combinar o envio?`;
  } else {
    message = `Olá! Conheci a RetroNFC.com.br e gostaria de mais detalhes sobre os chaveiros gamers colecionáveis com NFC!`;
  }

  const url = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

function orderWholesaleWhatsApp() {
  const slider = document.getElementById('wholesale-qty-slider');
  const qty = slider ? slider.value : '50';
  const message = `Olá! Tenho interesse no pacote de atacado para revenda da RetroNFC (${qty} chaveiros com expositor giratório). Gostaria de ver o catálogo completo e prazos!`;
  const url = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

// Acordeão de FAQ
function initFaq() {
  document.querySelectorAll('.faq-question').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.parentElement;
      const isOpen = item.classList.contains('open');
      
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
}

// Navbar Scroll Effect
function initNavbar() {
  const header = document.querySelector('.header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

// Toggle Menu Mobile
function toggleMobileMenu() {
  const nav = document.querySelector('.nav-links');
  if (nav) {
    nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
    nav.style.flexDirection = 'column';
    nav.style.position = 'absolute';
    nav.style.top = '100%';
    nav.style.left = '0';
    nav.style.width = '100%';
    nav.style.background = '#07090e';
    nav.style.padding = '20px';
    nav.style.borderBottom = '1px solid var(--border-glow)';
  }
}