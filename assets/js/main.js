/**
 * RetroNFC.com.br — Script Principal v3.0
 * Lógica do Simulador NFC, Mega Catálogo com Filtros de Console e Gênero,
 * Busca em Tempo Real, Paginação Inteligente e Checkout WhatsApp com Jarvis
 */

const CONFIG = {
  whatsappNumber: '5561991252332', // WhatsApp oficial integrado com Jarvis
  currencySymbol: 'R$',
  retailPrice: 24.99,
  launchPassPrice: 9.99,
  wholesalePrice: 7.50,
  wholesaleMinQty: 20,
  suggestedResell: 25.00,
  // Verifica se o modo de vendas é 100% digital (padrão true enquanto não tem impressora 3D)
  get isDigitalLaunch() {
    return localStorage.getItem('retronfc_sales_mode') !== 'physical_active';
  }
};

// Efeitos Sonoros Retrô Sintetizados (Web Audio API)
const SoundFX = {
  ctx: null,
  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },
  playBeep(freq = 880, type = 'square', duration = 0.08) {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  },
  playNfcSuccess() {
    this.playBeep(523.25, 'square', 0.06); // C5
    setTimeout(() => this.playBeep(659.25, 'square', 0.06), 70); // E5
    setTimeout(() => this.playBeep(783.99, 'square', 0.12), 140); // G5
  },
  playClick() {
    this.playBeep(440, 'triangle', 0.03);
  }
};

let currentFilter = 'all';
let currentGenre = 'all';
let currentSearchTerm = '';
let displayLimit = 15;
let activeCustomizingGame = null;

document.addEventListener('DOMContentLoaded', () => {
  renderCatalog();
  initShowcaseCarousel();
  initParallax();
  initSimulator();
  initWholesaleCalc();
  initFaq();
  initNavbar();
  initSearch();
  initCart();
});

// Renderização do Catálogo Completo com Filtros Múltiplos
function renderCatalog() {
  const grid = document.getElementById('products-grid');
  const countEl = document.getElementById('catalog-results-count');
  if (!grid) return;

  const filtered = GAMES_DATABASE.filter(game => {
    const matchConsole = currentFilter === 'all' || game.console === currentFilter;
    const matchGenre = currentGenre === 'all' || game.genre === currentGenre;
    const matchSearch = currentSearchTerm === '' || 
      game.title.toLowerCase().includes(currentSearchTerm) ||
      game.tags.toLowerCase().includes(currentSearchTerm);
    return matchConsole && matchGenre && matchSearch;
  });

  if (countEl) {
    countEl.textContent = `Exibindo ${Math.min(displayLimit, filtered.length)} de ${filtered.length} clássicos`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
        <div style="font-size: 3.5rem; margin-bottom: 12px;">🔍</div>
        <h3 style="color: #fff; margin-bottom: 8px;">Nenhum jogo encontrado nesta combinação</h3>
        <p style="color: #94a3b8; margin-bottom: 24px;">Tente limpar os filtros ou faça uma encomenda personalizada!</p>
        <button onclick="openCustomOrderModal()" class="btn btn-cyan btn-md">
          ✨ Encomendar Jogo Sob Medida
        </button>
      </div>
    `;
    const loadMoreBtn = document.getElementById('load-more-btn-wrap');
    if (loadMoreBtn) loadMoreBtn.style.display = 'none';
    return;
  }

  const toDisplay = filtered.slice(0, displayLimit);

  grid.innerHTML = toDisplay.map(game => `
    <div class="product-card" data-console="${game.console}" onmousemove="handleTilt(event, this)" onmouseleave="resetTilt(this)">
      <span class="product-badge ${game.badgeClass}">${game.consoleName}</span>
      
      <div class="cartridge-visual" data-console="${game.console}">
        <div class="cartridge-top-groove"></div>
        <div class="cartridge-sticker">
          ${game.cover ? `
            <img class="cartridge-skin-img" src="${game.cover}" alt="${game.title}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
            <div class="cartridge-fallback-art" style="display: none;">
              <div class="cartridge-art-icon">${game.icon}</div>
              <div class="cartridge-game-title">${game.title}</div>
            </div>
          ` : `
            <div class="cartridge-art-icon">${game.icon}</div>
            <div class="cartridge-game-title">${game.title}</div>
          `}
          <div class="cartridge-gloss"></div>
          <div class="cartridge-seal-badge">NFC OFFICIAL</div>
          <span class="nfc-chip-indicator" title="Chip NFC Integrado">⚡ NFC</span>
        </div>
      </div>

      <div class="product-info">
        <h3 class="product-title">${game.title}</h3>
        <p class="product-desc">${game.desc}</p>
        
        <div class="product-specs">
          <span class="spec-pill">Chip NFC</span>
          <span class="spec-pill">${game.genre.toUpperCase()}</span>
          <span class="spec-pill">PLA Premium</span>
        </div>

        <div class="product-footer">
          <div class="product-price-box">
            <span class="price-label">Preço Unitário</span>
            <span class="price-value">${CONFIG.currencySymbol} ${game.price.toFixed(2).replace('.', ',')}</span>
          </div>

                    <div class="product-actions">
            <button onclick="openPreviewModal('${game.id}')" class="btn btn-glass btn-sm" title="Ver Prévia Nostálgica">
              🎬 Prévia
            </button>
            <button onclick="openCustomizeModal('${game.id}')" class="btn btn-cyan btn-sm" title="Comprar Chaveiro NFC">
              🛒 Pedir
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  // Adiciona o Card Especial "Sob Encomenda" no final
  if (toDisplay.length === filtered.length) {
    grid.innerHTML += `
      <div class="product-card" style="border: 2px dashed var(--cyan); background: rgba(0, 240, 255, 0.05); display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 40px 24px;">
        <div style="font-size: 3.5rem; margin-bottom: 16px;">✨</div>
        <h3 style="color: #fff; font-size: 1.3rem; margin-bottom: 8px;">Não achou o seu jogo?</h3>
        <p style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 24px;">
          Nós gravamos e imprimimos em 3D <strong>qualquer jogo</strong> da sua infância sob encomenda exclusiva!
        </p>
        <button onclick="openCustomOrderModal()" class="btn btn-pink btn-md" style="width: 100%;">
          Pedir Jogo Personalizado
        </button>
      </div>
    `;
  }

  // Gerenciamento do Botão "Carregar Mais"
  const loadMoreWrap = document.getElementById('load-more-btn-wrap');
  if (loadMoreWrap) {
    loadMoreWrap.style.display = filtered.length > displayLimit ? 'block' : 'none';
  }
}

// Carregar Mais Jogos
function loadMoreGames() {
  SoundFX.playClick();
  displayLimit += 15;
  renderCatalog();
  initShowcaseCarousel();
  initParallax();
}

// Filtros de Console
function filterCatalog(consoleType, btn) {
  SoundFX.playClick();
  currentFilter = consoleType;
  displayLimit = 15;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderCatalog();
  initShowcaseCarousel();
  initParallax();
}

// Filtros de Gênero
function filterByGenre(genre, btn) {
  SoundFX.playClick();
  currentGenre = genre;
  displayLimit = 15;
  document.querySelectorAll('.genre-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderCatalog();
  initShowcaseCarousel();
  initParallax();
}

// Busca Instantânea
function initSearch() {
  const searchInput = document.getElementById('catalog-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchTerm = e.target.value.toLowerCase().trim();
      displayLimit = 15;
      renderCatalog();
  initShowcaseCarousel();
  initParallax();
    });
  }
}

