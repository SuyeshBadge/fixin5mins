# Multi-stage Dockerfile for FixIn5Mins Instagram Content Generator
# Production-optimized build with Alpine Linux

# Build stage
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji

WORKDIR /app

# Copy package files for dependency caching
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev dependencies for building)
# Skip the prepare script to avoid build failing before source is copied
RUN npm ci --ignore-scripts && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Verify source files exist
RUN if [ ! -d "./src" ] || [ -z "$(ls -A ./src)" ]; then echo "ERROR: Source directory is empty or missing!" && exit 1; fi

# Set Puppeteer environment for build
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Build the TypeScript application
RUN npm run build

# Verify build output exists
RUN if [ ! -d "./dist" ] || [ -z "$(ls -A ./dist)" ]; then echo "ERROR: Build failed - dist directory is empty!" && exit 1; fi

# Production stage
FROM node:18-alpine AS production

# Install runtime dependencies for Puppeteer and fonts
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji \
    fontconfig \
    && fc-cache -f \
    && rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S fixin5mins -u 1001 -G nodejs

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=fixin5mins:nodejs /app/dist ./dist

# Copy necessary runtime assets from builder stage
COPY --from=builder --chown=fixin5mins:nodejs /app/src/templates ./src/templates
COPY --from=builder --chown=fixin5mins:nodejs /app/src/config ./src/config

# Create directories for generated content and logs with proper permissions
RUN mkdir -p /app/generated /app/logs && \
    chown -R fixin5mins:nodejs /app/generated /app/logs && \
    chmod 755 /app/generated /app/logs

# Copy and set up entrypoint script
COPY --chown=fixin5mins:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Copy health check script
COPY --chown=fixin5mins:nodejs healthcheck.js ./

# Environment variables for Puppeteer and production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    NODE_ENV=production \
    NODE_OPTIONS="--max-old-space-size=1024" \
    CHROME_BIN=/usr/bin/chromium-browser

# Switch to non-root user
USER fixin5mins

# Expose port for health checks
EXPOSE 3000

# Health check with proper timeout
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node healthcheck.js || exit 1

# Set entrypoint
ENTRYPOINT ["./docker-entrypoint.sh"]

# Default command - can be overridden
CMD ["node", "dist/index.js"] 