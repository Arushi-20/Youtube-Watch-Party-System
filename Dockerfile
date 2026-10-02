# Build Stage for Client
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and package manifests
COPY package.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN npm run install:all

# Copy source files
COPY client ./client
COPY server ./server

# Build production client assets
RUN npm run build

# Production Runtime Stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy root package.json
COPY package.json ./
COPY server/package*.json ./server/

# Install only production dependencies in server
RUN npm --prefix server install --omit=dev

# Copy client dist and server source
COPY --from=builder /app/client/dist ./client/dist
COPY server/src ./server/src

EXPOSE 5000

CMD ["npm", "start"]
