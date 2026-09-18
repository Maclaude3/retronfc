/**
 * RetroNFC.com.br - Admin Dashboard Script (admin.js) v1.0
 * Gestão de Pedidos com Endereço, Métricas de Vendas e Estação Web NFC Integrada
 */

// Senha padrão de acesso do lojista (pode ser alterada)
const ADMIN_PASSCODE = 'admin123';

// Dados Iniciais de Pedidos
const DEFAULT_ORDERS = [
  {
    id: 1052,
    date: '18/09/2026 08:35',
    customerName: 'Lucas Silveira',
    phone: '11987654321',
    address: 'Rua Augusta, 1420, Apto 82',
    neighborhood: 'Consolação',
    city: 'São Paulo',
    state: 'SP',
    zip: '01304-001',
    gameKey: 'moonwalker',
    gameTitle: "Michael Jackson's Moonwalker",
    console: 'Mega Drive',
    icon: '🎩',
    status: 'pending', // pending | recorded | shipped
    trackingCode: ''
  },
  {
    id: 1051,
    date: '18/09/2026 07:15',
    customerName: 'Rodrigo Mendes',
    phone: '21998127744',
    address: 'Av. Atlântica, 2600, Bloco B',
    neighborhood: 'Copacabana',
    city: 'Rio de Janeiro',
    state: 'RJ',
    zip: '22070-000',
    gameKey: 'top_gear',
    gameTitle: 'Top Gear',
    console: 'Super Nintendo',
    icon: '🏎️',
    status: 'pending',
    trackingCode: ''
  },
  {
    id: 1050,
    date: '17/09/2026 21:40',
    customerName: 'Camila Fernandes',
    phone: '31971238899',
    address: 'Rua dos Aimorés, 850, Sala 302',
    neighborhood: 'Savassi',
    city: 'Belo Horizonte',
    state: 'MG',
    zip: '30140-071',
    gameKey: 'super_mario',
    gameTitle: 'Super Mario World',
    console: 'Super Nintendo',
    icon: '🍄',
    status: 'pending',
    trackingCode: ''
  },
  {
    id: 1049,
    date: '17/09/2026 18:20',
    customerName: 'Bruno Albuquerque',
    phone: '41984551234',
    address: 'Rua XV de Novembro, 1024',
    neighborhood: 'Centro',
    city: 'Curitiba',
    state: 'PR',
    zip: '80020-310',
    gameKey: 'sonic_2',
    gameTitle: 'Sonic the Hedgehog 2',
    console: 'Mega Drive',
    icon: '🦔',
    status: 'recorded',
    trackingCode: ''
  },
  {
    id: 1048,
    date: '17/09/2026 15:10',
    customerName: 'Marcos Vinicius',
    phone: '61991223344',
    address: 'SQS 308, Bloco F, Apto 204',
    neighborhood: 'Asa Sul',
    city: 'Brasília',
    state: 'DF',
    zip: '70355-060',
    gameKey: 'street_fighter',
    gameTitle: 'Street Fighter II Turbo',
    console: 'Super Nintendo',
    icon: '🥊',
    status: 'shipped',
    trackingCode: 'NL984712345BR'
  },
  {
    id: 1047,
    date: '17/09/2026 11:05',
    customerName: 'Rafael Guimarães',
    phone: '51981112233',
    address: 'Rua dos Andradas, 1234',
    neighborhood: 'Centro Histórico',
    city: 'Porto Alegre',
    state: 'RS',
    zip: '90020-008',
    gameKey: 'donkey_kong',
    gameTitle: 'Donkey Kong Country',
    console: 'Super Nintendo',
    icon: '🍌',
    status: 'shipped',
    trackingCode: 'NL984711122BR'
  }
];

// Dados dos Mais Vendidos
const TOP_SELLERS_DATA = [
  { rank: 1, name: 'Super Mario World', console: 'SNES', sales: 42, pct: 100 },
  { rank: 2, name: "Michael Jackson's Moonwalker", console: 'Mega Drive', sales: 28, pct: 67 },
  { rank: 3, name: 'Top Gear', console: 'SNES', sales: 24, pct: 57 },
  { rank: 4, name: 'Sonic the Hedgehog 2', console: 'Mega Drive', sales: 19, pct: 45 },
  { rank: 5, name: 'Street Fighter II Turbo', console: 'SNES', sales: 15, pct: 36 },
  { rank: 6, name: 'Donkey Kong Country', console: 'SNES', sales: 12, pct: 29 },
  { rank: 7, name: 'Mortal Kombat II', console: 'Mega Drive', sales: 9, pct: 21 }
];

