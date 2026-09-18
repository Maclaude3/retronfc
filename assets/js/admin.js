/**
 * RetroNFC.com.br - Admin Dashboard Script (admin.js) v2.0
 * Camadas de Segurança Criptográfica, Proteção Anti-Força Bruta e Criptografia de Dados
 */

// Hash Criptográfico SHA-256 Salted da Senha Mestra (A senha pura NUNCA é exposta)
const AUTH_SALT = 'retronfc_sec_salt_v1_99x!';
const AUTH_HASH_HEX = '4de859e003775fc007723d47c69fab5674b3593c304d2cb89ab3433cc8bb6e07';

// Configuração de Segurança de Sessão & Força Bruta
const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 5;
const SESSION_DURATION_HOURS = 8;

// Chave AES-GCM mantida estritamente em memória RAM (destruída ao sair)
let sessionCryptoKey = null;

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
    status: 'pending',
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
// CRIPTOGRAFIA (Web Crypto API)
// ==========================================================================
async function sha256Hex(text) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function deriveAesKey(password) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(AUTH_SALT),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptData(plainText, key) {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    enc.encode(plainText)
  );

  return {
    iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
    data: Array.from(new Uint8Array(cipher)).map(b => b.toString(16).padStart(2, '0')).join('')
  };
}

async function decryptData(cipherObj, key) {
  const iv = new Uint8Array(cipherObj.iv.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
  const data = new Uint8Array(cipherObj.data.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    data
  );

  return new TextDecoder().decode(plain);
}

// ==========================================================================
// SEGURANÇA & FORÇA BRUTA (Rate Limiting)
// ==========================================================================
function getLockoutState() {
  try {
    const raw = localStorage.getItem('retronfc_lockout');
    if (!raw) return { attempts: 0, lockedUntil: 0 };
    return JSON.parse(raw);
  } catch (e) {
    return { attempts: 0, lockedUntil: 0 };
  }
}

function recordFailedAttempt() {
  const state = getLockoutState();
  state.attempts += 1;
  if (state.attempts >= MAX_ATTEMPTS) {
    state.lockedUntil = Date.now() + (LOCKOUT_MINUTES * 60 * 1000);
  }
  localStorage.setItem('retronfc_lockout', JSON.stringify(state));
  return state;
}

function clearLockoutState() {
  localStorage.removeItem('retronfc_lockout');
}

function checkLockout() {
  const state = getLockoutState();
  const lockoutMsg = document.getElementById('login-lockout-msg');
  const submitBtn = document.querySelector('#login-form button[type="submit"]');

  if (state.lockedUntil && Date.now() < state.lockedUntil) {
    const remSec = Math.ceil((state.lockedUntil - Date.now()) / 1000);
    const remMin = Math.ceil(remSec / 60);
    if (lockoutMsg) {
      lockoutMsg.textContent = `🛑 Bloqueio de segurança temporário ativo. Muitas tentativas consecutivas. Tente novamente em ${remMin} minuto(s).`;
      lockoutMsg.style.display = 'block';
    }
    if (submitBtn) submitBtn.disabled = true;
    return true;
  } else {
    if (state.lockedUntil && Date.now() >= state.lockedUntil) {
      clearLockoutState();
    }
    if (lockoutMsg) lockoutMsg.style.display = 'none';
    if (submitBtn) submitBtn.disabled = false;
    return false;
  }
}

// ==========================================================================
// INICIALIZAÇÃO & AUTENTICAÇÃO
// ==========================================================================

// ==========================================================================
// INTEGRAÇÃO INTELIGENTE JARVIS & WHATSAPP
// ==========================================================================
function parseJarvisOrderText() {
  const input = document.getElementById('jarvis-paste-input');
  if (!input || !input.value.trim()) {
    alert('Por favor, cole primeiro o texto com os dados do cliente.');
    return;
  }

  const text = input.value;
  
  // Expressões regulares para extrair os campos
  const nameMatch = text.match(/(?:nome|cliente|destinat[áa]rio)[:\s]+([^\n|;]+)/i);
  const phoneMatch = text.match(/(?:tel|telefone|celular|whats|whatsapp)[:\s]+([0-9()+\s\-]+)/i);
  const addressMatch = text.match(/(?:end|endere[çc]o|rua|av|avenida|logradouro)[:\s]+([^\n|;]+)/i);
  const neighborhoodMatch = text.match(/(?:bairro)[:\s]+([^\n|;]+)/i);
  const cityMatch = text.match(/(?:cidade)[:\s]+([^\n|;]+)/i);
  const stateMatch = text.match(/(?:uf|estado)[:\s]+([a-zA-Z]{2})/i);
  const zipMatch = text.match(/(?:cep)[:\s]+([0-9]{5}\-?[0-9]{3})/i);
  const gameMatch = text.match(/(?:jogo|game|fita|cartucho)[:\s]+([^\n|;]+)/i);

  if (nameMatch) document.getElementById('form-name').value = nameMatch[1].trim();
  if (phoneMatch) document.getElementById('form-phone').value = phoneMatch[1].trim();
  if (addressMatch) document.getElementById('form-address').value = addressMatch[1].trim();
  if (neighborhoodMatch) document.getElementById('form-neighborhood').value = neighborhoodMatch[1].trim();
  if (cityMatch) document.getElementById('form-city').value = cityMatch[1].trim();
  if (stateMatch) document.getElementById('form-state').value = stateMatch[1].trim().toUpperCase();
  if (zipMatch) document.getElementById('form-zip').value = zipMatch[1].trim();

  if (gameMatch) {
    const rawGame = gameMatch[1].toLowerCase();
    const select = document.getElementById('form-game');
    if (select) {
      for (let i = 0; i < select.options.length; i++) {
        const optText = select.options[i].text.toLowerCase();
        const optVal = select.options[i].value.toLowerCase();
        if (optText.includes(rawGame) || rawGame.includes(optVal) || (rawGame.includes('mario') && optVal.includes('mario')) || (rawGame.includes('moonwalker') && optVal.includes('moonwalker')) || (rawGame.includes('top gear') && optVal.includes('top_gear')) || (rawGame.includes('sonic') && optVal.includes('sonic'))) {
          select.selectedIndex = i;
          break;
        }
      }
    }
  }

  alert('⚡ Campos preenchidos com sucesso a partir dos dados do Jarvis!');
}

// Verifica se a URL do admin foi aberta com parâmetros de pedido automático do Jarvis
function checkUrlAutoOrder() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('action') === 'new_order' && params.get('name')) {
    const newId = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1001;
    const gameKey = params.get('game') || 'super_mario';
    
    // Procura nome amigável do jogo
    const gamesDict = {
      moonwalker: "Michael Jackson's Moonwalker",
      top_gear: "Top Gear",
      donkey_kong: "Donkey Kong Country",
      sonic_2: "Sonic the Hedgehog 2",
      super_mario: "Super Mario World",
      super_mario_kart: "Super Mario Kart",
      street_fighter: "Street Fighter II Turbo",
      mortal_kombat_2: "Mortal Kombat II",
      zelda_alttp: "Zelda: Link to the Past",
      mega_man_x: "Mega Man X"
    };

    const newOrder = {
      id: newId,
      date: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
      customerName: params.get('name'),
      phone: params.get('phone') || '',
      address: params.get('address') || '',
      neighborhood: params.get('neighborhood') || '',
      city: params.get('city') || '',
      state: params.get('state') || 'SP',
      zip: params.get('zip') || '',
      gameKey: gameKey,
      gameTitle: gamesDict[gameKey] || gameKey,
      console: gameKey.includes('moonwalker') || gameKey.includes('sonic') ? 'Mega Drive' : 'Super Nintendo',
      icon: '🎮',
      status: 'pending',
      trackingCode: ''
    };

    orders.unshift(newOrder);
    saveOrders();
    renderOrders();
    updateKpiMetrics();
    logTerminal(`[Jarvis URL] Novo pedido #${newId} de ${newOrder.customerName} recebido via link automático!`);
    
    // Remove os parâmetros da barra de endereço para não duplicar
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const isAuth = checkSession();
  const overlay = document.getElementById('login-overlay');

  if (isAuth) {
    if (overlay) overlay.style.display = 'none';
    const app = document.getElementById('admin-app');
    if (app) app.style.display = 'flex';
    // Se a chave não estiver em RAM mas a sessão for válida no navegador local, recupera dados
    await loadOrders();
    checkUrlAutoOrder();
    renderTopSellers();
    initNfcStation();
    checkNfcSupport();
    loadSupabasePasses();
    initStoreMode();
  } else {
    if (overlay) overlay.style.display = 'flex';
    checkLockout();
  }

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
});

