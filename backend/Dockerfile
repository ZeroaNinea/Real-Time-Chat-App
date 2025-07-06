# Stage 1: Compile TypeScript
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Run compiled backend
FROM node:22-alpine
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/keys ./dist/keys
RUN npm ci --omit=dev

EXPOSE 5000
CMD ["node", "dist/src/server.js"]
