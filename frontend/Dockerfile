# frontend/Dockerfile

FROM node:22-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build:ssr  # or whatever command you use to build the SSR app

# Serve with Node.js (SSR)
FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev
EXPOSE 4200
CMD ["node", "dist/frontend/server/server.mjs"]