// Efeito 3D Tilt
function handleTilt(e, card) {
  const rect = card.getBoundingClientRect();
  const x = e.clientX - rect.left - rect.width / 2;
  const y = e.clientY - rect.top - rect.height / 2;
  const rotateX = (-y / (rect.height / 2)) * 6;
  const rotateY = (x / (rect.width / 2)) * 6;
  card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
}

function resetTilt(card) {
  card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0)';
}

// Simulador NFC no Hero
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

  SoundFX.playNfcSuccess();
  if (navigator.vibrate) navigator.vibrate([80, 50, 80]);

    const isMario = (game.id === 'super_mario' || game.romParam === 'super_mario');
  const mediaContent = isMario ? `
    <div style="position: relative; width: 100%; max-height: 165px; border-radius: 8px; overflow: hidden; border: 1px solid var(--border-glow); box-shadow: 0 6px 20px rgba(0,0,0,0.8); margin-bottom: 10px;">
      <img src="assets/images/super-mario-world-yoshi.gif" alt="Super Mario World Gameplay" style="width: 100%; height: 165px; object-fit: cover; display: block;" />
      <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.35) 50%); background-size: 100% 3px; pointer-events: none;"></div>
    </div>
  ` : `
    <canvas id="phone-gameplay-canvas" style="width: 100%; max-height: 165px; border-radius: 8px; border: 1px solid var(--border-glow); box-shadow: 0 6px 20px rgba(0,0,0,0.8); margin-bottom: 10px;"></canvas>
  `;

  phoneScreen.innerHTML = `
    <div style="animation: pulse-dot 0.4s ease; width: 100%; display: flex; flex-direction: column; align-items: center;">
      <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; margin-bottom: 6px; padding: 0 4px;">
        <span style="font-family: var(--font-pixel); font-size: 0.6rem; color: var(--green);">⚡ TAG LIDA (NFC)</span>
        <span style="font-size: 0.65rem; color: var(--cyan); font-weight: 700;">60 FPS PREVIEW</span>
      </div>
      
      ${mediaContent}

      <div style="width: 100%; text-align: left; margin-bottom: 10px; background: rgba(255,255,255,0.04); padding: 6px 10px; border-radius: 6px;">
        <div style="font-weight: 700; font-size: 0.82rem; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${game.title}</div>
        <div style="font-size: 0.68rem; color: var(--text-muted);">${game.consoleName}</div>
      </div>

      <button onclick="openCustomizeModal('${game.id}')" class="btn btn-cyan btn-sm" style="width: 100%; font-size: 0.78rem; padding: 10px;">
        🛒 Pedir Este Chaveiro NFC
      </button>
    </div>
  `;

  const canvas = document.getElementById('phone-gameplay-canvas');
  if (canvas && typeof GameplayPreviews !== 'undefined') {
    GameplayPreviews.startPreview(canvas, game.id);
  }
}

// Modal de Customização
function openCustomizeModal(gameId) {
  SoundFX.playClick();
  activeCustomizingGame = GAMES_DATABASE.find(g => g.id === gameId) || GAMES_DATABASE[0];
  
  const modal = document.getElementById('order-custom-modal');
  if (!modal) return;

  document.getElementById('modal-game-title').textContent = activeCustomizingGame.title;
  document.getElementById('modal-game-console').textContent = activeCustomizingGame.consoleName;
  document.getElementById('modal-game-icon').textContent = activeCustomizingGame.icon;
  document.getElementById('modal-order-qty').value = 1;
  updateModalTotal();

  modal.style.display = 'flex';
}

function openCustomOrderModal() {
  SoundFX.playClick();
  const gameName = prompt('Qual jogo você gostaria de encomendar na RetroNFC? (Ex: Sunset Riders, Yu-Gi-Oh!, Castlevania):');
  if (gameName && gameName.trim() !== '') {
    const message = `Olá! Gostaria de fazer uma encomenda personalizada na *RetroNFC* do jogo: *${gameName.trim()}*. Vocês conseguem produzir o chaveiro NFC dele?`;
    const url = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }
}

function closeCustomizeModal() {
  const modal = document.getElementById('order-custom-modal');
  if (modal) modal.style.display = 'none';
}

function updateModalTotal() {
  if (!activeCustomizingGame) return;
  const qty = parseInt(document.getElementById('modal-order-qty').value, 10) || 1;
  const attachmentExtra = parseFloat(document.getElementById('modal-attachment-type').value) || 0;
  const unitPrice = CONFIG.isDigitalLaunch ? CONFIG.launchPassPrice : (activeCustomizingGame.price + attachmentExtra);
  const total = unitPrice * qty;

  const totalEl = document.getElementById('modal-total-display');
  if (totalEl) {
    if (CONFIG.isDigitalLaunch) {
      totalEl.innerHTML = `${CONFIG.currencySymbol} ${total.toFixed(2).replace('.', ',')} <span style="font-size: 0.75rem; color: #38bdf8; font-weight: normal;">(Promoção RetroPass)</span>`;
    } else {
      totalEl.textContent = `${CONFIG.currencySymbol} ${total.toFixed(2).replace('.', ',')}`;
    }
  }

  // Toggle da foto da Base de Mesa
  const basePreview = document.getElementById('base-mesa-preview');
  if (basePreview) {
    basePreview.style.display = attachmentExtra > 0 ? 'block' : 'none';
  }
}

