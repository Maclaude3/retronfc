# ⚡ RetroNFC — Colecionáveis Retrô & Tecnologia NFC

Plataforma web oficial para apresentação, demonstração interativa e comercialização de **chaveiros gamers colecionáveis em impressão 3D** com chips de aproximação **NFC integrados**, conectando o produto físico diretamente à experiência nostálgica no smartphone do cliente.

---

## 📁 Estrutura do Projeto

```text
RetroNFC/
├── CNAME                         # Apontamento do domínio personalizado (ex: seusite.com.br)
├── index.html                    # Vitrine comercial, Simulador NFC, Calculadora B2B e FAQ
├── play.html                     # Interface gamer mobile acionada pela aproximação da Tag NFC
├── assets/
│   ├── css/
│   │   ├── style.css             # Design system completo, dark mode, neon e glassmorphism
│   │   └── player.css            # Layout arcade retrô, scanlines CRT e controles virtuais
│   └── js/
│       ├── main.js               # Catálogo dinâmico, simulador de aproximação e checkout WhatsApp
│       └── player.js             # Roteador de parâmetros e engine retrô integrada
├── .gitignore                    # Regras de proteção e exclusão do Git
└── README.md                     # Guia completo de publicação e configuração
```

---

## 🎮 Principais Recursos

- **Vitrine E-Commerce Completa:** Catálogo dinâmico com mais de 50 clássicos retrô divididos por consoles e gêneros.
- **Simulador Interativo de Aproximação:** Demonstração visual realista de como a tag NFC aciona o sistema no celular.
- **Checkout Inteligente via WhatsApp:** Geração automática do pedido com escolha de console, cor de carcaça e formato.
- **Calculadora B2B para Lojistas:** Simulação de margens de lucro para revenda no atacado com expositor de brinde.
- **Visual Cyber-Retro Premium:** Interface com dark mode, efeitos de glassmorphism, animações a 60 FPS e scanlines de TV CRT.
- **Foco Mobile First:** Tela de proteção inteligente para direcionar o acesso exclusivo via aproximação no smartphone.

---

## 🚀 Passo 1: Como Publicar no GitHub Pages

Como a plataforma é baseada em tecnologias web nativas (HTML5, CSS3 moderno e JavaScript puro), ela pode ser hospedada com alta disponibilidade, carregamento ultrarrápido e certificado de segurança SSL (HTTPS) gratuito.

### 1. Criar o Repositório no GitHub
1. Acesse o [GitHub](https://github.com) e crie um novo repositório (ex: `retronfc-site`).
2. Defina o repositório como público para utilizar o GitHub Pages gratuito.

### 2. Sincronizar os Arquivos pelo Terminal
No terminal (PowerShell, Command Prompt, Linux ou macOS), execute os comandos dentro da pasta do projeto:

```bash
# Entrar na pasta do projeto (exemplo fictício)
cd C:\Projetos\RetroNFC

# Inicializar e adicionar os arquivos
git init
git add .

# Criar o commit de lançamento
git commit -m "feat: publicacao da plataforma RetroNFC"

# Vincular ao seu repositorio remoto (substitua pelo seu usuario de exemplo)
git remote add origin https://github.com/usuario-exemplo/retronfc-site.git

# Enviar para a branch principal
git branch -M main
git push -u origin main
```

### 3. Ativar o GitHub Pages
1. No seu repositório no GitHub, clique na aba **Settings** (Configurações).
2. No menu lateral esquerdo, selecione a seção **Pages**.
3. Na opção **Build and deployment** > **Branch**, selecione:
   - Branch: `main`
   - Pasta: `/ (root)`
4. Clique em **Save**.
5. O site estará disponível em instantes no endereço:
   `https://usuario-exemplo.github.io/retronfc-site/`

---

## 🌐 Passo 2: Configurando o Domínio Próprio no Provedor de DNS

Para usar seu domínio personalizado (exemplo: `seusite.com.br`):

### 1. No GitHub Pages:
- Na mesma tela de configurações de **Pages**, role até **Custom domain**.
- Digite seu domínio (ex: `seusite.com.br`) e clique em **Save**.
- Ative a opção **Enforce HTTPS** para garantir a criptografia e o cadeado de segurança.

### 2. No Painel de DNS do seu Provedor (ex: Registro.br, Cloudflare, Hostgator):
Adicione as entradas padrão de apontamento:

| Tipo | Nome / Entrada | Destino / Valor |
| :--- | :--- | :--- |
| **A** | `@` (ou em branco) | `185.199.108.153` |
| **A** | `@` (ou em branco) | `185.199.109.153` |
| **A** | `@` (ou em branco) | `185.199.110.153` |
| **A** | `@` (ou em branco) | `185.199.111.153` |
| **CNAME** | `www` | `usuario-exemplo.github.io.` |

*Após o período de propagação de DNS, o endereço `https://seusite.com.br` responderá automaticamente.*

---

## 🏷️ Passo 3: Como Gravar as Tags NFC para os Colecionáveis

Cada chaveiro produzido recebe a URL correspondente ao título desejado para que o smartphone do cliente abra a experiência ao aproximar.

### Método via Aplicativo Gratuito (NFC Tools para Android e iOS)
1. Instale o aplicativo gratuito **NFC Tools** na Google Play Store ou Apple App Store.
2. Abra o aplicativo e acesse a aba **Escrever** (Write) > **Adicionar um registro** (Add a record).
3. Selecione a opção **URL / URI**.
4. Insira a URL do produto (exemplos abaixo com domínio genérico).
5. Toque em **OK**, selecione **Escrever** (Write) e aproxime a tag virgem da traseira do aparelho.

### Exemplos de URLs de Gravação (Substitua por seu domínio):
- **Super Mario World:** `https://seusite.com.br/play.html?game=super_mario`
- **Top Gear:** `https://seusite.com.br/play.html?game=top_gear`
- **Donkey Kong Country:** `https://seusite.com.br/play.html?game=donkey_kong`
- **The Legend of Zelda:** `https://seusite.com.br/play.html?game=zelda_alttp`
- **Sonic the Hedgehog 2:** `https://seusite.com.br/play.html?game=sonic_2`
- **Street Fighter II:** `https://seusite.com.br/play.html?game=street_fighter`
- **Mega Man X:** `https://seusite.com.br/play.html?game=mega_man_x`

---

## ⚙️ Personalização do Atendimento via WhatsApp

Para alterar o número que recebe os pedidos gerados na vitrine:
1. Abra o arquivo `assets/js/main.js`.
2. Localize a configuração de atendimento e defina o seu número no padrão internacional com DDD:
   ```javascript
   // Exemplo: 55 + DDD + Numero
   whatsappNumber: '5511999999999'
   ```

---

## 📄 Licença e Direitos

Projeto desenvolvido e mantido para comercialização de colecionáveis retrô gamers e tecnologia de identificação por aproximação (NFC). Todos os direitos reservados.
