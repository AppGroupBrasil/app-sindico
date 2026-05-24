FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/db/migrations ./dist/db/migrations

# Criar diretórios de upload
RUN mkdir -p uploads/avatars uploads/documentos uploads/fotos uploads/qrcodes \
    && chown -R node:node /app

ENV NODE_ENV=production

USER node

EXPOSE 3001

CMD ["sh", "-c", "node dist/db/migrate.js && node dist/index.js"]