function changeOrderQty(delta) {
  SoundFX.playClick();
  const input = document.getElementById('modal-order-qty');
  if (!input) return;
  let val = parseInt(input.value, 10) || 1;
  val = Math.max(1, Math.min(20, val + delta));
  input.value = val;
  updateModalTotal();
}

function submitCustomizedOrder() {
  if (!activeCustomizingGame) return;
  SoundFX.playClick();

  const qty = document.getElementById('modal-order-qty').value;
  const colorEl = document.getElementById('modal-shell-color');
  const color = colorEl ? colorEl.options[colorEl.selectedIndex].text : 'Cinza Clássico';
  const attachEl = document.getElementById('modal-attachment-type');
  const attach = attachEl ? attachEl.options[attachEl.selectedIndex].text : 'Chaveiro com Argola';
  const total = document.getElementById('modal-total-display').textContent;

  const message = `Olá! Gostaria de encomendar na *RetroNFC*:
🎮 *Jogo:* ${activeCustomizingGame.title} (${activeCustomizingGame.consoleName})
🎨 *Cor da Carcaça:* ${color}
🔗 *Formato:* ${attach}
📦 *Quantidade:* ${qty} unidade(s)
💰 *Total Estimado:* ${total}

Como podemos combinar o frete e a forma de pagamento?`;

  const url = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
  closeCustomizeModal();
}

// Calculadora de Lucro B2B
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

// Contato Geral WhatsApp
function orderViaWhatsApp(gameTitle = '') {
  SoundFX.playClick();
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
  SoundFX.playClick();
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
      SoundFX.playClick();
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

function toggleMobileMenu() {
  SoundFX.playClick();
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

// ============================================================
// Modal de Prévia Nostálgica & Conversão de Venda do Chaveiro NFC
// ============================================================
let activePreviewGame = null;

function openPreviewModal(gameId) {
  SoundFX.playClick();
  activePreviewGame = GAMES_DATABASE.find(g => g.id === gameId) || GAMES_DATABASE[0];
  if (!activePreviewGame) return;

  const modal = document.getElementById('preview-game-modal');
  if (!modal) return;

  // Atualiza Textos e Badges
  const titleEl = document.getElementById('preview-game-title');
  const badgeEl = document.getElementById('preview-console-badge');
  const canvas = document.getElementById('preview-game-canvas');

  if (titleEl) titleEl.textContent = activePreviewGame.title;
  if (badgeEl) {
    badgeEl.textContent = activePreviewGame.consoleName.toUpperCase();
    badgeEl.className = `product-badge ${activePreviewGame.badgeClass}`;
    badgeEl.style.position = 'static';
  }

  
  // Se for Super Mario, usa o GIF original autenticado com scanlines
  const tvBezel = document.querySelector('.preview-tv-bezel');
  if (tvBezel) {
    if (activePreviewGame.id === 'super_mario' || activePreviewGame.romParam === 'super_mario') {
      tvBezel.innerHTML = `
        <img src="assets/images/super-mario-world-yoshi.gif" alt="Super Mario World" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
        <div class="tv-crt-lines"></div>
        <div class="tv-glare"></div>
      `;
    } else {
      tvBezel.innerHTML = `
        <canvas id="preview-game-canvas" width="240" height="180"></canvas>
        <div class="tv-crt-lines"></div>
        <div class="tv-glare"></div>
      `;
      const canvas = document.getElementById('preview-game-canvas');
      if (canvas && typeof GameplayPreviews !== 'undefined') {
        GameplayPreviews.startPreview(canvas, activePreviewGame.romParam);
      }
    }
  }


  modal.style.display = 'flex';
}

function closePreviewModal() {
  const modal = document.getElementById('preview-game-modal');
  if (modal) modal.style.display = 'none';

  if (typeof GameplayPreviews !== 'undefined') {
    GameplayPreviews.stopPreview();
  }
}

function orderCurrentPreviewGame() {
  if (!activePreviewGame) return;
  SoundFX.playClick();

  const message = `Olá! Vi a prévia nostálgica do jogo *${activePreviewGame.title}* (${activePreviewGame.consoleName}) no site RetroNFC.com.br e quero encomendar o Chaveiro Físico NFC dele!

Poderia me informar as opções de envio e chaveiro disponíveis?`;

  const url = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
  closePreviewModal();
}

function customizeCurrentPreviewGame() {
  if (!activePreviewGame) return;
  const gameId = activePreviewGame.id;
  closePreviewModal();
  setTimeout(() => {
    openCustomizeModal(gameId);
  }, 100);
}


// ==========================================================================
// 🎠 CARROSSEL 3D — HALL DA FAMA DOS COLECIONÁVEIS
// ==========================================================================
const CAROUSEL_FEATURED_IDS = [
  'super_mario',
  'top_gear',
  'donkey_kong',
  'zelda_alttp',
  'sonic_2',
  'crash_bandicoot',
  'mario_64'
];

let carouselActiveIndex = 0;
let carouselAutoplayTimer = null;

function initShowcaseCarousel() {
  const stage = document.getElementById('carousel-3d-stage');
  const dotsContainer = document.getElementById('carousel-dots');
  if (!stage) return;

  const featuredGames = CAROUSEL_FEATURED_IDS
    .map(id => GAMES_DATABASE.find(g => g.id === id))
    .filter(Boolean);

  if (!featuredGames.length) return;

  // Render cards
  stage.innerHTML = featuredGames.map((game, idx) => `
    <div class="carousel-card-3d" data-index="${idx}" data-game="${game.id}" onclick="onCarouselCardClick(${idx})">
      <div class="cartridge-visual" data-console="${game.console}" style="height: 180px; margin-bottom: 12px;">
        <div class="cartridge-top-groove"></div>
        <div class="cartridge-sticker">
          <img class="cartridge-skin-img" src="${game.cover || 'assets/images/snes-cartridge-sample.jpeg'}" alt="${game.title}" loading="lazy" />
          <div class="cartridge-gloss"></div>
          <div class="cartridge-seal-badge">NFC OFFICIAL</div>
          <span class="nfc-chip-indicator">⚡ NFC</span>
        </div>
      </div>
      <div class="carousel-card-info">
        <h4 class="carousel-card-title">${game.title}</h4>
        <span class="carousel-card-badge ${game.badgeClass}">${game.consoleName}</span>
        <div class="carousel-card-actions">
          <button onclick="event.stopPropagation(); openPreviewModal('${game.id}')" class="btn btn-glass btn-sm" title="Ver Prévia">
            🎬 Prévia
          </button>
          <button onclick="event.stopPropagation(); openCustomizeModal('${game.id}')" class="btn btn-cyan btn-sm" title="Pedir Chaveiro">
            🛒 Pedir
          </button>
        </div>
      </div>
    </div>
  `).join('');

  // Render dots
  if (dotsContainer) {
    dotsContainer.innerHTML = featuredGames.map((_, idx) => `
      <span class="carousel-dot ${idx === 0 ? 'active' : ''}" onclick="goToCarouselSlide(${idx})"></span>
    `).join('');
  }

  updateCarouselPositions();
  startCarouselAutoplay();

  // Pause on hover
  const container = document.querySelector('.carousel-3d-container');
  if (container) {
    container.addEventListener('mouseenter', stopCarouselAutoplay);
    container.addEventListener('mouseleave', startCarouselAutoplay);

    // Touch Swipe
    let touchStartX = 0;
    container.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      stopCarouselAutoplay();
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 40) {
        if (diff > 0) nextCarouselSlide();
        else prevCarouselSlide();
      }
      startCarouselAutoplay();
    }, { passive: true });
  }
}

