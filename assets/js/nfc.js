/**
 * RetroNFC.com.br — Web NFC Tool (nfc-tool.html)
 * Permite ler e gravar tags NFC NTAG213/215 diretamente pelo Google Chrome no Android
 */

const NfcApp = {
  isSupported: 'NDEFReader' in window,

  init() {
    const statusBox = document.getElementById('nfc-support-status');
    if (!this.isSupported) {
      if (statusBox) {
        statusBox.innerHTML = `
          <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; border-radius: 8px; padding: 14px; margin-bottom: 20px; color: #fca5a5;">
            ⚠️ <strong>Web NFC não detectado:</strong> Este recurso requer o Google Chrome em um celular Android com NFC ativado. Se você estiver no PC ou iPhone, use o aplicativo gratuito <strong>NFC Tools</strong>.
          </div>
        `;
      }
    }
  },

  async writeTag(gameParam) {
    const logBox = document.getElementById('nfc-log');
    if (!this.isSupported) {
      alert('Seu navegador não suporta Web NFC. Use o app NFC Tools no celular.');
      return;
    }

    try {
      const ndef = new NDEFReader();
      const domain = window.location.origin.includes('http') ? window.location.origin : 'https://retronfc.com.br';
      const targetUrl = `${domain}/play.html?game=${gameParam}`;

      this.log(`📡 Aproxime a tag NFC da traseira do aparelho...`);

      await ndef.write({
        records: [
          {
            recordType: "url",
            data: targetUrl
          }
        ]
      });

      this.log(`✅ SUCESSO! Tag gravada com a URL:\n${targetUrl}`);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    } catch (error) {
      this.log(`❌ Erro ao gravar: ${error.message}`);
    }
  },

  async readTag() {
    if (!this.isSupported) {
      alert('Seu navegador não suporta Web NFC. Use o app NFC Tools no celular.');
      return;
    }

    try {
      const ndef = new NDEFReader();
      await ndef.scan();
      this.log(`📡 Escaneando... Aproxime uma tag NFC.`);

      ndef.onreading = event => {
        this.log(`🏷️ Tag Detectada! Número de série: ${event.serialNumber}`);
        for (const record of event.message.records) {
          if (record.recordType === "url") {
            const decoder = new TextDecoder();
            this.log(`🔗 URL Encontrada: ${decoder.decode(record.data)}`);
          } else {
            this.log(`📄 Tipo de Registro: ${record.recordType}`);
          }
        }
      };
    } catch (error) {
      this.log(`❌ Erro na leitura: ${error.message}`);
    }
  },

  log(msg) {
    const logBox = document.getElementById('nfc-log');
    if (logBox) {
      const time = new Date().toLocaleTimeString();
      logBox.innerHTML = `<div>[${time}] ${msg}</div>` + logBox.innerHTML;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  NfcApp.init();
});