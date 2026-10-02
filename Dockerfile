# Build Stage for Client and Server
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

# Build production assets
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

# Copy compiled output from builder
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/dist ./server/dist

EXPOSE 5000

CMD ["npm", "start"]