function updateCarouselPositions() {
  const cards = document.querySelectorAll('.carousel-card-3d');
  const dots = document.querySelectorAll('.carousel-dot');
  const total = cards.length;
  if (!total) return;

  cards.forEach((card, idx) => {
    card.classList.remove('state-active', 'state-prev', 'state-next', 'state-hidden');

    const prevIndex = (carouselActiveIndex - 1 + total) % total;
    const nextIndex = (carouselActiveIndex + 1) % total;

    if (idx === carouselActiveIndex) {
      card.classList.add('state-active');
    } else if (idx === prevIndex) {
      card.classList.add('state-prev');
    } else if (idx === nextIndex) {
      card.classList.add('state-next');
    } else {
      card.classList.add('state-hidden');
    }
  });

  dots.forEach((dot, idx) => {
    dot.classList.toggle('active', idx === carouselActiveIndex);
  });
}

function nextCarouselSlide() {
  SoundFX.playClick();
  const total = document.querySelectorAll('.carousel-card-3d').length;
  carouselActiveIndex = (carouselActiveIndex + 1) % total;
  updateCarouselPositions();
}

function prevCarouselSlide() {
  SoundFX.playClick();
  const total = document.querySelectorAll('.carousel-card-3d').length;
  carouselActiveIndex = (carouselActiveIndex - 1 + total) % total;
  updateCarouselPositions();
}

function goToCarouselSlide(idx) {
  SoundFX.playClick();
  carouselActiveIndex = idx;
  updateCarouselPositions();
}

function onCarouselCardClick(idx) {
  if (idx !== carouselActiveIndex) {
    goToCarouselSlide(idx);
  }
}

function startCarouselAutoplay() {
  stopCarouselAutoplay();
  carouselAutoplayTimer = setInterval(() => {
    const total = document.querySelectorAll('.carousel-card-3d').length;
    if (total) {
      carouselActiveIndex = (carouselActiveIndex + 1) % total;
      updateCarouselPositions();
    }
  }, 4500);
}

function stopCarouselAutoplay() {
  if (carouselAutoplayTimer) {
    clearInterval(carouselAutoplayTimer);
    carouselAutoplayTimer = null;
  }
}

// ==========================================================================
// 🌌 PARALLAX SUAVE EM SEGUNDO PLANO
// ==========================================================================
function initParallax() {
  const orb1 = document.querySelector('.parallax-orb-1');
  const orb2 = document.querySelector('.parallax-orb-2');
  const orb3 = document.querySelector('.parallax-orb-3');

  if (!orb1 && !orb2 && !orb3) return;

  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrolled = window.pageYOffset;
        if (orb1) orb1.style.transform = `translate3d(0, ${scrolled * 0.12}px, 0)`;
        if (orb2) orb2.style.transform = `translate3d(0, ${scrolled * -0.08}px, 0)`;
        if (orb3) orb3.style.transform = `translate3d(0, ${scrolled * 0.05}px, 0)`;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}


// ==========================================================================
// 🛒 SISTEMA DE CARRINHO DE COMPRAS RETRONFC (ESTILO THYNKLAB)
// ==========================================================================
let cart = [];

function initCart() {
  try {
    const saved = localStorage.getItem('retronfc_cart');
    cart = saved ? JSON.parse(saved) : [];
  } catch (e) {
    cart = [];
  }
  updateCartUI();
}

function saveCart() {
  try {
    localStorage.setItem('retronfc_cart', JSON.stringify(cart));
  } catch (e) {
    console.error('Erro ao salvar carrinho no localStorage:', e);
  }
  updateCartUI();
}

function toggleCartDrawer(open) {
  if (typeof SoundFX !== 'undefined' && SoundFX.playClick) SoundFX.playClick();
  const drawer = document.getElementById('cart-drawer');
  const backdrop = document.getElementById('cart-drawer-backdrop');
  if (!drawer || !backdrop) return;

  const willOpen = open !== undefined ? open : !drawer.classList.contains('open');

  if (willOpen) {
    renderCartDrawer();
    drawer.classList.add('open');
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  } else {
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
    document.body.style.overflow = '';
  }
}

function updateCartUI() {
  const badge = document.getElementById('header-cart-count');
  const totalUnits = cart.reduce((sum, item) => sum + (item.qty || 1), 0);

  if (badge) {
    badge.textContent = totalUnits;
    if (totalUnits === 0) {
      badge.setAttribute('data-empty', 'true');
    } else {
      badge.removeAttribute('data-empty');
      // Animação de pulse
      badge.classList.remove('pulse');
      void badge.offsetWidth; // Força reflow
      badge.classList.add('pulse');
      setTimeout(() => badge.classList.remove('pulse'), 400);
    }
  }

  renderCartDrawer();
}

