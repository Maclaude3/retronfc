# ⚔️ Servidor Netplay Dedicado — RetroNFC (Multiplayer Online)

Este é o servidor de sinalização WebRTC oficial do **EmulatorJS Netplay** para a plataforma **RetroNFC**, permitindo que dois jogadores disputem partidas online (*The King of Fighters 2002*, *Street Fighter II*) ou joguem cooperativo (*Metal Slug*) em tempo real através do smartphone via 4G/5G/Wi-Fi.

---

## 🚀 Como subir no Render.com (100% Gratuito em 3 minutos)

1. Acesse **[dashboard.render.com](https://dashboard.render.com/)** e faça login com seu GitHub.
2. Clique no botão azul **"New +"** no topo e selecione **"Web Service"**.
3. Selecione o repositório **`retronfc`** da sua lista.
4. Preencha os campos básicos:
   * **Name:** `retronfc-netplay`
   * **Root Directory:** `netplay-server`
   * **Environment / Runtime:** `Rust` (ou `Docker`)
   * **Build Command:** `cargo build --release`
   * **Start Command:** `./target/release/rust-socket-server`
   * **Instance Type:** `Free` ($0/mês)
5. Clique em **"Deploy Web Service"**.
6. Em cerca de 2 a 3 minutos, o Render vai gerar a sua URL segura (ex: `https://retronfc-netplay.onrender.com`).
7. Copie essa URL gerada para usarmos no `player.js` da plataforma!

---

## ⚙️ Variáveis de Ambiente
* `PORT`: Porta HTTP/WebSocket interna (o Render define automaticamente, padrão 3000).
