const fs = require('fs');

// Create .env content
const envContent = `# AI Service Configuration
AI_SERVICE_BASE_URL=http://localhost:5293
AI_SERVICE_API_KEY=your_api_key_if_required

# Instagram API Configuration
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_instagram_business_account_id
INSTAGRAM_GRAPH_ACCESS_TOKEN=your_instagram_access_token  # Additional reference used in some files

# Cloudinary Configuration (required for Instagram image hosting)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# OpenAI Configuration (not used for this workflow but included for completeness)
OPENAI_API_KEY=your_openai_api_key_if_needed

# HTML2Image Configuration
HTML2IMAGE_API_KEY=your_html2image_api_key_if_needed

# Optional Settings
SKIP_INSTAGRAM_POSTING=false  # Set to true for testing without posting
LOG_LEVEL=info               # Options: debug, info, warn, error
LOG_TO_FILE=false            # Set to true to save logs to a file
LOG_FILE_PATH=./app.log      # Path for log file if LOG_TO_FILE is true

# Development Settings
NODE_ENV=production          # Set to 'development' for dev features
PRESERVE_IMAGES=true         # Keep generated images in temp directory
`;

// Write to .env file
fs.writeFileSync('.env', envContent);

console.log('.env file created successfully!'); 