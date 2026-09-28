# Ultra-lightweight Dockerfile for RetroNFC Netplay Server (Node.js)
FROM node:20-alpine

WORKDIR /app

# Instala dependências primeiro para cache otimizado
COPY package*.json ./
RUN npm install --omit=dev

# Copia o código da aplicação
COPY . .

ENV PORT=3000
EXPOSE 3000

CMD ["node", "index.js"]