function addToCart(item) {
  const existingIdx = cart.findIndex(i => 
    i.id === item.id && 
    i.format === item.format && 
    i.color === item.color
  );

  if (existingIdx !== -1) {
    cart[existingIdx].qty += item.qty || 1;
  } else {
    cart.push({
      id: item.id,
      title: item.title,
      consoleName: item.consoleName || 'Retro',
      cover: item.cover || '',
      price: item.price || 29.90,
      extraPrice: item.extraPrice || 0,
      format: item.format || 'Chaveiro com Argola',
      color: item.color || 'Cinza Clássico',
      qty: item.qty || 1
    });
  }

  saveCart();
  toggleCartDrawer(true);
}

function addItemToCartFromModal() {
  if (!activeCustomizingGame) return;
  if (typeof SoundFX !== 'undefined' && SoundFX.playClick) SoundFX.playClick();

  const qty = parseInt(document.getElementById('modal-order-qty').value, 10) || 1;
  const colorEl = document.getElementById('modal-shell-color');
  const color = colorEl ? colorEl.options[colorEl.selectedIndex].text : 'Cinza Clássico';
  
  const attachEl = document.getElementById('modal-attachment-type');
  const format = attachEl ? attachEl.options[attachEl.selectedIndex].text : 'Chaveiro com Argola';
  const extraPrice = parseFloat(attachEl ? attachEl.value : 0) || 0;

  const isLaunch = CONFIG.isDigitalLaunch;
  addToCart({
    id: activeCustomizingGame.id,
    title: activeCustomizingGame.title,
    consoleName: activeCustomizingGame.consoleName,
    cover: activeCustomizingGame.cover,
    price: isLaunch ? CONFIG.launchPassPrice : (activeCustomizingGame.price || 24.99),
    extraPrice: isLaunch ? 0 : extraPrice,
    format: isLaunch ? 'RetroPass Digital (QR Code)' : format,
    color: isLaunch ? 'Digital (Sem carcaça física)' : color,
    qty: qty
  });

  closeCustomizeModal();
}

function changeCartItemQty(index, delta) {
  if (typeof SoundFX !== 'undefined' && SoundFX.playClick) SoundFX.playClick();
  if (index < 0 || index >= cart.length) return;

  cart[index].qty += delta;
  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }
  saveCart();
}

function removeCartItem(index) {
  if (typeof SoundFX !== 'undefined' && SoundFX.playClick) SoundFX.playClick();
  if (index < 0 || index >= cart.length) return;
  cart.splice(index, 1);
  saveCart();
}

function renderCartDrawer() {
  const container = document.getElementById('cart-drawer-items');
  const unitsEl = document.getElementById('cart-total-units');
  const priceEl = document.getElementById('cart-total-price');
  const promoBanner = document.getElementById('cart-promo-banner');
  const checkoutBtn = document.querySelector('.cart-checkout-btn');

  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty-state">
        <div class="cart-empty-icon">🕹️</div>
        <div class="cart-empty-title">Seu carrinho está vazio</div>
        <div class="cart-empty-desc">Escolha os cartuchos e chaveiros NFC que marcaram sua infância para adicionar ao pedido.</div>
        <a href="#catalogo" onclick="toggleCartDrawer(false)" class="btn btn-cyan btn-sm">
          Explorar Catálogo de Jogos
        </a>
      </div>
    `;
    if (unitsEl) unitsEl.textContent = '0 unidades';
    if (priceEl) priceEl.textContent = 'R$ 0,00';
    if (promoBanner) {
      promoBanner.style.background = 'rgba(0, 240, 255, 0.07)';
      promoBanner.style.borderColor = 'rgba(0, 240, 255, 0.3)';
      promoBanner.style.color = '#a5f3fc';
      promoBanner.innerHTML = `<span>🚚 <strong>Envio Seguro para todo o Brasil</strong> com rastreamento!</span>`;
    }
    if (checkoutBtn) {
      checkoutBtn.disabled = true;
      checkoutBtn.innerHTML = `💬 Finalizar Pedido via WhatsApp &rarr;`;
    }
    return;
  }

  const totalUnits = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
  const isWholesale = totalUnits >= (CONFIG.wholesaleMinQty || 20);
  let totalPrice = 0;

  // Atualiza banner dinâmico de atacado
  if (promoBanner) {
    if (isWholesale) {
      promoBanner.style.background = 'rgba(34, 197, 94, 0.15)';
      promoBanner.style.borderColor = 'rgba(34, 197, 94, 0.4)';
      promoBanner.style.color = '#86efac';
      promoBanner.innerHTML = `<span>🎉 <strong>TARIFA DE ATACADO ATIVADA!</strong> Você tem ${totalUnits} unidades. Preço de fábrica aplicado: <strong>R$ 7,50/un</strong>!</span>`;
    } else {
      const remaining = (CONFIG.wholesaleMinQty || 20) - totalUnits;
      promoBanner.style.background = 'rgba(0, 240, 255, 0.07)';
      promoBanner.style.borderColor = 'rgba(0, 240, 255, 0.3)';
      promoBanner.style.color = '#a5f3fc';
      promoBanner.innerHTML = `<span>💼 <strong>Quer Preço de Atacado?</strong> Adicione mais <strong>${remaining} unidade(s)</strong> para pagar apenas <strong>R$ 7,50/un</strong>!</span>`;
    }
  }

  container.innerHTML = cart.map((item, idx) => {
    const isLaunch = CONFIG.isDigitalLaunch && !isWholesale;
    const basePrice = isWholesale ? (CONFIG.wholesalePrice || 7.50) : (isLaunch ? CONFIG.launchPassPrice : (item.price || 24.99));
    const itemUnitPrice = basePrice + (isLaunch ? 0 : (item.extraPrice || 0));
    const itemSubtotal = itemUnitPrice * item.qty;
    totalPrice += itemSubtotal;

    return `
      <div class="cart-item-card">
        <img class="cart-item-thumb" src="${item.cover || 'assets/images/snes-cartridge-sample.jpeg'}" alt="${item.title}" onerror="this.src='assets/images/snes-cartridge-sample.jpeg';"/>
        <div class="cart-item-info">
          <div class="cart-item-head">
            <h4 class="cart-item-title" title="${item.title}">${item.title}</h4>
            <button onclick="removeCartItem(${idx})" class="cart-item-remove" title="Remover item" aria-label="Remover">&times;</button>
          </div>
          <div class="cart-item-meta">
            <span>Console: <strong style="color:#fff">${item.consoleName}</strong></span>
            <span>Tipo: <strong style="color:var(--cyan)">${item.format}</strong></span>
            <span>Carcaça: <strong style="color:#cbd5e1">${item.color}</strong></span>
          </div>
          <div class="cart-item-foot">
            <div class="cart-stepper">
              <button onclick="changeCartItemQty(${idx}, -1)" class="cart-stepper-btn" aria-label="Diminuir">-</button>
              <span class="cart-stepper-val">${item.qty}</span>
              <button onclick="changeCartItemQty(${idx}, 1)" class="cart-stepper-btn" aria-label="Aumentar">+</button>
            </div>
            <div class="cart-item-price">
              ${isWholesale ? `
                <span style="font-size: 0.75rem; text-decoration: line-through; color: #64748b; margin-right: 4px;">R$ ${((24.99 + (item.extraPrice || 0)) * item.qty).toFixed(2).replace('.', ',')}</span>
                <span style="color: #22c55e; font-weight: 800;">R$ ${itemSubtotal.toFixed(2).replace('.', ',')}</span>
                <span style="display: block; font-size: 0.68rem; color: #22c55e; font-weight: 700;">(Tarifa Atacado R$ 7,50/un)</span>
              ` : isLaunch ? `
                <span style="font-size: 0.75rem; text-decoration: line-through; color: #64748b; margin-right: 4px;">R$ ${(24.99 * item.qty).toFixed(2).replace('.', ',')}</span>
                <span style="color: #38bdf8; font-weight: 800;">R$ ${itemSubtotal.toFixed(2).replace('.', ',')}</span>
                <span style="display: block; font-size: 0.68rem; color: #38bdf8; font-weight: 700;">(Lote Fundador R$ 9,99)</span>
              ` : `
                R$ ${itemSubtotal.toFixed(2).replace('.', ',')}
              `}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (unitsEl) unitsEl.textContent = `${totalUnits} unidade${totalUnits > 1 ? 's' : ''}`;
  if (priceEl) priceEl.textContent = `R$ ${totalPrice.toFixed(2).replace('.', ',')}`;

  if (checkoutBtn) {
    checkoutBtn.disabled = false;
    checkoutBtn.onclick = openCheckoutAddressModal;
    const modeLabel = isWholesale ? '💼 Atacado' : '🛍️ Varejo';
    checkoutBtn.innerHTML = `<span style="font-size: 1.25rem;">📦</span> Avançar para Entrega (${totalUnits} un · R$ ${totalPrice.toFixed(2).replace('.', ',')}) &rarr;`;
  }
}

