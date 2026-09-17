/**
 * RetroNFC.com.br — Script Principal Aprimorado v2.0
 * Lógica do Simulador NFC, Catálogo com Busca, Modal de Customização 3D e WhatsApp
 */

// Configurações Gerais
const CONFIG = {
  whatsappNumber: '5561991252332', // Substitua pelo seu WhatsApp oficial
  currencySymbol: 'R$',
  retailPrice: 29.90,
  wholesalePrice: 7.50,
  suggestedResell: 25.00
};

// Banco de Dados Expandido dos Jogos / Cartuchos (Multiconsoles)
const GAMES_DATABASE = [
  // Super Nintendo
  {
    id: 'super_mario',
    title: 'Super Mario World',
    console: 'snes',
    consoleName: 'Super Nintendo',
    badgeClass: 'badge-snes',
    icon: '🍄',
    desc: 'O maior clássico de plataforma de todos os tempos. Encoste a tag e jogue com Yoshi pelas 96 fases!',
    romParam: 'super_mario',
    price: 29.90,
    tags: 'mario nintendo plataforma yoshi snes'
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
    price: 29.90,
    tags: 'corrida carro velocidade nitro snes'
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
    price: 29.90,
    tags: 'macaco selva dkc rare snes'
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
    price: 29.90,
    tags: 'zelda link espada aventura rpg hyrule snes'
  },
  {
    id: 'chrono_trigger',
    title: 'Chrono Trigger',
    console: 'snes',
    consoleName: 'Super Nintendo',
    badgeClass: 'badge-snes',
    icon: '⏳',
    desc: 'Viagens no tempo, múltiplos finais e a obra-prima da Squaresoft com arte de Akira Toriyama.',
    romParam: 'chrono_trigger',
    price: 29.90,
    tags: 'rpg chrono viagem tempo goku square snes'
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
    price: 29.90,
    tags: 'luta fight ryu ken hadouken capcom snes'
  },
  {
    id: 'mortal_kombat_2',
    title: 'Mortal Kombat II',
    console: 'snes',
    consoleName: 'Super Nintendo',
    badgeClass: 'badge-snes',
    icon: '🐉',
    desc: 'Fatality no seu smartphone! Sub-Zero, Scorpion, Raiden e toda a brutalidade do torneio.',
    romParam: 'mortal_kombat_2',
    price: 29.90,
    tags: 'luta fatality scorpion subzero sangue snes'
  },
  {
    id: 'super_metroid',
    title: 'Super Metroid',
    console: 'snes',
    consoleName: 'Super Nintendo',
    badgeClass: 'badge-snes',
    icon: '🚀',
    desc: 'Explore as profundezas do planeta Zebes no jogo que definiu o gênero Metroidvania.',
    romParam: 'super_metroid',
    price: 29.90,
    tags: 'samus metroidvania espaco alien tiro snes'
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
    price: 29.90,
    tags: 'robo tiro capcom dash armor zero snes'
  },

  // PlayStation 1 (PS1)
  {
    id: 'crash_bandicoot',
    title: 'Crash Bandicoot',
    console: 'ps1',
    consoleName: 'PlayStation 1',
    badgeClass: 'badge-ps1',
    icon: '🦊',
    desc: 'Gire, salte e quebre caixas de frutas Wumpa com o marsupial mais famoso da Sony!',
    romParam: 'crash_bandicoot',
    price: 29.90,
    tags: 'crash ps1 sony plataforma wumpa 3d playstation'
  },
  {
    id: 'tekken_3',
    title: 'Tekken 3',
    console: 'ps1',
    consoleName: 'PlayStation 1',
    badgeClass: 'badge-ps1',
    icon: '🥋',
    desc: 'O ápice dos jogos de luta 3D do PS1! Jin Kazama, Eddy Gordo, Hwoarang e Paul Phoenix.',
    romParam: 'tekken_3',
    price: 29.90,
    tags: 'tekken luta jin eddy gordo namco ps1 playstation'
  },
  {
    id: 'winning_eleven',
    title: 'Winning Eleven / Bomba Patch',
    console: 'ps1',
    consoleName: 'PlayStation 1',
    badgeClass: 'badge-ps1',
    icon: '⚽',
    desc: '100% Atualizado, é ruim de aturar! O futebol que embalou as tardes de toda uma geração.',
    romParam: 'winning_eleven',
    price: 29.90,
    tags: 'futebol bomba patch winning eleven konami gol ps1'
  },
  {
    id: 'gran_turismo',
    title: 'Gran Turismo',
    console: 'ps1',
    consoleName: 'PlayStation 1',
    badgeClass: 'badge-ps1',
    icon: '🏎️',
    desc: 'O verdadeiro simulador de direção com dezenas de montadoras, licenças e corridas épicas.',
    romParam: 'gran_turismo',
    price: 29.90,
    tags: 'corrida simulador carro sony ps1 velocidade playstation'
  },
  {
    id: 'resident_evil',
    title: 'Resident Evil Director s Cut',
    console: 'ps1',
    consoleName: 'PlayStation 1',
    badgeClass: 'badge-ps1',
    icon: '🧟',
    desc: 'Entre no survival horror mais famoso do mundo na mansão infestada de zumbis de Raccoon City.',
    romParam: 'resident_evil',
    price: 29.90,
    tags: 'terror zumbi capcom survivor horror jill chris ps1'
  },

  // Nintendo 64 (N64)
  {
    id: 'mario_64',
    title: 'Super Mario 64',
    console: 'n64',
    consoleName: 'Nintendo 64',
    badgeClass: 'badge-n64',
    icon: '⭐',
    desc: 'Mergulhe nas pinturas mágicas do Castelo da Peach na maior obra de arte do Nintendo 64.',
    romParam: 'mario_64',
    price: 29.90,
    tags: 'mario 64 n64 peach bowser estrela 3d nintendo'
  },
  {
    id: 'mario_kart_64',
    title: 'Mario Kart 64',
    console: 'n64',
    consoleName: 'Nintendo 64',
    badgeClass: 'badge-n64',
    icon: '🏎️',
    desc: 'Cascos de tartaruga, derrapadas turbo e disputas insanas de kart nas pistas mais clássicas.',
    romParam: 'mario_kart_64',
    price: 29.90,
    tags: 'kart corrida nintendo mario n64 casco'
  },
  {
    id: 'zelda_oot',
    title: 'Zelda: Ocarina of Time',
    console: 'n64',
    consoleName: 'Nintendo 64',
    badgeClass: 'badge-n64',
    icon: '🧝',
    desc: 'Aclamado universalmente como um dos melhores jogos já criados. A lenda de Hyrule e Epona.',
    romParam: 'zelda_oot',
    price: 29.90,
    tags: 'zelda ocarina link epona n64 master sword'
  },
  {
    id: 'goldeneye_007',
    title: '007 GoldenEye',
    console: 'n64',
    consoleName: 'Nintendo 64',
    badgeClass: 'badge-n64',
    icon: '🔫',
    desc: 'O jogo de tiro e espionagem de James Bond que revolucionou os consoles para sempre.',
    romParam: 'goldeneye_007',
    price: 29.90,
    tags: '007 james bond tiro fps rare n64'
  },

  // Game Boy Advance (GBA)
  {
    id: 'pokemon_firered',
    title: 'Pokémon FireRed',
    console: 'gba',
    consoleName: 'Game Boy Advance',
    badgeClass: 'badge-gba',
    icon: '🔥',
    desc: 'Reviva a região clássica de Kanto com gráficos em 32-bits e capture todos os 151 originais!',
    romParam: 'pokemon_firered',
    price: 29.90,
    tags: 'pokemon gba firered charizard kanto rpg'
  },
  {
    id: 'pokemon_emerald',
    title: 'Pokémon Emerald',
    console: 'gba',
    consoleName: 'Game Boy Advance',
    badgeClass: 'badge-gba',
    icon: '🐉',
    desc: 'A aventura definitiva de Hoenn com Rayquaza, Equipes Magma e Aqua e a Batalha da Fronteira.',
    romParam: 'pokemon_emerald',
    price: 29.90,
    tags: 'pokemon gba emerald rayquaza hoenn'
  },
  {
    id: 'mario_kart_gba',
    title: 'Mario Kart Super Circuit',
    console: 'gba',
    consoleName: 'Game Boy Advance',
    badgeClass: 'badge-gba',
    icon: '🍄',
    desc: 'Velocidade frenética portátil com 40 pistas completas e todas as copas do SNES.',
    romParam: 'mario_kart_gba',
    price: 29.90,
    tags: 'mario kart gba corrida nintendo'
  },
  {
    id: 'zelda_minish_cap',
    title: 'Zelda: The Minish Cap',
    console: 'gba',
    consoleName: 'Game Boy Advance',
    badgeClass: 'badge-gba',
    icon: '👒',
    desc: 'Encolha ao tamanho dos gnomos Minish com o chapéu falante Ezlo em um dos Zeldas mais bonitos.',
    romParam: 'zelda_minish_cap',
    price: 29.90,
    tags: 'zelda gba minish cap link capcom'
  },

  // Fliperama / Arcade (Neo Geo)
  {
    id: 'kof_98',
    title: 'The King of Fighters 98',
    console: 'arcade',
    consoleName: 'Fliperama / Neo Geo',
    badgeClass: 'badge-arcade',
    icon: '🔥',
    desc: 'O maior torneio dos fliperamas de shopping e rodoviária! Iori Yagami, Kyo Kusanagi e Rugal.',
    romParam: 'kof_98',
    price: 29.90,
    tags: 'kof 98 snk iori kyo rugal arcade luta'
  },
  {
    id: 'kof_2002',
    title: 'The King of Fighters 2002',
    console: 'arcade',
    consoleName: 'Fliperama / Neo Geo',
    badgeClass: 'badge-arcade',
    icon: '🥊',
    desc: 'A rainha dos combos! O fliperama mais competitivo do Brasil onde quem perdia passava a ficha.',
    romParam: 'kof_2002',
    price: 29.90,
    tags: 'kof 2002 snk arcade fliperama luta rugal'
  },
  {
    id: 'metal_slug',
    title: 'Metal Slug Super Vehicle',
    console: 'arcade',
    consoleName: 'Fliperama / Neo Geo',
    badgeClass: 'badge-arcade',
    icon: '💣',
    desc: 'Heavy Machine Gun! Destruição desenfreada com tanques, prisioneiros e explosões em pixel art.',
    romParam: 'metal_slug',
    price: 29.90,
    tags: 'metal slug tiro snk heavy machine gun tanque arcade'
  },

  // Mega Drive & Game Boy
  {
    id: 'sonic_2',
    title: 'Sonic the Hedgehog 2',
    console: 'genesis',
    consoleName: 'Mega Drive',
    badgeClass: 'badge-genesis',
    icon: '🦔',
    desc: 'Velocidade máxima em 16-bits com Sonic & Tails na clássica carcaça preta do Mega Drive!',
    romParam: 'sonic_2',
    price: 29.90,
    tags: 'sega sonic tails velocidade genesis'
  },
  {
    id: 'streets_of_rage_2',
    title: 'Streets of Rage 2',
    console: 'genesis',
    consoleName: 'Mega Drive',
    badgeClass: 'badge-genesis',
    icon: '🥋',
    desc: 'O beat em up definitivo da Sega. Trilha sonora inesquecível de Yuzo Koshiro e porrada estancando!',
    romParam: 'streets_of_rage_2',
    price: 29.90,
    tags: 'briga rua sega yuzo koshiro soco genesis'
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
    price: 29.90,
    tags: 'pokemon pikachu kanto nintendo rpg gameboy'
  }
];

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
let currentSearchTerm = '';
let activeCustomizingGame = null;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  renderCatalog();
  initSimulator();
  initWholesaleCalc();
  initFaq();
  initNavbar();
  initSearch();
  initTiltEffect();
});

