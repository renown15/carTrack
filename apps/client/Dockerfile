FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/client/package.json ./apps/client/

RUN npm ci --workspace=packages/shared --workspace=apps/client --ignore-scripts

COPY packages/shared ./packages/shared
COPY apps/client ./apps/client
COPY tsconfig.base.json ./

RUN npm run build -w packages/shared && npm run build -w apps/client

# ── Runtime image ─────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

COPY --from=builder /app/apps/client/dist /usr/share/nginx/html
COPY apps/client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