function checkoutCartWhatsApp() {
  if (cart.length === 0) {
    alert('Seu carrinho está vazio! Escolha pelo menos um jogo no catálogo.');
    return;
  }
  if (typeof SoundFX !== 'undefined' && SoundFX.playClick) SoundFX.playClick();

  const notesInput = document.getElementById('cust-notes') || document.getElementById('cart-notes-input');
  const notes = notesInput ? notesInput.value.trim() : '';

  let totalUnits = 0;
  let totalPrice = 0;

  const itemsText = cart.map((item, idx) => {
    const itemUnitPrice = (item.price || 29.90) + (item.extraPrice || 0);
    const itemSubtotal = itemUnitPrice * item.qty;
    totalUnits += item.qty;
    totalPrice += itemSubtotal;

    return `• *${item.qty}x ${item.title}* (${item.consoleName})
  - Formato: ${item.format}
  - Cor: ${item.color}
  - Subtotal: R$ ${itemSubtotal.toFixed(2).replace('.', ',')}`;
  }).join('\n\n');

  let message = `🎮 *NOVO PEDIDO - RETRONFC.COM.BR*

Olá! Montei meu carrinho no site RetroNFC e gostaria de finalizar meu pedido:

🛒 *ITENS SELECIONADOS:*
${itemsText}

📦 *Volume Total:* ${totalUnits} unidade(s)
💰 *VALOR TOTAL:* R$ ${totalPrice.toFixed(2).replace('.', ',')}`;

  if (notes) {
    message += `\n📝 *Observações do Cliente:*\n${notes}`;
  }

  message += `\n\nComo combinamos o frete (CEP) e a forma de pagamento (PIX / Cartão)?`;

  const url = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
  toggleCartDrawer(false);
}


// ==========================================================================
// 📋 CHECKOUT ADDRESS MODAL & AUTO-PREENCHIMENTO (ESTILO ADMIN)
// ==========================================================================

const PERSONA_MAP = {
  'super_mario': { name: 'Mario', icon: '🍄', game: 'Super Mario World', code: 'MARIO', quote: "Mamma Mia! It's-a me, Mario!" },
  'super_mario_kart': { name: 'Mario', icon: '🏎️', game: 'Super Mario Kart', code: 'MARIO_KART', quote: "Vamos acelerar nesse kart!" },
  'street_fighter': { name: 'Ryu', icon: '🥋', game: 'Street Fighter II', code: 'RYU', quote: "Hadouken! Bem-vindo ao dojo da RetroNFC!" },
  'sonic_2': { name: 'Sonic', icon: '🦔', game: 'Sonic the Hedgehog 2', code: 'SONIC', quote: "Gotta go fast! Aqui é o Sonic!" },
  'moonwalker': { name: 'Michael Jackson', icon: '🕺', game: "Michael Jackson's Moonwalker", code: 'MOONWALKER', quote: "Hee-hee! Shamone!" },
  'top_gear': { name: 'Piloto Horizons', icon: '🏎️', game: 'Top Gear', code: 'TOP_GEAR', quote: "Pisa fundo e segura o nitro!" },
  'donkey_kong': { name: 'Donkey Kong', icon: '🍌', game: 'Donkey Kong Country', code: 'DK', quote: "Ooh-ooh aah-aah! Na selva dos 16-bits!" },
  'mortal_kombat_2': { name: 'Scorpion', icon: '🔥', game: 'Mortal Kombat II', code: 'SCORPION', quote: "GET OVER HERE!" },
  'zelda_alttp': { name: 'Link', icon: '🗡️', game: 'Zelda: Link to the Past', code: 'LINK', quote: "Hey, Listen! O Herói de Hyrule!" },
  'mega_man_x': { name: 'Mega Man X', icon: '⚡', game: 'Mega Man X', code: 'MEGA_MAN', quote: "X-Buster carregado na potência máxima!" },
  'streets_of_rage_2': { name: 'Axel Stone', icon: '🥊', game: 'Streets of Rage 2', code: 'AXEL', quote: "Grand Upper! Limpando as ruas com nostalgia!" },
  'golden_axe': { name: 'Gilius Thunderhead', icon: '🪓', game: 'Golden Axe', code: 'GILIUS', quote: "Pela glória do machado de ouro!" }
};

