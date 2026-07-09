# ── Stage 1: Builder ──────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
# Copy dependency manifests first (layer caching — only re-runs npm ci if
# package-lock.json changes, not on every source file change)
COPY package.json package-lock.json ./
RUN npm ci --include=dev
# Copy source and compile TypeScript
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build
# Prune dev dependencies — production deps only for the final stage
RUN npm ci --omit=dev
# ── Stage 2: Runtime ──────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
# Create non-root user for security (never run as root inside container)
RUN addgroup -S vegelink && adduser -S vegelink -G vegelink
WORKDIR /app
# Copy only compiled output and production node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
# Set ownership to non-root user
RUN chown -R vegelink:vegelink /app
USER vegelink
# Expose port (actual binding done by Render via PORT env var)
EXPOSE 3000
# Health check used by Docker and Render to confirm the app is alive
# HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
#  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health ||
# exit 1
CMD ["node", "dist/server.js"]
