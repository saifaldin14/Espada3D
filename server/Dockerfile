FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps --omit=dev
COPY server/ ./server/
EXPOSE 1234
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:1234/health || exit 1
CMD ["node", "server/collab-server.js"]
