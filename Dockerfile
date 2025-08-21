# PowerTrader Multi-stage Dockerfile
# Supports both development and production builds

# Base stage with Node.js and pnpm
FROM node:20-alpine AS base
WORKDIR /app

# Install pnpm globally with version pinning for consistency
RUN npm install -g pnpm@8.15.6

# Configure pnpm for container optimization
ENV PNPM_HOME="/app/.pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Create .pnpm directory and set permissions
RUN mkdir -p /app/.pnpm && \
    chmod 755 /app/.pnpm

# Configure pnpm store location for better caching
RUN pnpm config set store-dir /app/.pnpm/store

# Copy package files for better layer caching
COPY package.json ./

# Dependencies stage
FROM base AS deps
# Install dependencies with better caching and container optimization
RUN if [ -f pnpm-lock.yaml ]; then \
        pnpm install --frozen-lockfile --no-optional; \
    else \
        pnpm install --no-optional; \
    fi && \
    # Clean up cache to reduce layer size
    pnpm store prune

# Development stage
FROM base AS development

# Create non-root user for security (identical to production)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/.pnpm ./.pnpm

# Copy only necessary files for development (source code mounted via volumes)
COPY package.json ./
COPY next.config.js ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY tsconfig.json ./
COPY components.json ./

# Create necessary directories that might be mounted
RUN mkdir -p src public

# Create .next directory with proper permissions for nextjs user
RUN mkdir -p .next && chown -R nextjs:nodejs .next

# Ensure nextjs user has ownership of /app for development runtime operations
RUN chown -R nextjs:nodejs /app

# Switch to non-root user for development
USER nextjs

# Expose port 3040
EXPOSE 3040

# Development command with hot reload and optimized settings
CMD ["sh", "-c", "pnpm dev"]

# Build stage for production
FROM base AS builder
# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
# Copy source code
COPY . .

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN pnpm build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Install pnpm with same version as build
RUN npm install -g pnpm@8.15.6

# Configure pnpm for production
ENV PNPM_HOME="/app/.pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN mkdir -p /app/.pnpm && \
    pnpm config set store-dir /app/.pnpm/store

# Copy package files and install production dependencies only
COPY package.json ./
RUN if [ -f pnpm-lock.yaml ]; then \
        pnpm install --prod --frozen-lockfile --no-optional; \
    else \
        pnpm install --prod --no-optional; \
    fi && \
    pnpm store prune

# Copy built application from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Ensure nextjs user has ownership of /app for runtime operations
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port 3040
EXPOSE 3040

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3040
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start production server
CMD ["node", "server.js"]