function getAttendantForCart() {
  const primaryId = cart.length > 0 ? cart[0].id : 'super_mario';
  return PERSONA_MAP[primaryId] || { name: 'Mario', icon: '🍄', game: 'Super Mario World', code: 'MARIO', quote: "Mamma Mia! It's-a me, Mario!" };
}

function openCheckoutAddressModal() {
  if (cart.length === 0) {
    alert('Seu carrinho está vazio! Escolha pelo menos um jogo no catálogo.');
    return;
  }
  if (typeof SoundFX !== 'undefined' && SoundFX.playClick) SoundFX.playClick();

  const drawer = document.getElementById('cart-drawer');
  const backdrop = document.getElementById('cart-drawer-backdrop');
  if (drawer) drawer.classList.remove('open');
  if (backdrop) backdrop.classList.remove('open');

  const attendant = getAttendantForCart();

  // Exibe badge do atendente temático
  const attendantEl = document.getElementById('checkout-attendant-preview');
  if (attendantEl) {
    attendantEl.innerHTML = `
      <span class="checkout-attendant-avatar">${attendant.icon}</span>
      <span>Atendente Gamer no WhatsApp: <strong class="checkout-attendant-name">${attendant.name}</strong> (${attendant.game})</span>
    `;
  }

  const gamesDisplay = document.getElementById('cust-games-display');
  if (gamesDisplay) {
    let totalPrice = 0;
    const totalUnits = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
    const isWholesale = totalUnits >= (CONFIG.wholesaleMinQty || 20);

    const itemsHtml = cart.map(item => {
      const basePrice = isWholesale ? (CONFIG.wholesalePrice || 7.50) : (item.price || 29.90);
      const unitPrice = basePrice + (item.extraPrice || 0);
      const subtotal = unitPrice * item.qty;
      totalPrice += subtotal;

      return `
        <div class="checkout-game-pill">
          <div>
            <div class="checkout-game-pill-title">${item.qty}x ${item.title} (${item.consoleName})</div>
            <div class="checkout-game-pill-sub">${item.format} · ${item.color} ${isWholesale ? '· <strong style="color:#22c55e;">Atacado R$ 7,50</strong>' : ''}</div>
          </div>
          <div class="checkout-game-pill-price">R$ ${subtotal.toFixed(2).replace('.', ',')}</div>
        </div>
      `;
    }).join('');

    gamesDisplay.innerHTML = `
      ${itemsHtml}
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; padding-top: 8px; border-top: 1px dashed rgba(255,255,255,0.18); font-weight: 800;">
        <span style="color: #fff; font-size: 0.88rem;">Total a Pagar (${totalUnits} un):</span>
        <span style="color: var(--cyan); font-family: var(--font-mono); font-size: 1.15rem;">R$ ${totalPrice.toFixed(2).replace('.', ',')}</span>
      </div>
    `;
  }

  try {
    const saved = localStorage.getItem('retronfc_customer_info');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.name) document.getElementById('cust-name').value = data.name;
      if (data.phone) document.getElementById('cust-phone').value = data.phone;
      if (data.address) document.getElementById('cust-address').value = data.address;
      if (data.neighborhood) document.getElementById('cust-neighborhood').value = data.neighborhood;
      if (data.city) document.getElementById('cust-city').value = data.city;
      if (data.state) document.getElementById('cust-state').value = data.state;
      if (data.zip) document.getElementById('cust-zip').value = data.zip;
    }
  } catch (e) {}

  const modal = document.getElementById('checkout-address-modal');
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