function checkSession() {
  try {
    const raw = sessionStorage.getItem('retronfc_session') || localStorage.getItem('retronfc_session');
    if (!raw) return false;
    const session = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      logout();
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

async function handleLogin(e) {
  e.preventDefault();

  if (checkLockout()) return;

  const input = document.getElementById('admin-password');
  const remember = document.getElementById('remember-me');
  const errEl = document.getElementById('login-error');
  const submitBtn = document.querySelector('#login-form button[type="submit"]');

  if (submitBtn) submitBtn.textContent = 'Verificando Criptografia...';

  const enteredPassword = input.value;
  const computedHash = await sha256Hex(AUTH_SALT + enteredPassword);

  if (computedHash === AUTH_HASH_HEX) {
    clearLockoutState();

    // Deriva a chave AES-GCM para criptografia/descriptografia de dados
    sessionCryptoKey = await deriveAesKey(enteredPassword);

    const sessionData = {
      authenticated: true,
      expiresAt: Date.now() + (SESSION_DURATION_HOURS * 3600 * 1000)
    };

    sessionStorage.setItem('retronfc_session', JSON.stringify(sessionData));
    if (remember && remember.checked) {
      localStorage.setItem('retronfc_session', JSON.stringify(sessionData));
    }

    const overlay = document.getElementById('login-overlay');
    if (overlay) overlay.style.display = 'none';
    const app = document.getElementById('admin-app');
    if (app) app.style.display = 'flex';
    if (errEl) errEl.style.display = 'none';

    // Limpa o campo de senha da memória do DOM
    input.value = '';

    await loadOrders();
    checkUrlAutoOrder();
    renderTopSellers();
    initNfcStation();
    checkNfcSupport();
    loadSupabasePasses();
    initStoreMode();

    logTerminal('🔐 Autenticado com sucesso. Chave AES-GCM 256-bit ativada em memória RAM.');
  } else {
    const state = recordFailedAttempt();
    const remaining = MAX_ATTEMPTS - state.attempts;

    if (state.attempts >= MAX_ATTEMPTS) {
      checkLockout();
    } else {
      if (errEl) {
        errEl.textContent = `Senha incorreta. Tentativas restantes: ${remaining}.`;
        errEl.style.display = 'block';
      }
    }
  }

  if (submitBtn) submitBtn.textContent = 'Entrar no Painel Operacional →';
}

function logout() {
  sessionStorage.removeItem('retronfc_session');
  localStorage.removeItem('retronfc_session');
  sessionCryptoKey = null; // Destrói chave da memória RAM
  window.location.reload();
}

// ==========================================================================
// GESTÃO DE PEDIDOS COM CRIPTOGRAFIA EM REPOUSO
// ==========================================================================
async function loadOrders() {
  const encRaw = localStorage.getItem('retronfc_orders_encrypted');
  if (encRaw && sessionCryptoKey) {
    try {
      const cipherObj = JSON.parse(encRaw);
      const decryptedJson = await decryptData(cipherObj, sessionCryptoKey);
      orders = JSON.parse(decryptedJson);
    } catch (e) {
      // Se houver falha de decriptação, cai para defaults seguros
      orders = [...DEFAULT_ORDERS];
      await saveOrders();
    }
  } else {
    // Primeira carga ou sem pedidos criptografados
    orders = [...DEFAULT_ORDERS];
    if (sessionCryptoKey) {
      await saveOrders();
    }
  }

  renderOrders();
  updateKpiMetrics();
}

async function saveOrders() {
  if (sessionCryptoKey) {
    try {
      const jsonStr = JSON.stringify(orders);
      const encrypted = await encryptData(jsonStr, sessionCryptoKey);
      localStorage.setItem('retronfc_orders_encrypted', JSON.stringify(encrypted));
      // Remove versão antiga em cleartext se existir
      localStorage.removeItem('retronfc_orders_v1');
    } catch (e) {
      console.error('Falha ao criptografar dados:', e);
    }
  }
}

function updateKpiMetrics() {
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const recordedOrders = orders.filter(o => o.status === 'recorded' || o.status === 'shipped').length;
  
  // Total faturado calculando pedidos físicos e passes
  const ordersRevenue = orders.reduce((sum, o) => sum + (o.price || 24.99), 0);
  const passesRevenue = (supabasePassesList.length || 10) * 9.99; // RetroPasses emitidos
  const totalRevenue = ordersRevenue + passesRevenue;

  const kpiRev = document.getElementById('kpi-revenue');
  const kpiTot = document.getElementById('kpi-orders-total');
  const kpiPend = document.getElementById('kpi-orders-pending');
  const kpiRec = document.getElementById('kpi-orders-recorded');
  const kpiPasses = document.getElementById('kpi-passes-count');

  if (kpiRev) kpiRev.textContent = totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  if (kpiTot) kpiTot.textContent = totalOrders;
  if (kpiPend) kpiPend.textContent = pendingOrders;
  if (kpiRec) kpiRec.textContent = `Gravados: ${recordedOrders}`;
  if (kpiPasses) kpiPasses.textContent = supabasePassesList.length || 10;

  // --- META DA IMPRESSORA 3D (R$ 1.500,00) ---
  const GOAL_TARGET = 1500.00;
  const currentAmount = Math.min(totalRevenue, GOAL_TARGET);
  const percent = Math.min(100, Math.max(0, (totalRevenue / GOAL_TARGET) * 100));
  const remaining = Math.max(0, GOAL_TARGET - totalRevenue);
  const passesRemaining = Math.ceil(remaining / 9.99);

  const goalCurrentEl = document.getElementById('goal-current-amount');
  const goalBarEl = document.getElementById('goal-progress-bar');
  const goalPercentEl = document.getElementById('goal-percent-text');
  const goalRemainEl = document.getElementById('goal-remaining-text');

  if (goalCurrentEl) goalCurrentEl.textContent = totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  if (goalBarEl) goalBarEl.style.width = `${percent.toFixed(1)}%`;
  if (goalPercentEl) goalPercentEl.innerHTML = `🚀 <strong>${percent.toFixed(1)}%</strong> Concluído`;
  if (goalRemainEl) {
    if (remaining <= 0) {
      goalRemainEl.innerHTML = `🎉 <strong>META ATINGIDA!</strong> Você já pode adquirir sua impressora 3D!`;
    } else {
      goalRemainEl.innerHTML = `Faltam apenas <strong>${remaining.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong> (~${passesRemaining} RetroPasses a R$ 9,99)`;
    }
  }

  renderRecentOrders();
  renderCustomers();
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

  const select = document.getElementById('station-game-select');
  if (select) select.value = order.gameKey;

  updateStationDisplay();

  const stationEl = document.getElementById('nfc-station-card');
  if (stationEl) {
    stationEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const currentJobBox = document.getElementById('station-current-job');
    if (currentJobBox) {
      currentJobBox.classList.add('highlight');
      setTimeout(() => currentJobBox.classList.remove('highlight'), 1800);
    }
  }

  logTerminal(`[Fila] Pedido #${order.id} vinculado! Cliente: ${order.customerName} - Jogo: ${order.gameTitle} (${order.console})`);
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
    alert(`Etiqueta do Pedido #${order.id} copiada com sucesso!`);
    logTerminal(`[Etiqueta] Dados de envio do Pedido #${order.id} copiados.`);
  });
}

