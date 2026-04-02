# ─── Stage 1: Build ─────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production=false

# Copy source and build
COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

# ─── Stage 2: Production ────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodeuser

# Copy only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built output
COPY --from=builder /app/dist ./dist

# Create directories for uploads and logs
RUN mkdir -p uploads logs && chown -R nodeuser:nodejs uploads logs

# Switch to non-root user
USER nodeuser

EXPOSE 4000

ENV NODE_ENV=production

CMD ["node", "dist/server.js"]
