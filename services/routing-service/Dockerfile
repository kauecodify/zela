# Dockerfile for Routing Service
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate
RUN pnpm install --frozen-lockfile

# Copy source files
COPY . .

# Build application
RUN pnpm build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate
RUN pnpm install --frozen-lockfile --prod

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3002/api/health || exit 1

# Start application
CMD ["node", "dist/main"]