async function toggleOrderStatus(orderId) {
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

  await saveOrders();
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
    currentActiveOrderId = null;
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
    logTerminal('📡 Sensor Web NFC detectado e pronto para gravar.');
  } else {
    if (indicator) indicator.className = 'nfc-status-indicator warning';
    if (text) text.textContent = 'Modo PC / Simulação';
    logTerminal('ℹ️ Operando em modo de simulação no PC. Para gravação física no chip, abra pelo Chrome no celular Android.');
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

      if (currentActiveOrderId) {
        const order = orders.find(o => o.id === currentActiveOrderId);
        if (order) {
          order.status = 'recorded';
          await saveOrders();
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
    setTimeout(async () => {
      logTerminal('⚡ [SIMULAÇÃO PC] Tag NTAG213/215 detectada com sucesso!');
      logTerminal(`✅ [SIMULAÇÃO PC] Link gravado com sucesso: ${targetUrl}`);
      if (currentActiveOrderId) {
        const order = orders.find(o => o.id === currentActiveOrderId);
        if (order) {
          order.status = 'recorded';
          await saveOrders();
          renderOrders();
          updateKpiMetrics();
          logTerminal(`✅ Pedido #${order.id} (${order.customerName}) atualizado para: Tag Gravada!`);
        }
      }
      alert(`[Gravação Concluída no Painel!]\n\nLink Gravado: ${targetUrl}\n\nPara gravação física real na Tag adesiva, acesse este painel pelo Google Chrome no seu celular Android com NFC ativo.`);
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

async function createManualOrder(e) {
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
  await saveOrders();
  renderOrders();
  updateKpiMetrics();
  closeNewOrderModal();
  logTerminal(`[Novo Pedido] Pedido #${newId} criado manualmente para ${name}!`);
  alert(`Pedido #${newId} cadastrado com sucesso!`);
}


// ==========================================================================
// 🎟️ RETROPASS DIGITAL - GERENCIADOR SUPABASE & PROTEÇÃO ANTI-PIRATARIA
// ==========================================================================
const SUPABASE_CONFIG = {
  url: 'https://wxgyhxwykspgdtszhuen.supabase.co',
  key: 'sb_publishable_fhnF2vvyh0f-kP1GSTB8Xg_Rb-Bk-WG'
};

const RETRO_GAME_TITLES = {
  'super_mario': 'Super Mario World (SNES)',
  'top_gear': 'Top Gear (SNES)',
  'donkey_kong': 'Donkey Kong Country (SNES)',
  'super_mario_kart': 'Super Mario Kart (SNES)',
  'street_fighter': 'Street Fighter II Turbo (SNES)',
  'moonwalker': "Michael Jackson's Moonwalker (Mega Drive)",
  'sonic_2': 'Sonic the Hedgehog 2 (Mega Drive)',
  'mortal_kombat_2': 'Mortal Kombat II (Mega Drive)',
  'zelda_alttp': 'The Legend of Zelda: A Link to the Past (SNES)',
  'mega_man_x': 'Mega Man X (SNES)',
  'streets_of_rage_2': 'Streets of Rage 2 (Mega Drive)',
  'golden_axe': 'Golden Axe (Mega Drive)'
};

function escapePassHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function loadSupabasePasses() {
  const tbody = document.getElementById('passes-table-body');
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="6" style="text-align: center; color: #94a3b8; padding: 20px;">
        🔄 Carregando RetroPasses do Supabase...
      </td>
    </tr>
  `;

  try {
    const resp = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/retronfc_passes?select=*&order=criado_em.desc`, {
      headers: {
        'apikey': SUPABASE_CONFIG.key,
        'Authorization': `Bearer ${SUPABASE_CONFIG.key}`
      }
    });

    if (!resp.ok) {
      throw new Error(`Status ${resp.status}`);
    }

    const passes = await resp.json();

    if (!passes || passes.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: #94a3b8; padding: 24px;">
            Nenhum RetroPass cadastrado ainda. Clique em "+ Gerar Novo RetroPass" para criar o primeiro!
          </td>
        </tr>
      `;
      return;
    }

    const now = new Date();
    tbody.innerHTML = passes.map(pass => {
      let statusBadge = '<span class="status-badge pending">🟡 Disponível</span>';
      const isExpired = pass.expira_em && now > new Date(pass.expira_em);

      if (isExpired) {
        statusBadge = '<span class="status-badge expired">🔴 Expirado</span>';
      } else if (pass.device_id || pass.status === 'ativo') {
        statusBadge = '<span class="status-badge recorded">🟢 Ativo (Vinculado)</span>';
      }

      let validadeText = `${pass.validade_meses || 6} meses (Ao ativar)`;
      if (pass.expira_em) {
        const d = new Date(pass.expira_em);
        validadeText = `Até ${d.toLocaleDateString('pt-BR')}`;
      }

      const deviceText = pass.device_id 
        ? `<span title="${escapePassHtml(pass.device_id)}" style="font-family: monospace; font-size: 0.8rem; color: #38bdf8;">📱 ${escapePassHtml(pass.device_id.substring(0, 14))}...</span>`
        : `<span style="color: #64748b; font-size: 0.8rem;">Aguardando 1º uso</span>`;

      const safeTitle = escapePassHtml(pass.game_title || pass.game_key);
      const safeToken = escapePassHtml(pass.token);
      const safeKey = escapePassHtml(pass.game_key);

      const resetBtn = pass.device_id ? `
        <button type="button" onclick="resetPassDevice('${safeToken}')" class="btn-secondary" style="font-size: 0.75rem; padding: 4px 8px; color: #f59e0b; border-color: rgba(245, 158, 11, 0.4);" title="Liberar vínculo de celular se o cliente trocou de aparelho">
          🔄 Liberar Aparelho
        </button>
      ` : '';

      return `
        <tr>
          <td><code style="background: rgba(0,240,255,0.1); color: #00f0ff; padding: 3px 8px; border-radius: 4px; font-weight: bold;">${safeToken}</code></td>
          <td><strong>${safeTitle}</strong></td>
          <td>${statusBadge}</td>
          <td style="font-size: 0.85rem;">${validadeText}</td>
          <td>${deviceText}</td>
          <td>
            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
              <button type="button" onclick="openQrModal('${safeToken}', '${safeKey}', '${safeTitle.replace(/'/g, "\\'")}')" class="btn-primary" style="font-size: 0.75rem; padding: 4px 8px;">
                📱 QR Code
              </button>
              <button type="button" onclick="copyPassLink('${safeToken}', '${safeKey}')" class="btn-secondary" style="font-size: 0.75rem; padding: 4px 8px;">
                🔗 Copiar Link
              </button>
              ${resetBtn}
            </div>
          </td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    console.error('Erro ao carregar passes do Supabase:', err);
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: #ef4444; padding: 20px;">
          ⚠️ Erro ao consultar passes no Supabase. Verifique a conexão com a internet ou credenciais da API.
        </td>
      </tr>
    `;
  }
}

function openNewPassModal() {
  const modal = document.getElementById('modal-new-pass');
  if (modal) {
    modal.style.display = 'flex';
    const rand = Math.floor(1000 + Math.random() * 9000);
    const tokenInput = document.getElementById('pass-form-token');
    if (tokenInput) tokenInput.value = `PASS-${rand}`;
  }
}

function closeNewPassModal() {
  const modal = document.getElementById('modal-new-pass');
  if (modal) modal.style.display = 'none';
}

async function submitCreateNewPass(e) {
  e.preventDefault();
  const gameKey = document.getElementById('pass-form-game').value;
  let token = document.getElementById('pass-form-token').value.trim();
  const months = parseInt(document.getElementById('pass-form-months').value, 10) || 6;

  if (!token) {
    const prefix = gameKey.substring(0, 3).toUpperCase();
    const rand = Math.floor(1000 + Math.random() * 9000);
    token = `PASS-${prefix}-${rand}`;
  }

  const title = RETRO_GAME_TITLES[gameKey] || gameKey;

  try {
    const resp = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/retronfc_passes`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_CONFIG.key,
        'Authorization': `Bearer ${SUPABASE_CONFIG.key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        token: token,
        game_key: gameKey,
        game_title: title,
        status: 'disponivel',
        validade_meses: months,
        criado_em: new Date().toISOString()
      })
    });

    if (!resp.ok) {
      const errData = await resp.json();
      alert('Erro ao criar passe no Supabase: ' + (errData.message || resp.statusText));
      return;
    }

    closeNewPassModal();
    loadSupabasePasses();
    initStoreMode();
    logTerminal(`[RetroPass] Novo passe digital criado: ${token} para ${title}!`);
    openQrModal(token, gameKey, title);
  } catch (err) {
    console.error('Erro ao criar passe:', err);
    alert('Erro de conexão ao comunicar com Supabase.');
  }
}

// ==========================================================================
// ⚙️ CONTROLE OPERACIONAL DE MODO DA LOJA (DIGITAL R$ 9,99 vs FÍSICO R$ 24,99)
// ==========================================================================
function initStoreMode() {
  const isPhysical = localStorage.getItem('retronfc_sales_mode') === 'physical_active';
  updateStoreModeUI(isPhysical);
}

function toggleStoreSalesMode() {
  const current = localStorage.getItem('retronfc_sales_mode') === 'physical_active';
  const next = !current;
  localStorage.setItem('retronfc_sales_mode', next ? 'physical_active' : 'digital_only');
  updateStoreModeUI(next);
  logTerminal(`[Modo de Vendas] Alterado para: ${next ? 'Físico + Digital Liberado' : 'Apenas RetroPass Digital (R$ 9,99)'}`);
  alert(`Modo da Loja alterado para: ${next ? 'Vendas de Chaveiros Físicos Liberadas (R$ 24,99)' : 'Apenas RetroPass Digital (R$ 9,99)'}`);
}

function updateStoreModeUI(isPhysical) {
  const badge = document.getElementById('store-mode-badge');
  const btn = document.getElementById('btn-toggle-sales-mode');
  if (badge) {
    if (isPhysical) {
      badge.className = 'status-badge recorded';
      badge.textContent = '✅ Chaveiros Físicos Liberados (R$ 24,99)';
    } else {
      badge.className = 'status-badge pending';
      badge.textContent = '🔒 Apenas RetroPass Digital (R$ 9,99)';
    }
  }
  if (btn) {
    btn.textContent = isPhysical ? '🔒 Bloquear Vendas Físicas (Modo Digital)' : '✅ Liberar Vendas de Chaveiros Físicos';
  }
}

// ==========================================================================
// 🎟️ GERENCIADOR DE CARD COLECIONÁVEL RETROPASS & DOWNLOAD EM PNG
// ==========================================================================
let currentModalPassData = {
  token: '',
  gameKey: '',
  gameTitle: '',
  coverUrl: '',
  consoleName: ''
};

function openQrModal(token, gameKey, gameTitle) {
  const modal = document.getElementById('modal-view-qr');
  if (!modal) return;

  const url = `https://retronfc.com.br/play.html?game=${encodeURIComponent(gameKey)}&pass=${encodeURIComponent(token)}`;
  currentModalPassUrl = url;

  // Localiza dados do jogo no catálogo
  const gameObj = (typeof GAMES_DATABASE !== 'undefined')
    ? GAMES_DATABASE.find(g => g.id === gameKey)
    : null;

  const coverUrl = gameObj && gameObj.cover ? gameObj.cover : 'assets/images/covers/super_mario.jpg';
  const consoleName = gameObj && gameObj.consoleName ? gameObj.consoleName : 'Super Nintendo (SNES)';

  currentModalPassData = {
    token: token,
    gameKey: gameKey,
    gameTitle: gameTitle || (gameObj ? gameObj.title : 'Jogo Clássico'),
    coverUrl: coverUrl,
    consoleName: consoleName
  };

  const titleEl = document.getElementById('qr-modal-title');
  const gameEl = document.getElementById('qr-modal-game');
  const consoleEl = document.getElementById('qr-modal-console');
  const coverEl = document.getElementById('qr-modal-cover');
  const tokenEl = document.getElementById('qr-modal-token');
  const imgEl = document.getElementById('qr-modal-img');
  const wppEl = document.getElementById('qr-modal-wpp-btn');

  if (titleEl) titleEl.innerHTML = `<span>🎟️</span> Card Colecionável: ${token}`;
  if (gameEl) gameEl.textContent = currentModalPassData.gameTitle;
  if (consoleEl) consoleEl.textContent = currentModalPassData.consoleName;
  if (coverEl) coverEl.src = coverUrl;
  if (tokenEl) tokenEl.textContent = token;
  if (imgEl) imgEl.src = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(url)}`;

  if (wppEl) {
    const wppMsg = `🎮 *Seu Card Colecionável RetroPass Chegou!*\n\nOlá! Aqui está o seu acesso exclusivo para jogar *${currentModalPassData.gameTitle}* direto no seu celular:

👉 ${url}

⚠️ *AVISO DE ATIVAÇÃO PESSOAL:*
Escaneie exclusivamente no smartphone onde você vai jogar. O passe é pessoal e se vincula automaticamente ao seu aparelho no 1º escaneamento. Não ative fora do celular e não compartilhe prints!

🎁 *LOTE FUNDADOR - CRÉDITO GARANTIDO:*
Você tem R$ 9,99 de crédito garantido para resgatar seu Chaveiro Físico NFC no futuro. Quando a confecção 3D for liberada, você só pagará a diferença de R$ 15,00!`;
    wppEl.href = `https://wa.me/?text=${encodeURIComponent(wppMsg)}`;
  }

  modal.style.display = 'flex';
}

function closeQrModal() {
  const modal = document.getElementById('modal-view-qr');
  if (modal) modal.style.display = 'none';
}

function copyModalLink() {
  if (!currentModalPassUrl) return;
  navigator.clipboard.writeText(currentModalPassUrl).then(() => {
    alert('Link do RetroPass copiado com sucesso!\n\n' + currentModalPassUrl);
  }).catch(() => {
    prompt('Copie o link abaixo:', currentModalPassUrl);
  });
}

function copyPassLink(token, gameKey) {
  const url = `https://retronfc.com.br/play.html?game=${encodeURIComponent(gameKey)}&pass=${encodeURIComponent(token)}`;
  navigator.clipboard.writeText(url).then(() => {
    alert('Link do RetroPass copiado com sucesso!\n\n' + url);
  }).catch(() => {
    prompt('Copie o link abaixo:', url);
  });
}

async function downloadPassCardAsPng() {
  if (!currentModalPassData.token) return;

  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 920;
  const ctx = canvas.getContext('2d');

  // Fundo gradiente cyberpunk escuro
  const bgGrad = ctx.createLinearGradient(0, 0, 0, 920);
  bgGrad.addColorStop(0, '#0f172a');
  bgGrad.addColorStop(0.5, '#090d16');
  bgGrad.addColorStop(1, '#020617');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 600, 920);

  // Borda neon degradê externa
  const borderGrad = ctx.createLinearGradient(0, 0, 600, 920);
  borderGrad.addColorStop(0, '#00f0ff');
  borderGrad.addColorStop(0.5, '#7928ca');
  borderGrad.addColorStop(1, '#ff0055');
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, 580, 900);

  // Borda sutil interna
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(20, 20, 560, 880);

  // Top Ribbon / Título
  ctx.fillStyle = '#00f0ff';
  ctx.font = 'bold 22px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('⚡ RETRONFC DIGITAL PASS', 40, 60);

  // Selo Dourado Lote Fundador
  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 15px Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('⭐ LOTE FUNDADOR · R$ 9,99', 560, 60);

  // Linha divisória
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath();
  ctx.moveTo(40, 78);
  ctx.lineTo(560, 78);
  ctx.stroke();

  function loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  const coverImg = await loadImage(currentModalPassData.coverUrl || 'assets/images/covers/super_mario.jpg');
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=12&data=${encodeURIComponent(currentModalPassUrl)}`;
  const qrImg = await loadImage(qrUrl);

  // Caixa de Informações do Jogo
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.fillRect(40, 95, 520, 105);
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
  ctx.strokeRect(40, 95, 520, 105);

  if (coverImg) {
    ctx.drawImage(coverImg, 55, 105, 85, 85);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(55, 105, 85, 85);
  }

  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Arial, sans-serif';
  ctx.fillText(currentModalPassData.gameTitle, 155, 145);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 16px Arial, sans-serif';
  ctx.fillText(currentModalPassData.consoleName, 155, 175);

  // Área Branca do QR Code
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(160, 220, 280, 280);
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.strokeRect(160, 220, 280, 280);

  if (qrImg) {
    ctx.drawImage(qrImg, 160, 220, 280, 280);
  }

  // Token Badge
  ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
  ctx.fillRect(160, 515, 280, 42);
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 2;
  ctx.strokeRect(160, 515, 280, 42);

  ctx.fillStyle = '#00f0ff';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(currentModalPassData.token, 300, 543);

  // Box Vermelho de Advertência Anti-Pirataria
  ctx.fillStyle = 'rgba(239, 68, 68, 0.14)';
  ctx.fillRect(40, 575, 520, 120);
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(40, 575, 520, 120);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#f87171';
  ctx.font = 'bold 15px Arial, sans-serif';
  ctx.fillText('⚠️ AVISO DE ATIVAÇÃO PESSOAL NO SMARTPHONE:', 55, 602);

  ctx.fillStyle = '#fca5a5';
  ctx.font = '13.5px Arial, sans-serif';
  ctx.fillText('• Escaneie exclusivamente no celular que você vai usar para jogar.', 55, 628);
  ctx.fillText('• O passe se vincula ao seu aparelho no 1º escaneamento (intransferível).', 55, 650);
  ctx.fillText('• Não ative fora do celular e não compartilhe prints com terceiros.', 55, 672);

  // Box Verde de Benefício Lote Fundador
  ctx.fillStyle = 'rgba(34, 197, 94, 0.14)';
  ctx.fillRect(40, 710, 520, 105);
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(40, 710, 520, 105);

  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 15px Arial, sans-serif';
  ctx.fillText('🎁 BÔNUS DO LOTE FUNDADOR (CRÉDITO GARANTIDO):', 55, 737);

  ctx.fillStyle = '#86efac';
  ctx.font = '13.5px Arial, sans-serif';
  ctx.fillText('• Você garantiu R$ 9,99 de crédito para o Chaveiro Físico NFC.', 55, 763);
  ctx.fillText('• Quando a confecção 3D for liberada, pague apenas a diferença (R$ 15,00)!', 55, 785);

  // Rodapé
  ctx.textAlign = 'center';
  ctx.fillStyle = '#64748b';
  ctx.font = '12px Arial, sans-serif';
  ctx.fillText('RetroNFC.com.br · Validade: 6 meses a partir da 1ª ativação', 300, 850);

  // Download trigger
  const dataUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `RetroPass_${currentModalPassData.token}_${currentModalPassData.gameKey}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  logTerminal(`[RetroPass] Card baixado: ${a.download}`);
}

