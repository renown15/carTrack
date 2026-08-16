FROM node:22-alpine AS builder

WORKDIR /app

# Copy manifests first for layer caching
COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/server/package.json ./apps/server/

RUN npm ci --workspace=packages/shared --workspace=apps/server --ignore-scripts

COPY packages/shared ./packages/shared
COPY apps/server ./apps/server
COPY tsconfig.base.json ./

RUN npm run build -w packages/shared && npm run build -w apps/server

# ── Runtime image ─────────────────────────────────────────────────────────────
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/server/package.json ./apps/server/

RUN npm ci --workspace=packages/shared --workspace=apps/server \
      --omit=dev --ignore-scripts

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/server/dist ./apps/server/dist

WORKDIR /app/apps/server

EXPOSE 3001

CMD ["node", "dist/index.js"]
