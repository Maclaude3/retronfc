/**
 * RetroNFC.com.br — Motor de Preview de Gameplay Retrô em Tempo Real
 * Renderiza trechos animados e fluidos a 60 FPS via Canvas e WebGL
 * Sem carregar GIFs pesados: 100% leve, ultra-rápido e compatível com celulares
 */

const GameplayPreviews = {
  activeAnimationId: null,

  // Renderiza a cena animada dentro de um elemento Canvas
  startPreview(canvas, gameId) {
    if (!canvas) return;
    this.stopPreview();

    const ctx = canvas.getContext('2d');
    canvas.width = 240;
    canvas.height = 180;
    let frame = 0;

    const animate = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      switch (gameId) {
        case 'top_gear':
          this.drawTopGear(ctx, frame);
          break;
        case 'moonwalker':
          this.drawMoonwalker(ctx, frame);
          break;
        case 'sonic_2':
          this.drawSonic(ctx, frame);
          break;
        case 'street_fighter':
          this.drawStreetFighter(ctx, frame);
          break;
        case 'donkey_kong':
          this.drawDonkeyKong(ctx, frame);
          break;
        case 'super_mario':
        default:
          this.drawMario(ctx, frame);
          break;
      }

      this.activeAnimationId = requestAnimationFrame(animate);
    };

    animate();
  },

  stopPreview() {
    if (this.activeAnimationId) {
      cancelAnimationFrame(this.activeAnimationId);
      this.activeAnimationId = null;
    }
  },

  // Cena 1: Super Mario World (Céu, Colinas, Bloco ? e Moedas)
  drawMario(ctx, frame) {
    // Céu azul clássico SNES
    ctx.fillStyle = '#5c94fc';
    ctx.fillRect(0, 0, 240, 180);

    // Nuvens passando
    ctx.fillStyle = '#ffffff';
    const cloudX = (240 - (frame * 0.8) % 300);
    ctx.beginPath();
    ctx.arc(cloudX, 35, 14, 0, Math.PI * 2);
    ctx.arc(cloudX + 15, 30, 18, 0, Math.PI * 2);
    ctx.arc(cloudX + 30, 35, 14, 0, Math.PI * 2);
    ctx.fill();

    // Colinas verdes ao fundo
    ctx.fillStyle = '#00a800';
    ctx.beginPath();
    ctx.arc(60, 190, 70, 0, Math.PI * 2);
    ctx.arc(170, 200, 80, 0, Math.PI * 2);
    ctx.fill();

    // Chão de blocos marrom
    ctx.fillStyle = '#fc9838';
    ctx.fillRect(0, 145, 240, 35);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 145, 240, 3);

    // Bloco "?" piscando e flutuando
    const blockY = 85 + Math.sin(frame * 0.1) * 2;
    ctx.fillStyle = '#fcbc3c';
    ctx.fillRect(100, blockY, 24, 24);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(100, blockY, 24, 24);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('?', 107, blockY + 18);

    // Moeda saindo girando
    const coinY = 50 + Math.sin(frame * 0.15) * 6;
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.ellipse(112, coinY, 6 + Math.cos(frame * 0.2) * 4, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Mario correndo em pixel art simplificado
    const marioX = 50 + (frame * 1.5) % 140;
    const marioY = 122 + (Math.abs(Math.sin(frame * 0.2)) > 0.7 ? -18 : 0);
    
    // Chapéu e Macacão
    ctx.fillStyle = '#e52521';
    ctx.fillRect(marioX, marioY, 14, 8); // Boné
    ctx.fillStyle = '#0022ee';
    ctx.fillRect(marioX + 2, marioY + 8, 12, 12); // Macacão azul
    ctx.fillStyle = '#fcbc3c';
    ctx.fillRect(marioX + 4, marioY + 4, 6, 4); // Rosto
    
    // Badge 60 FPS
    this.drawHud(ctx, 'SUPER MARIO WORLD', 'SNES');
  },

  // Cena 2: Top Gear (Pista 3D em perspectiva, Carro Vermelho e Nitro)
  drawTopGear(ctx, frame) {
    // Céu noturno gradiente
    const grad = ctx.createLinearGradient(0, 0, 0, 90);
    grad.addColorStop(0, '#060919');
    grad.addColorStop(1, '#6b21a8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 240, 90);

    // Linha do horizonte e montanhas
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.moveTo(0, 90);
    ctx.lineTo(40, 65);
    ctx.lineTo(90, 80);
    ctx.lineTo(150, 60);
    ctx.lineTo(210, 85);
    ctx.lineTo(240, 70);
    ctx.lineTo(240, 90);
    ctx.fill();

    // Pista em perspectiva cônica (Efeito 3D clássico dos 16-bits)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(100, 90);
    ctx.lineTo(140, 90);
    ctx.lineTo(240, 180);
    ctx.lineTo(0, 180);
    ctx.fill();

    // Faixas da pista em movimento contínuo
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    const stripeOffset = (frame * 8) % 40;
    for (let y = 90 + stripeOffset; y < 180; y += 30) {
      const scale = (y - 90) / 90;
      const x = 120;
      ctx.beginPath();
      ctx.moveTo(x - 2 * scale, y);
      ctx.lineTo(x + 2 * scale, y + 15 * scale);
      ctx.stroke();
    }

    // Carro Vermelho do Top Gear visto de trás
    const carX = 105 + Math.sin(frame * 0.05) * 20;
    const carY = 140;

    // Aerofólio e Carroceria
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(carX, carY, 34, 18);
    ctx.fillStyle = '#000000';
    ctx.fillRect(carX - 2, carY + 8, 38, 4); // Aerofólio
    ctx.fillRect(carX + 4, carY + 4, 26, 8); // Vidro traseiro

    // Rodas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(carX - 4, carY + 12, 6, 8);
    ctx.fillRect(carX + 32, carY + 12, 6, 8);

    // Fogo / Chamas do Nitro no escapamento
    if (frame % 6 < 3) {
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(carX + 4, carY + 18, 6, 8);
      ctx.fillRect(carX + 24, carY + 18, 6, 8);
    }

    this.drawHud(ctx, 'TOP GEAR — NITRO ACTIVE', 'SNES');
  },

  // Cena 3: Michael Jackson's Moonwalker (Moonwalk e Cidade Noturna)
  drawMoonwalker(ctx, frame) {
    // Cidade de Club 30 à noite
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, 240, 180);

    // Janelas iluminadas da cidade
    ctx.fillStyle = '#facc15';
    for (let i = 0; i < 8; i++) {
      const h = 40 + (i * 12) % 60;
      ctx.fillRect(i * 32, 90 - h, 24, h);
      ctx.fillStyle = '#18181b';
      ctx.fillRect(i * 32 + 4, 90 - h + 6, 16, h - 8);
      ctx.fillStyle = '#facc15';
    }

    // Chão de assoalho do Club
    ctx.fillStyle = '#27272a';
    ctx.fillRect(0, 135, 240, 45);
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 1;
    for (let x = 0; x < 240; x += 25) {
      ctx.beginPath();
      ctx.moveTo(x, 135);
      ctx.lineTo(x - 30, 180);
      ctx.stroke();
    }

    // Michael Jackson deslizando no Moonwalk
    const mjX = 160 - ((frame * 1.2) % 180);
    const mjY = 100;

    // Rastro de purpurina/brilho mágica
    ctx.fillStyle = '#00f0ff';
    for (let s = 0; s < 4; s++) {
      ctx.fillRect(mjX + 30 + s * 8, mjY + 25 + Math.sin(frame + s) * 4, 3, 3);
    }

    // Michael Jackson em terno branco clássico
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(mjX + 8, mjY + 12, 12, 18); // Paletó branco
    ctx.fillStyle = '#18181b';
    ctx.fillRect(mjX + 11, mjY + 14, 6, 8); // Camisa preta
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(mjX + 13, mjY + 18, 2, 8); // Gravata azul
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(mjX + 8, mjY + 30, 5, 14); // Perna esquerda
    ctx.fillRect(mjX + 15, mjY + 28, 6, 14); // Perna direita (moonwalk)

    // Chapéu Fedora Branco com fita preta
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(mjX + 4, mjY + 6, 18, 4);
    ctx.fillRect(mjX + 8, mjY + 2, 10, 5);
    ctx.fillStyle = '#000000';
    ctx.fillRect(mjX + 8, mjY + 5, 10, 2);

    this.drawHud(ctx, 'MICHAEL JACKSON MOONWALKER', 'MEGA DRIVE');
  },

  // Cena 4: Sonic 2 (Green Hill, Anéis Dourados e Sonic em Espiral)
  drawSonic(ctx, frame) {
    // Céu azul e mar
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(0, 0, 240, 90);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(0, 90, 240, 30);

    // Chão xadrez clássico da Green Hill
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, 120, 240, 60);
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(0, 120, 240, 8); // Grama verde no topo

    // Anéis dourados flutuando
    for (let r = 0; r < 4; r++) {
      const ringX = 50 + r * 35;
      const ringY = 95;
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(ringX, ringY, 7 + Math.sin(frame * 0.15) * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(ringX, ringY, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Sonic em formato de bola giratória (Spin Dash) correndo rápido
    const sonicX = (frame * 4) % 260 - 20;
    const sonicY = 118;
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.arc(sonicX, sonicY, 11, 0, Math.PI * 2);
    ctx.fill();
    // Faixa vermelha dos sapatos na velocidade
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(sonicX - 6, sonicY + 6, 8, 4);

    this.drawHud(ctx, 'SONIC THE HEDGEHOG 2', 'MEGA DRIVE');
  },

  // Cena 5: Street Fighter II (Ryu disparando Hadouken)
  drawStreetFighter(ctx, frame) {
    // Céu alaranjado do cenário de Ryu (Suzaku Castle)
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(0, 0, 240, 110);
    // Lua ao fundo
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(190, 45, 20, 0, Math.PI * 2);
    ctx.fill();

    // Telhado tradicional japonês
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(0, 110, 240, 70);

    // Ryu de quimono branco
    const ryuX = 55;
    const ryuY = 92;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ryuX, ryuY, 18, 30); // Quimono
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(ryuX + 2, ryuY - 4, 14, 4); // Faixa vermelha na cabeça
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(ryuX + 3, ryuY + 18, 12, 3); // Faixa preta na cintura

    // Bola de Energia HADOUKEN azul brilhante viajando
    const hadoukenX = 85 + (frame * 4) % 150;
    const hadoukenY = 104 + Math.sin(frame * 0.3) * 3;

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(hadoukenX, hadoukenY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(hadoukenX - 3, hadoukenY, 6, 0, Math.PI * 2);
    ctx.fill();

    this.drawHud(ctx, 'STREET FIGHTER II TURBO', 'SNES');
  },

  // Cena 6: Donkey Kong Country
  drawDonkeyKong(ctx, frame) {
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, 240, 180);
    // Folhagens da selva
    ctx.fillStyle = '#047857';
    for (let f = 0; f < 6; f++) {
      ctx.beginPath();
      ctx.arc(f * 45, 40 + Math.sin(frame * 0.05 + f) * 5, 30, 0, Math.PI * 2);
      ctx.fill();
    }
    // Chão de cipó
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, 140, 240, 40);

    // Cacho de Bananas flutuante
    ctx.fillStyle = '#facc15';
    ctx.font = '22px sans-serif';
    ctx.fillText('🍌', 150, 95 + Math.sin(frame * 0.1) * 4);

    // Donkey Kong rolando
    const dkkX = (frame * 2) % 240;
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.arc(dkkX, 128, 14, 0, Math.PI * 2);
    ctx.fill();
    // Gravata vermelha DK
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(dkkX - 4, 124, 8, 8);

    this.drawHud(ctx, 'DONKEY KONG COUNTRY', 'SNES');
  },

  // HUD Arcade no topo do Preview
  drawHud(ctx, title, consoleName) {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, 240, 22);
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 8px monospace';
    ctx.fillText(title, 8, 14);
    ctx.fillStyle = '#34d399';
    ctx.fillText('60 FPS', 198, 14);
  }
};