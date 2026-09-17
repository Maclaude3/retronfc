/**
 * RetroNFC.com.br — Script Principal v3.0
 * Lógica do Simulador NFC, Mega Catálogo com Filtros de Console e Gênero,
 * Busca em Tempo Real, Paginação Inteligente e Checkout WhatsApp com Jarvis
 */

const CONFIG = {
  whatsappNumber: '5561991252332', // WhatsApp oficial integrado com Jarvis
  currencySymbol: 'R$',
  retailPrice: 29.90,
  wholesalePrice: 7.50,
  suggestedResell: 25.00
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
  const unitPrice = activeCustomizingGame.price + attachmentExtra;
  const total = unitPrice * qty;

  const totalEl = document.getElementById('modal-total-display');
  if (totalEl) {
    totalEl.textContent = `${CONFIG.currencySymbol} ${total.toFixed(2).replace('.', ',')}`;
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
