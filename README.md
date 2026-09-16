# 🕹️ RetroNFC.com.br — Colecionáveis Retrô com Tecnologia NFC

Plataforma web completa e de alto padrão estético para comercialização de mini cartuchos e chaveiros gamers colecionáveis com chips NFC integrados, aliada a um emulador online em **WebAssembly / JavaScript (EmulatorJS)** de carregamento instantâneo.

---

## 📁 Estrutura do Projeto

```text
RetroNFC/
├── CNAME                         # Configuração do domínio personalizado RetroNFC.com.br
├── index.html                    # Vitrine comercial, Simulador NFC, Atacado e FAQ
├── play.html                     # Player de emulação direto acionado pela Tag NFC (?game=...)
├── nfc-tool.html                 # Ferramenta para gravar tags direto pelo navegador (Web NFC)
├── assets/
│   ├── css/
│   │   ├── style.css             # Design system completo, tema dark, neon e glassmorphism
│   │   └── player.css            # Layout arcade, CRT scanlines e controles touch virtuais
│   └── js/
│       ├── main.js               # Lógica da vitrine, simulador de celular e checkout WhatsApp
│       ├── player.js             # Roteador de parâmetros, catálogo de ROMs e EmulatorJS
│       └── nfc.js                # Driver da API Web NFC para leitura e gravação
├── .gitignore                    # Regras de exclusão do Git
└── README.md                     # Este manual de publicação e configuração
```

---

## 🚀 Passo 1: Como Publicar Gratuitamente no GitHub Pages

Como este projeto é 100% estático (HTML5, CSS3 moderno e JavaScript puro), ele pode ser hospedado com **custo zero**, altíssima velocidade e certificado SSL (HTTPS) gratuito no **GitHub Pages**.

### 1. Criar o Repositório no seu GitHub
1. Acesse o seu [GitHub](https://github.com) e crie um novo repositório (ex: `retronfc` ou `retronfc-site`).
2. Marque como **Público** (Public).

### 2. Enviar os Arquivos pelo Terminal
No seu terminal (Linux, Mac ou PowerShell no Windows), execute dentro da pasta do projeto:

```bash
# Entrar na pasta do projeto
cd C:\Users\imobe\Desktop\RetroNFC

# Adicionar todos os arquivos
git add .

# Criar o commit inicial
git commit -m "feat: lancamento oficial da plataforma RetroNFC.com.br"

# Vincular ao seu repositorio remoto (substitua SEU_USUARIO pelo seu username do GitHub)
git remote add origin https://github.com/SEU_USUARIO/retronfc.git

# Enviar para a branch principal
git branch -M main
git push -u origin main
```

### 3. Ativar o GitHub Pages
1. No seu repositório no GitHub, clique na aba **Settings** (Configurações).
2. No menu lateral esquerdo, clique em **Pages**.
3. Em **Build and deployment** > **Branch**, selecione:
   - Branch: `main`
   - Pasta: `/ (root)`
4. Clique em **Save**.
5. Em cerca de 1 a 2 minutos, o seu site estará no ar no endereço:  
   `https://SEU_USUARIO.github.io/retronfc/`

---

## 🌐 Passo 2: Configurando o Domínio `RetroNFC.com.br` no Registro.br

O arquivo `CNAME` já está configurado na raiz com o domínio `retronfc.com.br`. Para ativá-lo:

1. **No GitHub Pages:**
   - Na mesma tela de configurações de **Pages**, role até **Custom domain**.
   - Digite `retronfc.com.br` e clique em **Save**.
   - Marque a opção **Enforce HTTPS** (para garantir o cadeado de segurança verde/grátis).

2. **No painel do Registro.br:**
   - Acesse o painel de gerenciamento do domínio `retronfc.com.br`.
   - Na seção de **DNS**, adicione as 4 entradas do tipo **A** apontando para os servidores do GitHub:
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`
   - Adicione uma entrada do tipo **CNAME** para o subdomínio `www`:
     - Nome: `www`
     - Destino: `SEU_USUARIO.github.io.` (com ponto no final)

Após a propagação do DNS (geralmente entre 30 minutos e 2 horas), o seu domínio `https://retronfc.com.br` estará ativo mundialmente!

---

## 🏷️ Passo 3: Como Gravar as Tags NFC para os Mini Cartuchos

Cada chaveiro que você produzir ou vender deve ter gravada a URL exata do jogo desejado.

### Método A: Pelo Próprio Navegador (Web NFC)
1. No seu celular Android com NFC, abra o endereço do seu site:  
   `https://retronfc.com.br/nfc-tool.html`
2. Selecione o jogo na lista suspensa.
3. Clique em **"Gravar Tag NFC Agora"**.
4. Encoste a tag virgem (NTAG213 ou NTAG215) na traseira do aparelho. Pronto!

### Método B: Pelo Aplicativo NFC Tools (Android e iPhone)
1. Instale o aplicativo gratuito **NFC Tools** da Google Play Store ou App Store.
2. Abra o app e vá na aba **Escrever** (Write) > **Adicionar um registro** (Add a record).
3. Escolha **URL / URI**.
4. Digite a URL correspondente ao jogo (exemplos abaixo).
5. Clique em **OK**, depois em **Escrever** e encoste a tag.

### URLs dos Jogos Padrão:
* **Super Mario World (SNES):** `https://retronfc.com.br/play.html?game=super_mario`
* **Top Gear (SNES):** `https://retronfc.com.br/play.html?game=top_gear`
* **Donkey Kong Country (SNES):** `https://retronfc.com.br/play.html?game=donkey_kong`
* **The Legend of Zelda (SNES):** `https://retronfc.com.br/play.html?game=zelda_alttp`
* **Sonic the Hedgehog 2 (Mega Drive):** `https://retronfc.com.br/play.html?game=sonic_2`
* **Street Fighter II Turbo (SNES):** `https://retronfc.com.br/play.html?game=street_fighter`
* **Pokémon Yellow (Game Boy Color):** `https://retronfc.com.br/play.html?game=pokemon_yellow`
* **Mega Man X (SNES):** `https://retronfc.com.br/play.html?game=mega_man_x`

---

## ⚙️ Personalização dos Dados de Contato

Para alterar o número do WhatsApp que recebe os pedidos dos clientes:
1. Abra o arquivo `assets/js/main.js`.
2. Altere a linha inicial `whatsappNumber: '5511999999999'` para o seu número com DDD (exemplo: `5521988887777`).

---

## 📄 Licença e Direitos
Desenvolvido para empreendedores do mercado retrô gamer e tecnologia de identificação por aproximação (NFC).