function closeCheckoutAddressModal() {
  if (typeof SoundFX !== 'undefined' && SoundFX.playClick) SoundFX.playClick();
  const modal = document.getElementById('checkout-address-modal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

function formatCepInput(input) {
  let v = input.value.replace(/\D/g, '');
  if (v.length > 5) {
    v = v.substring(0, 5) + '-' + v.substring(5, 8);
  }
  input.value = v;
}

async function handleCepAutoFill(cepValue) {
  if (!cepValue) return;
  const cleanCep = cepValue.replace(/\D/g, '');
  if (cleanCep.length !== 8) return;

  const tipEl = document.getElementById('cep-status-tip');
  if (tipEl) {
    tipEl.innerHTML = '<span style="color:#facc15">⏳ Buscando endereço no ViaCEP...</span>';
  }

  try {
    const resp = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    if (!resp.ok) {
      if (tipEl) tipEl.innerHTML = '<span style="color:#ef4444">⚠️ CEP não encontrado</span>';
      return;
    }
    const data = await resp.json();

    if (!data.erro) {
      const addrEl = document.getElementById('cust-address');
      const neighEl = document.getElementById('cust-neighborhood');
      const cityEl = document.getElementById('cust-city');
      const stateEl = document.getElementById('cust-state');
      const numEl = document.getElementById('cust-number');

      if (addrEl && data.logradouro) addrEl.value = data.logradouro;
      if (neighEl && data.bairro) neighEl.value = data.bairro;
      if (cityEl && data.localidade) cityEl.value = data.localidade;
      if (stateEl && data.uf) stateEl.value = data.uf;

      if (tipEl) {
        tipEl.innerHTML = '<span style="color:#22c55e">✅ Endereço preenchido! Digite o Nº/Casa/Lote/Apto</span>';
      }

      // Foca automaticamente no campo de Casa/Lote/Número!
      if (numEl) {
        setTimeout(() => numEl.focus(), 150);
      }
    } else {
      if (tipEl) tipEl.innerHTML = '<span style="color:#ef4444">⚠️ CEP não localizado (preencha manualmente)</span>';
    }
  } catch (e) {
    console.warn('ViaCEP offline ou indisponível:', e);
    if (tipEl) tipEl.innerHTML = '<span style="color:#94a3b8">Preencha o endereço manualmente</span>';
  }
}

function submitFinalCheckoutToWhatsApp(event) {
  event.preventDefault();
  if (typeof SoundFX !== 'undefined' && SoundFX.playClick) SoundFX.playClick();

  if (cart.length === 0) {
    alert('Seu carrinho está vazio!');
    return;
  }

  const name = document.getElementById('cust-name').value.trim();
  const phone = document.getElementById('cust-phone').value.trim();
  const address = document.getElementById('cust-address').value.trim();
  const number = document.getElementById('cust-number') ? document.getElementById('cust-number').value.trim() : '';
  const complement = document.getElementById('cust-complement') ? document.getElementById('cust-complement').value.trim() : '';
  const neighborhood = document.getElementById('cust-neighborhood').value.trim();
  const city = document.getElementById('cust-city').value.trim();
  const state = document.getElementById('cust-state').value.trim().toUpperCase();
  const zip = document.getElementById('cust-zip').value.trim();
  const fullAddressLine = `${address}, ${number}${complement ? ` (${complement})` : ''}`;

  const notesInput = document.getElementById('cust-notes') || document.getElementById('cart-notes-input');
  const notes = notesInput ? notesInput.value.trim() : '';

  // Salva no navegador para próximas compras
  try {
    localStorage.setItem('retronfc_customer_info', JSON.stringify({
      name, phone, address, number, complement, neighborhood, city, state, zip
    }));
  } catch (e) {}

  const totalCartUnits = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
  const isWholesale = totalCartUnits >= (CONFIG.wholesaleMinQty || 20);
  const isLaunch = CONFIG.isDigitalLaunch && !isWholesale;
  let totalPrice = 0;
  let totalUnits = 0;

  const itemsList = cart.map(item => {
    const basePrice = isWholesale ? (CONFIG.wholesalePrice || 7.50) : (isLaunch ? CONFIG.launchPassPrice : (item.price || 24.99));
    const unitPrice = basePrice + (isLaunch ? 0 : (item.extraPrice || 0));
    const subtotal = unitPrice * item.qty;
    totalPrice += subtotal;
    totalUnits += item.qty;

    return `• *${item.qty}x ${item.title}* (${item.consoleName})
  - Tipo: ${isLaunch ? 'RetroPass Digital (QR Code)' : item.format}
  - Tarifa: ${isWholesale ? 'Atacado (R$ 7,50/un)' : (isLaunch ? 'Lançamento Promocional (R$ 9,99/un)' : 'Varejo (R$ 24,99/un)')}
  - Subtotal: R$ ${subtotal.toFixed(2).replace('.', ',')}`;
  }).join('\n\n');

  const attendant = getAttendantForCart();

  let message = `🎮 *PEDIDO CONFIRMADO - RETRONFC.COM.BR*
🤖 *ATENDENTE DESIGNADO:* ${attendant.icon} ${attendant.name} (${attendant.game})
🏷️ *TAG DO ROBÔ:* [PERSONA:${attendant.code}]
💼 *MODALIDADE:* ${isWholesale ? "ATACADO B2B (R$ 7,50/un - 20+ peças)" : (isLaunch ? "RETROPASS DIGITAL (LANÇAMENTO PROMOCIONAL R$ 9,99/un)" : "CHAVEIRO FÍSICO NFC VAREJO (R$ 24,99/un)")}

👤 *DADOS DO CLIENTE:*
• Nome: ${name}
• WhatsApp: ${phone}

📍 *ENDEREÇO COMPLETO CADASTRADO:*
• CEP: ${zip}
• Logradouro: ${address}
• Casa / Lote / Nº / Apto: ${number}${complement ? ` (${complement})` : ''}
• Bairro: ${neighborhood}
• Cidade/UF: ${city} - ${state}

🕹️ *JOGO(S) COMPRADO(S):*
${itemsList}

📦 *Volume Total:* ${totalUnits} unidade(s)
💰 *VALOR TOTAL A PAGAR:* R$ ${totalPrice.toFixed(2).replace('.', ',')}

${isLaunch ? `🎁 *BENEFÍCIO LOTE FUNDADOR APLICADO:*
Estou adquirindo o RetroPass Digital por R$ 9,99 para entrega imediata do Card com QR Code no WhatsApp. Meus dados de entrega acima já estão salvos no sistema para resgatar o Chaveiro Físico NFC no futuro pagando apenas a diferença (R$ 15,00/un)!

🔒 *DECLARAÇÃO DO CLIENTE:*
Estou ciente de que a confecção do chaveiro físico 3D ainda não começou e que receberei o Card com QR Code no WhatsApp, com acesso pessoal e intransferível no meu celular após o 1º escaneamento.\n\n` : `🔒 *DECLARAÇÃO DO CLIENTE:*
Confirmo que os dados de entrega e os jogos acima estão corretos. Estou ciente de que os chips NFC são gravados fisicamente e bloqueados permanentemente contra regravação.\n\n`}
${notes ? `📝 *Observações:* ${notes}\n\n` : ''}${attendant.name}, por favor confirme meu pedido e envie a chave PIX para liberação do meu Card com QR Code!`;

  const url = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
  closeCheckoutAddressModal();
}


// ==========================================================================
// 💼 FUNÇÕES DE COMPRA RÁPIDA DE ATACADO EM LOTE (B2B)
// ==========================================================================
function buyWholesalePackage(qty) {
  if (typeof SoundFX !== 'undefined' && SoundFX.playClick) SoundFX.playClick();
  const num = parseInt(qty, 10) || 20;
  const hasDisplay = num >= 50;
  const format = hasDisplay ? 'Chaveiro NFC + Expositor Giratório de Balcão Incluso (Brinde)' : 'Chaveiro NFC Montado e Programado';

  // Remove lote de atacado genérico anterior para não duplicar
  cart = cart.filter(i => !i.id.startsWith('wholesale_lot'));

  cart.unshift({
    id: `wholesale_lot_${num}`,
    title: `Lote de Atacado (${num}x Chaveiros NFC)`,
    consoleName: 'Mix dos Mais Vendidos (Top Clássicos)',
    cover: 'assets/images/expositor-giratorio.jpeg',
    price: CONFIG.wholesalePrice || 7.50,
    extraPrice: 0,
    format: format,
    color: 'Grade Balanceada (SNES, Mega Drive & PS1)',
    qty: num
  });

  saveCart();
  toggleCartDrawer(true);
}

function addCurrentWholesaleLotToCart() {
  const slider = document.getElementById('wholesale-qty-slider');
  const qty = slider ? parseInt(slider.value, 10) : 50;
  buyWholesalePackage(qty);
}
