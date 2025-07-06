# Stage 1: Build Angular SSR app
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build:ssr

# Stage 2: Run SSR app
FROM node:22-alpine
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev

EXPOSE 4200
CMD ["node", "dist/frontend/server/server.mjs"]
