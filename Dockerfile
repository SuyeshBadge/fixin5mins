# Dockerfile for Instagram Scheduler with Puppeteer support - Using Debian for better compatibility
FROM node:18-slim

# Install dependencies for Puppeteer in Debian
RUN apt-get update && apt-get install -y \
    # Google Chrome dependencies
    wget \
    gnupg \
    ca-certificates \
    # Essential libraries
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libxss1 \
    libasound2 \
    # Font support
    fonts-liberation \
    fonts-dejavu-core \
    # System utilities
    dumb-init \
    curl \
    # Process management
    procps \
    && rm -rf /var/lib/apt/lists/*

# Install Google Chrome (more stable than Chromium in containers)
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Set Puppeteer environment variables for Google Chrome
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome \
    # Chrome environment variables
    CHROME_BIN=/usr/bin/google-chrome \
    CHROME_PATH=/usr/bin/google-chrome \
    # Container-specific environment
    DISPLAY=:99 \
    # Memory management
    NODE_OPTIONS="--max-old-space-size=1024" \
    # Disable Chrome's sandbox in container
    CHROME_DEVEL_SANDBOX=/usr/lib/google-chrome/chrome-sandbox

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