let orders = [];
let currentFilter = 'all';
let currentActiveOrderId = null;
let currentSelectedGame = 'moonwalker';

// ==========================================================================
// INICIALIZAÇÃO & AUTENTICAÇÃO
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  loadOrders();
  renderTopSellers();
  initNfcStation();
  checkNfcSupport();
});

function initAuth() {
  const isAuth = sessionStorage.getItem('retronfc_admin_auth') === 'true' || 
                 localStorage.getItem('retronfc_admin_auth') === 'true';
  const overlay = document.getElementById('login-overlay');
  
  if (isAuth && overlay) {
    overlay.style.display = 'none';
  } else if (overlay) {
    overlay.style.display = 'flex';
  }

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
}

function handleLogin(e) {
  e.preventDefault();
  const input = document.getElementById('admin-password');
  const remember = document.getElementById('remember-me');
  const errEl = document.getElementById('login-error');

  if (input.value === ADMIN_PASSCODE) {
    sessionStorage.setItem('retronfc_admin_auth', 'true');
    if (remember && remember.checked) {
      localStorage.setItem('retronfc_admin_auth', 'true');
    }
    const overlay = document.getElementById('login-overlay');
    if (overlay) overlay.style.display = 'none';
    if (errEl) errEl.style.display = 'none';
    logTerminal('✅ Autenticado com sucesso no Painel Operacional RetroNFC.');
  } else {
    if (errEl) {
      errEl.textContent = 'Senha incorreta. Tente novamente.';
      errEl.style.display = 'block';
    }
  }
}

function logout() {
  sessionStorage.removeItem('retronfc_admin_auth');
  localStorage.removeItem('retronfc_admin_auth');
  window.location.reload();
}

// ==========================================================================
// GESTÃO DE PEDIDOS
// ==========================================================================
function loadOrders() {
  const saved = localStorage.getItem('retronfc_orders_v1');
  if (saved) {
    try {
      orders = JSON.parse(saved);
    } catch (e) {
      orders = [...DEFAULT_ORDERS];
    }
  } else {
    orders = [...DEFAULT_ORDERS];
    saveOrders();
  }
  renderOrders();
  updateKpiMetrics();
}

function saveOrders() {
  localStorage.setItem('retronfc_orders_v1', JSON.stringify(orders));
}

function updateKpiMetrics() {
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const recordedOrders = orders.filter(o => o.status === 'recorded' || o.status === 'shipped').length;
  const revenueTotal = (totalOrders * 29.90).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const kpiRev = document.getElementById('kpi-revenue');
  const kpiTot = document.getElementById('kpi-orders-total');
  const kpiPend = document.getElementById('kpi-orders-pending');
  const kpiRec = document.getElementById('kpi-orders-recorded');

  if (kpiRev) kpiRev.textContent = revenueTotal;
  if (kpiTot) kpiTot.textContent = totalOrders;
  if (kpiPend) kpiPend.textContent = pendingOrders;
  if (kpiRec) kpiRec.textContent = recordedOrders;
}

