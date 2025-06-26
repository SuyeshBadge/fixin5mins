# Dockerfile for Instagram Scheduler with Puppeteer support
FROM node:18-alpine

# Install all required dependencies for Chromium/Puppeteer in Alpine Linux
RUN apk add --no-cache \
    # Chromium browser
    chromium \
    # Essential libraries
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    # Font support
    ttf-freefont \
    ttf-dejavu \
    ttf-liberation \
    # Additional dependencies for Puppeteer stability
    udev \
    xvfb \
    # System utilities
    dumb-init \
    # Additional X11 and graphics libraries (Alpine names)
    libx11 \
    libxcomposite \
    libxdamage \
    libxext \
    libxfixes \
    libxrandr \
    libxrender \
    libxss \
    libxtst \
    # GTK and graphics libraries
    gtk+3.0 \
    pango \
    cairo \
    gdk-pixbuf \
    atk

# Additional Alpine-specific packages for Puppeteer
RUN apk add --no-cache \
    # Graphics and display
    mesa-dri-gallium \
    # Audio (even though we disable it, some libs expect it)
    alsa-lib \
    # Process management
    procps \
    # Network tools for debugging
    curl \
    # Memory management
    jemalloc

# Set Puppeteer environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    # Additional environment variables for stability
    CHROME_BIN=/usr/bin/chromium-browser \
    CHROME_PATH=/usr/bin/chromium-browser \
    # Disable Chrome sandbox (already handled in args)
    CHROME_DEVEL_SANDBOX=/usr/lib/chromium/chrome_sandbox \
    # Memory management
    NODE_OPTIONS="--max-old-space-size=1024"

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

# Create app directory
WORKDIR /app

# Copy package files and install dependencies as root first
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies (skip prepare script to avoid build before source copy)
RUN npm ci --ignore-scripts

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# Create necessary directories with proper permissions
RUN mkdir -p generated logs temp && \
    chown -R nextjs:nodejs /app && \
    chmod -R 755 /app

# Switch to non-root user
USER nextjs

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the scheduler
CMD ["npm", "run", "schedule-posts"] 