async function resetPassDevice(token) {
  if (!confirm(`Deseja desvincular o aparelho do passe ${token}?\n\nIsso permitirá que o cliente ative o passe novamente em outro smartphone.`)) {
    return;
  }

  try {
    const resp = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/retronfc_passes?token=eq.${encodeURIComponent(token)}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_CONFIG.key,
        'Authorization': `Bearer ${SUPABASE_CONFIG.key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        device_id: null,
        status: 'disponivel'
      })
    });

    if (resp.ok) {
      logTerminal(`[RetroPass] Vínculo de aparelho removido com sucesso para o passe ${token}.`);
      alert(`O aparelho vinculado ao passe ${token} foi removido com sucesso!`);
      loadSupabasePasses();
    initStoreMode();
    } else {
      alert('Não foi possível desvincular o aparelho no Supabase.');
    }
  } catch (err) {
    console.error('Erro ao resetar aparelho do passe:', err);
    alert('Erro de conexão ao comunicar com Supabase.');
  }
}


// ==========================================================================
// 🧭 CONTROLE DE NAVEGAÇÃO DE VIEWS (SIDEBAR DASHBOARD)
// ==========================================================================
let currentActiveView = 'overview';

function switchAdminView(viewId) {
  currentActiveView = viewId;
  
  // Atualiza itens do menu
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
    item.classList.remove('active');
  });
  const activeNav = document.getElementById(`nav-${viewId}`);
  if (activeNav) activeNav.classList.add('active');

  // Atualiza as seções exibidas
  document.querySelectorAll('.admin-view').forEach(view => {
    view.classList.remove('active');
  });
  const targetView = document.getElementById(`view-${viewId}`);
  if (targetView) {
    targetView.classList.add('active');
  }

  // Fecha o menu no celular se estiver aberto
  const sidebar = document.getElementById('admin-sidebar');
  if (sidebar && sidebar.classList.contains('open')) {
    sidebar.classList.remove('open');
  }

  // Ações contextuais por aba
  if (viewId === 'retropass') {
    loadSupabasePasses();
  } else if (viewId === 'orders') {
    renderOrders();
  } else if (viewId === 'customers') {
    renderCustomers();
  } else if (viewId === 'overview') {
    updateKpiMetrics();
  }
}

function toggleSidebarMobile() {
  const sidebar = document.getElementById('admin-sidebar');
  if (sidebar) sidebar.classList.toggle('open');
}

// ==========================================================================
// 🔍 BUSCA GLOBAL RÁPIDA (PEDIDOS, TOKENS, NOMES, CEPS)
// ==========================================================================
function handleGlobalSearch(query) {
  query = (query || '').trim().toLowerCase();
  if (!query) {
    renderOrders();
    loadSupabasePasses();
    return;
  }

  // Se o termo parecer um token RetroPass, muda para a aba de passes
  if (query.startsWith('pass-') || query.includes('token')) {
    if (currentActiveView !== 'retropass') switchAdminView('retropass');
  }

  // Filtra pedidos
  const filteredOrders = orders.filter(o => 
    String(o.id).includes(query) ||
    (o.customerName && o.customerName.toLowerCase().includes(query)) ||
    (o.phone && o.phone.includes(query)) ||
    (o.gameTitle && o.gameTitle.toLowerCase().includes(query)) ||
    (o.city && o.city.toLowerCase().includes(query)) ||
    (o.zip && o.zip.includes(query))
  );
  renderOrders(filteredOrders);

  // Filtra passes no Supabase
  if (supabasePassesList && supabasePassesList.length > 0) {
    const filteredPasses = supabasePassesList.filter(p =>
      (p.token && p.token.toLowerCase().includes(query)) ||
      (p.game_title && p.game_title.toLowerCase().includes(query)) ||
      (p.game_key && p.game_key.toLowerCase().includes(query)) ||
      (p.device_id && p.device_id.toLowerCase().includes(query))
    );
    renderPassesTable(filteredPasses);
  }
}

function clearGlobalSearch() {
  const input = document.getElementById('global-search-input');
  if (input) input.value = '';
  renderOrders();
  loadSupabasePasses();
}

// ==========================================================================
// 📦 RENDERIZAÇÃO DE PEDIDOS RECENTES (VIEW OVERVIEW)
// ==========================================================================
function renderRecentOrders() {
  const tbody = document.getElementById('recent-orders-table-body');
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #94a3b8; padding: 20px;">Nenhum pedido recente.</td></tr>';
    return;
  }

  const recent = orders.slice(0, 5);
  tbody.innerHTML = recent.map(o => `
    <tr>
      <td><strong>#${o.id}</strong></td>
      <td>
        <span style="font-weight: 700; color: #fff;">${escapePassHtml(o.customerName)}</span><br>
        <small style="color: #64748b;">${escapePassHtml(o.phone)}</small>
      </td>
      <td>${escapePassHtml(o.gameTitle || 'Super Mario')}</td>
      <td><strong style="color: #00f0ff;">R$ ${(o.price || 24.99).toFixed(2).replace('.', ',')}</strong></td>
      <td>
        <span class="${o.status === 'recorded' || o.status === 'shipped' ? 'badge-ready' : 'badge-pending'}">
          ${o.status === 'recorded' ? '✓ Gravado' : (o.status === 'shipped' ? '📦 Enviado' : '⏳ Pendente')}
        </span>
      </td>
    </tr>
  `).join('');
}

// ==========================================================================
// 👥 RENDERIZAÇÃO DO DIRETÓRIO DE CLIENTES (VIEW CUSTOMERS)
// ==========================================================================
function renderCustomers() {
  const tbody = document.getElementById('customers-table-body');
  if (!tbody) return;

  const customerMap = new Map();
  orders.forEach(o => {
    const key = (o.phone || o.customerName || '').trim();
    if (!key) return;
    if (!customerMap.has(key)) {
      customerMap.set(key, {
        name: o.customerName,
        phone: o.phone,
        city: o.city,
        state: o.state,
        zip: o.zip,
        ordersCount: 1,
        totalSpent: o.price || 24.99
      });
    } else {
      const c = customerMap.get(key);
      c.ordersCount += 1;
      c.totalSpent += (o.price || 24.99);
    }
  });

  const list = Array.from(customerMap.values());
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #94a3b8; padding: 20px;">Nenhum cliente cadastrado ainda.</td></tr>';
    return;
  }

  tbody.innerHTML = list.map(c => `
    <tr>
      <td><strong style="color: #fff;">${escapePassHtml(c.name)}</strong></td>
      <td>
        <a href="https://wa.me/55${c.phone.replace(/\D/g, '')}" target="_blank" style="color: #22c55e; text-decoration: none; font-weight: 700;">
          💬 ${escapePassHtml(c.phone)}
        </a>
      </td>
      <td>${escapePassHtml(c.city || 'Brasília')} / ${escapePassHtml(c.state || 'DF')}</td>
      <td><code>${escapePassHtml(c.zip || '---')}</code></td>
      <td><strong style="color: #00f0ff;">R$ ${c.totalSpent.toFixed(2).replace('.', ',')}</strong> (${c.ordersCount}x)</td>
      <td>
        <a href="https://wa.me/55${c.phone.replace(/\D/g, '')}?text=${encodeURIComponent('Olá! Aqui é a equipe da RetroNFC sobre o seu pedido!')}" target="_blank" class="btn-top-action btn-top-dark" style="font-size: 0.72rem; padding: 5px 8px;">
          Falar
        </a>
      </td>
    </tr>
  `).join('');
}

// ==========================================================================
// 📥 EXPORTAR PEDIDOS PARA CORREIOS / CSV
// ==========================================================================
function exportOrdersCsv() {
  if (orders.length === 0) {
    alert('Nenhum pedido para exportar.');
    return;
  }

  let csv = 'ID;Data;Nome;Telefone;CEP;Endereco;Numero_Lote;Complemento;Bairro;Cidade;UF;Jogo;Valor;Status\n';
  orders.forEach(o => {
    csv += `${o.id};"${o.date || ''}";"${o.customerName || ''}";"${o.phone || ''}";"${o.zip || ''}";"${o.address || ''}";"${o.number || ''}";"${o.complement || ''}";"${o.neighborhood || ''}";"${o.city || ''}";"${o.state || ''}";"${o.gameTitle || ''}";"${(o.price || 24.99).toFixed(2)}";"${o.status || ''}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `RetroNFC_Pedidos_Lote_Fundador_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  logTerminal(`[Exportação] Arquivo CSV de entregas baixado com sucesso.`);
}

function copyStationDirectUrl() {
  const select = document.getElementById('station-game-select');
  const gameKey = select ? select.value : 'super_mario';
  const url = `https://retronfc.com.br/play.html?game=${gameKey}`;
  navigator.clipboard.writeText(url);
  alert(`URL copiada para gravação manual no NFC:\n${url}`);
}