function renderOrders() {
  const tbody = document.getElementById('orders-table-body');
  if (!tbody) return;

  const filtered = orders.filter(o => {
    if (currentFilter === 'all') return true;
    return o.status === currentFilter;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 36px; color: var(--text-muted);">
          Nenhum pedido encontrado nesta categoria.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(o => {
    const isSelected = currentActiveOrderId === o.id;
    let statusBadge = '';
    if (o.status === 'pending') {
      statusBadge = '<span class="status-badge pending">⏳ Pendente Gravação</span>';
    } else if (o.status === 'recorded') {
      statusBadge = '<span class="status-badge recorded">✅ Tag Gravada</span>';
    } else {
      statusBadge = `<span class="status-badge shipped" title="${o.trackingCode || 'Enviado'}">📦 Despachado</span>`;
    }

    const cleanPhone = o.phone.replace(/\D/g, '');
    const waUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(`Olá ${o.customerName}! Seu pedido #${o.id} do mini cartucho NFC de ${o.gameTitle} está sendo preparado pela RetroNFC.`)}`;

    return `
      <tr style="${isSelected ? 'background: rgba(0, 240, 255, 0.08);' : ''}">
        <td>
          <div style="font-weight: 800; color: #fff;">#${o.id}</div>
          <div style="font-size: 0.76rem; color: var(--text-dim);">${o.date}</div>
        </td>
        <td>
          <div class="customer-cell">
            <span class="customer-name">${o.customerName}</span>
            <a href="${waUrl}" target="_blank" class="customer-phone" title="Enviar WhatsApp">
              💬 (WhatsApp)
            </a>
          </div>
        </td>
        <td>
          <div class="address-cell">
            <div>${o.address} - ${o.neighborhood}</div>
            <div class="address-city">${o.city} - ${o.state} | CEP: ${o.zip}</div>
          </div>
        </td>
        <td>
          <div class="game-ordered-badge">
            <span>${o.icon || '🎮'}</span>
            <span>${o.gameTitle}</span>
          </div>
        </td>
        <td>
          ${statusBadge}
        </td>
        <td>
          <div class="actions-cell">
            <button onclick="selectOrderForRecording(${o.id})" class="btn-record-order" title="Carregar este jogo na Estação NFC">
              ⚡ Gravar Tag
            </button>
            <button onclick="copyShippingLabel(${o.id})" class="btn-icon-action" title="Copiar Etiqueta de Envio">
              📋
            </button>
            <button onclick="toggleOrderStatus(${o.id})" class="btn-icon-action" title="Avançar Status (Pendente -> Gravado -> Enviado)">
              🔄
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterOrders(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderOrders();
}

function selectOrderForRecording(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  currentActiveOrderId = order.id;
  currentSelectedGame = order.gameKey;

  // Atualiza dropdown da estação se disponível
  const select = document.getElementById('station-game-select');
  if (select) select.value = order.gameKey;

  updateStationDisplay();

  // Scroll suave até a estação
  const stationEl = document.getElementById('nfc-station-card');
  if (stationEl) {
    stationEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const currentJobBox = document.getElementById('station-current-job');
    if (currentJobBox) {
      currentJobBox.classList.add('highlight');
      setTimeout(() => currentJobBox.classList.remove('highlight'), 1800);
    }
  }

  logTerminal(`[Fila] Pedido #${order.id} selecionado! Cliente: ${order.customerName} - Jogo: ${order.gameTitle} (${order.console})`);
  renderOrders();
}

function copyShippingLabel(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  const label = `DESTINATÁRIO:
${order.customerName}
${order.address} - ${order.neighborhood}
${order.city} - ${order.state} | CEP: ${order.zip}
Tel/WhatsApp: ${order.phone}

CONTEÚDO:
Mini Cartucho Colecionável RetroNFC + Tag NFC Ativa
Jogo: ${order.gameTitle} (${order.console})
Pedido #${order.id}`;

  navigator.clipboard.writeText(label).then(() => {
    alert(`Etiqueta do Pedido #${order.id} copiada com sucesso para a área de transferência!`);
    logTerminal(`[Etiqueta] Dados de envio do Pedido #${order.id} copiados.`);
  });
}

function toggleOrderStatus(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  if (order.status === 'pending') {
    order.status = 'recorded';
    logTerminal(`[Status] Pedido #${order.id} marcado como: ✅ Tag Gravada`);
  } else if (order.status === 'recorded') {
    const tracking = prompt('Digite o código de rastreio dos Correios/Transportadora (ou deixe em branco):', order.trackingCode || 'NL' + Math.floor(100000000 + Math.random() * 900000000) + 'BR');
    order.status = 'shipped';
    order.trackingCode = tracking || 'Enviado';
    logTerminal(`[Status] Pedido #${order.id} marcado como: 📦 Despachado (${order.trackingCode})`);
  } else {
    order.status = 'pending';
    logTerminal(`[Status] Pedido #${order.id} retornado para: ⏳ Pendente de Gravação`);
  }

  saveOrders();
  renderOrders();
  updateKpiMetrics();
}

// ==========================================================================
// RANKING MAIS VENDIDOS
// ==========================================================================
function renderTopSellers() {
  const list = document.getElementById('ranking-list');
  if (!list) return;

  list.innerHTML = TOP_SELLERS_DATA.map(item => {
    let posClass = '';
    if (item.rank === 1) posClass = 'top1';
    else if (item.rank === 2) posClass = 'top2';
    else if (item.rank === 3) posClass = 'top3';

    return `
      <div class="ranking-item">
        <div class="ranking-pos ${posClass}">#${item.rank}</div>
        <div class="ranking-info">
          <div style="display: flex; justify-content: space-between;">
            <span class="ranking-name">${item.name} <span style="font-size: 0.75rem; color: var(--text-dim); font-weight: normal;">(${item.console})</span></span>
            <span class="ranking-sales">${item.sales} un</span>
          </div>
          <div class="ranking-bar-bg">
            <div class="ranking-bar-fill" style="width: ${item.pct}%;"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================================================
// ESTAÇÃO DE GRAVAÇÃO NFC
// ==========================================================================
function initNfcStation() {
  const select = document.getElementById('station-game-select');
  if (!select) return;

  // Popula catálogo de jogos disponíveis
  const gamesList = [
    { key: 'moonwalker', name: "Michael Jackson's Moonwalker (Mega Drive)", icon: '🎩' },
    { key: 'top_gear', name: 'Top Gear (SNES)', icon: '🏎️' },
    { key: 'donkey_kong', name: 'Donkey Kong Country (SNES)', icon: '🍌' },
    { key: 'sonic_2', name: 'Sonic the Hedgehog 2 (Mega Drive)', icon: '🦔' },
    { key: 'super_mario', name: 'Super Mario World (SNES)', icon: '🍄' },
    { key: 'super_mario_kart', name: 'Super Mario Kart (SNES)', icon: '🏎️' },
    { key: 'street_fighter', name: 'Street Fighter II Turbo (SNES)', icon: '🥊' },
    { key: 'mortal_kombat_2', name: 'Mortal Kombat II (Mega Drive)', icon: '🐉' },
    { key: 'zelda_alttp', name: 'Zelda: Link to the Past (SNES)', icon: '🗡️' },
    { key: 'mega_man_x', name: 'Mega Man X (SNES)', icon: '🤖' },
    { key: 'streets_of_rage_2', name: 'Streets of Rage 2 (Mega Drive)', icon: '🥋' },
    { key: 'golden_axe', name: 'Golden Axe (Mega Drive)', icon: '🪓' }
  ];

  select.innerHTML = gamesList.map(g => `<option value="${g.key}">${g.icon} ${g.name}</option>`).join('');

  select.addEventListener('change', (e) => {
    currentSelectedGame = e.target.value;
    currentActiveOrderId = null; // desvincula pedido se trocar manualmente
    updateStationDisplay();
    renderOrders();
  });

  updateStationDisplay();
}

function updateStationDisplay() {
  const jobTitle = document.getElementById('station-job-title');
  const urlDisplay = document.getElementById('station-url-display');
  const jobBadge = document.getElementById('station-job-badge');

  const origin = window.location.origin.includes('http') ? window.location.origin : 'https://retronfc.com.br';
  const targetUrl = `${origin}/play.html?game=${currentSelectedGame}`;

  if (urlDisplay) urlDisplay.value = targetUrl;

  if (currentActiveOrderId) {
    const order = orders.find(o => o.id === currentActiveOrderId);
    if (order) {
      if (jobBadge) jobBadge.textContent = `PEDIDO ATIVO #${order.id} - ${order.customerName}`;
      if (jobTitle) jobTitle.textContent = `${order.icon || '🎮'} ${order.gameTitle} (${order.console})`;
      return;
    }
  }

  const select = document.getElementById('station-game-select');
  const selectedText = select && select.options[select.selectedIndex] ? select.options[select.selectedIndex].text : currentSelectedGame;
  if (jobBadge) jobBadge.textContent = 'GRAVAÇÃO AVULSA (SEM PEDIDO VINCULADO)';
  if (jobTitle) jobTitle.textContent = selectedText;
}

function checkNfcSupport() {
  const indicator = document.getElementById('nfc-indicator');
  const text = document.getElementById('nfc-indicator-text');
  if ('NDEFReader' in window) {
    if (indicator) indicator.className = 'nfc-status-indicator';
    if (text) text.textContent = 'Sensor Web NFC Ativo';
    logTerminal('📡 Sensor Web NFC do smartphone detectado e pronto para gravar.');
  } else {
    if (indicator) indicator.className = 'nfc-status-indicator warning';
    if (text) text.textContent = 'Modo PC / Simulação';
    logTerminal('ℹ️ Acessando via PC ou navegador sem Web NFC nativo. O painel operará em modo simulação para testes.');
  }
}

async function writeNfcTag() {
  const urlDisplay = document.getElementById('station-url-display');
  const targetUrl = urlDisplay ? urlDisplay.value : `https://retronfc.com.br/play.html?game=${currentSelectedGame}`;

  logTerminal(`[Gravação] Iniciando escrita da URL: ${targetUrl}`);
  logTerminal('👉 Aproxime a Tag NFC da traseira do smartphone agora...');

  if ('NDEFReader' in window) {
    try {
      const ndef = new NDEFReader();
      await ndef.write({
        records: [
          { recordType: 'url', data: targetUrl }
        ]
      });

      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      logTerminal('🎉 SUCESSO! Tag NFC gravada e validada com sucesso!');

      // Se havia um pedido vinculado, marca como gravado automaticamente!
      if (currentActiveOrderId) {
        const order = orders.find(o => o.id === currentActiveOrderId);
        if (order) {
          order.status = 'recorded';
          saveOrders();
          renderOrders();
          updateKpiMetrics();
          logTerminal(`✅ Pedido #${order.id} (${order.customerName}) atualizado para: Tag Gravada!`);
        }
      }
    } catch (err) {
      logTerminal(`❌ Erro ao gravar Tag: ${err.message || err}`);
    }
  } else {
    // Simulação no Desktop
    setTimeout(() => {
      logTerminal('⚡ [SIMULAÇÃO PC] Tag NTAG213/215 detectada com sucesso!');
      logTerminal(`✅ [SIMULAÇÃO PC] Link gravado com sucesso: ${targetUrl}`);
      if (currentActiveOrderId) {
        const order = orders.find(o => o.id === currentActiveOrderId);
        if (order) {
          order.status = 'recorded';
          saveOrders();
          renderOrders();
          updateKpiMetrics();
          logTerminal(`✅ Pedido #${order.id} (${order.customerName}) atualizado para: Tag Gravada!`);
        }
      }
      alert(`[Gravação Concluída no Painel!]

Link Gravado: ${targetUrl}

Para gravação física real na Tag adesiva, acerte este painel pelo Google Chrome no seu celular Android com NFC ativo.`);
    }, 1200);
  }
}

async function testReadNfcTag() {
  logTerminal('[Leitura] Preparando leitor NFC... Aproxime uma Tag para verificar o conteúdo gravado.');
  if ('NDEFReader' in window) {
    try {
      const ndef = new NDEFReader();
      await ndef.scan();
      logTerminal('🔍 Leitor ativado. Encoste a Tag...');
      ndef.onreading = event => {
        logTerminal(`[Tag Detectada] Número Serial: ${event.serialNumber}`);
        for (const record of event.message.records) {
          if (record.recordType === 'url') {
            const dec = new TextDecoder();
            logTerminal(`🔗 URL Gravada: ${dec.decode(record.data)}`);
          }
        }
      };
    } catch (err) {
      logTerminal(`❌ Erro na leitura: ${err.message || err}`);
    }
  } else {
    logTerminal('ℹ️ [Simulação PC] A leitura real de tags físicas requer smartphone com sensor NFC.');
  }
}

function logTerminal(msg) {
  const terminal = document.getElementById('station-terminal');
  if (!terminal) return;
  const time = new Date().toLocaleTimeString('pt-BR');
  const line = document.createElement('div');
  line.textContent = `[${time}] ${msg}`;
  terminal.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight;
}

// Modal Novo Pedido Manual
function openNewOrderModal() {
  const m = document.getElementById('modal-new-order');
  if (m) m.style.display = 'flex';
}

function closeNewOrderModal() {
  const m = document.getElementById('modal-new-order');
  if (m) m.style.display = 'none';
}

function createManualOrder(e) {
  e.preventDefault();
  const name = document.getElementById('form-name').value;
  const phone = document.getElementById('form-phone').value;
  const address = document.getElementById('form-address').value;
  const neighborhood = document.getElementById('form-neighborhood').value;
  const city = document.getElementById('form-city').value;
  const state = document.getElementById('form-state').value;
  const zip = document.getElementById('form-zip').value;
  const gameSelect = document.getElementById('form-game');
  const gameKey = gameSelect.value;
  const gameTitle = gameSelect.options[gameSelect.selectedIndex].text;

  const newId = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1001;
  const newOrder = {
    id: newId,
    date: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
    customerName: name,
    phone: phone,
    address: address,
    neighborhood: neighborhood,
    city: city,
    state: state,
    zip: zip,
    gameKey: gameKey,
    gameTitle: gameTitle,
    console: gameKey === 'moonwalker' || gameKey === 'sonic_2' ? 'Mega Drive' : 'Super Nintendo',
    icon: '🎮',
    status: 'pending',
    trackingCode: ''
  };

  orders.unshift(newOrder);
  saveOrders();
  renderOrders();
  updateKpiMetrics();
  closeNewOrderModal();
  logTerminal(`[Novo Pedido] Pedido #${newId} criado manualmente para ${name}!`);
  alert(`Pedido #${newId} cadastrado com sucesso!`);
}
