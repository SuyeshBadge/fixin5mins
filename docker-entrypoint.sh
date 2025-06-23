#!/bin/sh

# Docker entrypoint script for FixIn5Mins
# Production-ready with comprehensive checks and logging

set -e

echo "========================================="
echo "Starting FixIn5Mins container..."
echo "========================================="

# Function for logging
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [ENTRYPOINT] $1"
}

# Function for error logging
error() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] $1" >&2
}

log "Node.js version: $(node --version)"
log "NPM version: $(npm --version)"
log "Environment: ${NODE_ENV:-development}"

# Check if required environment variables are set
check_env_var() {
    local var_name=$1
    local var_value=$(eval echo \$$var_name)
    
    if [ -z "$var_value" ]; then
        error "$var_name is not set or empty"
        return 1
    else
        log "$var_name is configured"
        return 0
    fi
}

log "Checking required environment variables..."

# Critical environment variables for Instagram posting
required_vars="INSTAGRAM_ACCESS_TOKEN INSTAGRAM_BUSINESS_ACCOUNT_ID CLOUDINARY_CLOUD_NAME CLOUDINARY_API_KEY CLOUDINARY_API_SECRET"
missing_vars=""

for var in $required_vars; do
    if ! check_env_var "$var"; then
        missing_vars="$missing_vars $var"
    fi
done

if [ -n "$missing_vars" ]; then
    error "Missing required environment variables:$missing_vars"
    error "Please check your .env file and ensure all required variables are set"
    exit 1
fi

log "All required environment variables are set"

# Create necessary directories with proper permissions
log "Setting up directories..."
mkdir -p /app/generated /app/logs
chmod 755 /app/generated /app/logs

# Check if we have write permissions
if ! touch /app/generated/.write-test 2>/dev/null; then
    error "Cannot write to /app/generated directory"
    exit 1
fi
rm -f /app/generated/.write-test

if ! touch /app/logs/.write-test 2>/dev/null; then
    error "Cannot write to /app/logs directory"
    exit 1
fi
rm -f /app/logs/.write-test

log "Directory permissions verified"

# Log container startup
echo "$(date '+%Y-%m-%d %H:%M:%S'): Container started with PID $$" >> /app/logs/container.log

# Check if Chromium is available for Puppeteer
log "Checking Chromium installation..."
if ! command -v chromium-browser >/dev/null 2>&1; then
    error "Chromium not found. Puppeteer will not work."
    exit 1
fi

CHROMIUM_VERSION=$(chromium-browser --version 2>/dev/null || echo "unknown")
log "Chromium found: $CHROMIUM_VERSION"

# Test Chromium with minimal flags
log "Testing Chromium functionality..."
if ! chromium-browser --headless --disable-gpu --no-sandbox --disable-setuid-sandbox --virtual-time-budget=1000 --run-all-compositor-stages-before-draw about:blank >/dev/null 2>&1; then
    error "Chromium test failed"
    exit 1
fi
log "Chromium test passed"

# Check if the built application exists
log "Verifying application build..."
if [ ! -f "/app/dist/index.js" ]; then
    error "Built application not found at /app/dist/index.js"
    error "Build may have failed. Check build logs."
    exit 1
fi

# Check if templates exist
if [ ! -d "/app/src/templates" ] || [ -z "$(ls -A /app/src/templates 2>/dev/null)" ]; then
    error "Templates directory not found or empty at /app/src/templates"
    exit 1
fi

log "Templates found: $(ls -1 /app/src/templates | wc -l) template(s)"

# Check font availability for emoji rendering
log "Checking font support..."
if ! fc-list | grep -i emoji >/dev/null 2>&1; then
    error "Emoji fonts not found. Emoji rendering may not work properly."
fi

# Set up signal handlers for graceful shutdown
cleanup() {
    log "Received shutdown signal, cleaning up..."
    if [ -n "$APP_PID" ]; then
        kill -TERM "$APP_PID" 2>/dev/null || true
        wait "$APP_PID" 2>/dev/null || true
    fi
    log "Shutdown complete"
    exit 0
}

trap cleanup TERM INT

log "Application verification complete"
log "Starting application with command: $*"

# Execute the command passed to the container
exec "$@" &
APP_PID=$!

# Wait for the application process
wait $APP_PID 