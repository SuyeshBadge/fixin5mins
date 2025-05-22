#!/bin/bash

# Exit on error
set -e

echo "===== Setting up fixin5mins project ====="

# Update system packages
echo "Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js and npm
echo "Installing Node.js and npm..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# Verify Node.js and npm installation
node -v
npm -v

# Install build essentials and other dependencies
echo "Installing system dependencies..."
sudo apt-get install -y build-essential git ca-certificates gnupg

# Install Puppeteer dependencies
echo "Installing Puppeteer dependencies..."
sudo apt-get install -y \
  gconf-service \
  libasound2 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgcc1 \
  libgconf-2-4 \
  libgdk-pixbuf2.0-0 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  ca-certificates \
  fonts-liberation \
  libappindicator1 \
  libnss3 \
  lsb-release \
  xdg-utils \
  wget

# Check if we're in the project directory
if [ -f "package.json" ] && grep -q "fixin5mins" "package.json"; then
  echo "Already in the fixin5mins project directory"
else
  # Clone the repository if not already done
  if [ ! -d "fixin5mins" ]; then
    echo "Cloning the repository..."
    git clone https://github.com/yourusername/fixin5mins.git
    cd fixin5mins
  else
    cd fixin5mins
  fi
fi

# Install project dependencies
echo "Installing npm dependencies..."
npm install

# Build the project
echo "Building the project..."
npm run build

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
  echo "Creating .env file template..."
  cat > .env << EOL
# Instagram/Facebook Graph API credentials
INSTAGRAM_ACCESS_TOKEN=your_long_lived_access_token_here
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_instagram_business_account_id_here
INSTAGRAM_HANDLE=your_instagram_handle_without_@

# Facebook app credentials
FACEBOOK_APP_ID=your_facebook_app_id_here
FACEBOOK_APP_SECRET=your_facebook_app_secret_here
FACEBOOK_PAGE_ID=your_facebook_page_id_here

# OpenRouter configuration for text generation
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_DEFAULT_MODEL=mistralai/mistral-7b-instruct
OPENROUTER_REFERRER_URL=https://your-site-url.com
OPENROUTER_SITE_NAME=Your Site Name

# Cloudinary credentials for image hosting
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
EOL
  echo "Please update the .env file with your actual credentials"
fi

# Make this script executable
chmod +x "$0"

echo "===== Setup complete! ====="
echo "Next steps:"
echo "1. Update your .env file with your actual API keys and credentials"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Check out the examples in the src/examples directory" 