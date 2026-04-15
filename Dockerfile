 FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY config.js deepl.js clash.js server.js index.js ./

EXPOSE 1234

CMD ["node", "server.js"]