// Renderização com Filtro e Busca
function renderCatalog() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  const filtered = GAMES_DATABASE.filter(game => {
    const matchFilter = currentFilter === 'all' || game.console === currentFilter;
    const matchSearch = currentSearchTerm === '' || 
      game.title.toLowerCase().includes(currentSearchTerm) ||
      game.tags.toLowerCase().includes(currentSearchTerm);
    return matchFilter && matchSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
        <div style="font-size: 3rem; margin-bottom: 12px;">🔍</div>
        <h3 style="color: #fff; margin-bottom: 8px;">Nenhum clássico encontrado</h3>
        <p style="color: #94a3b8;">Tente buscar por outro termo ou limpe a busca acima.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(game => `
    <div class="product-card" data-console="${game.console}" onmousemove="handleTilt(event, this)" onmouseleave="resetTilt(this)">
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
            <a href="play.html?game=${game.romParam}" target="_blank" class="btn btn-glass btn-sm" title="Testar no Navegador" onclick="SoundFX.playClick()">
              ▶ Testar
            </a>
            <button onclick="openCustomizeModal('${game.id}')" class="btn btn-cyan btn-sm">
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
  SoundFX.playClick();
  currentFilter = consoleType;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderCatalog();
}

// Barra de Busca
function initSearch() {
  const searchInput = document.getElementById('catalog-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchTerm = e.target.value.toLowerCase().trim();
      renderCatalog();
    });
  }
}

// Efeito 3D Tilt nos Cards
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

function initTiltEffect() {}

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

  SoundFX.playNfcSuccess();
  if (navigator.vibrate) navigator.vibrate([80, 50, 80]);

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
      <a href="play.html?game=${game.romParam}" target="_blank" class="btn btn-cyan btn-sm" style="width: 100%; font-size: 0.75rem; padding: 8px;" onclick="SoundFX.playClick()">
        ▶ Abrir Jogo
      </a>
    </div>
  `;
}

// Modal de Customização de Pedido
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

// Toggle Menu Mobile
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