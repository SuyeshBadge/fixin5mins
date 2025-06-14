# Technical Context

## Technologies Used

### Core Technologies
- **Node.js**: Runtime environment for executing JavaScript code server-side
- **TypeScript**: Typed superset of JavaScript for improved code quality and maintainability
- **EJS**: Templating engine for generating HTML from templates
- **Instagram Graph API**: For posting content to Instagram
- **Cloudinary API**: For cloud-based image hosting and management
- **Puppeteer**: Headless browser for rendering HTML to images

### Key Libraries
- **dotenv**: Managing environment variables
- **form-data**: Handling multipart/form-data for file uploads
- **node-fetch**: Making HTTP requests to external APIs
- **ejs**: Embedded JavaScript templates for content generation
- **cloudinary**: Cloud-based image management and hosting
- **puppeteer**: Headless Chrome for HTML to image rendering
- **openai**: Optional API client for text generation if needed
- **Google Fonts**: For typography in templates

## Development Environment

### Prerequisites
- Node.js v14 or higher
- npm (Node Package Manager)
- TypeScript
- Instagram Business Account connected to a Facebook Page
- Facebook Developer Account and App
- Access to external AI service API (for text generation)
- Cloudinary account and API credentials

### Project Structure
```
fixin5mins/
├── .env                       # Environment variables (not in repo)
├── package.json               # Project metadata and dependencies
├── tsconfig.json              # TypeScript configuration
├── src/
│   ├── config/                # Configuration files
│   │   └── templateConfig.ts  # Template definitions and mappings
│   ├── templates/             # Template files for image generation
│   │   ├── quote-red/         # Red quote template on cream background
│   │   │   ├── template.ejs   # Main EJS template file
│   │   │   └── README.md      # Documentation for the template
│   │   ├── self-love-gradient/ # Gradient background template for self-care
│   │   │   ├── template.ejs   # Main EJS template file  
│   │   │   └── README.md      # Documentation for the template
│   │   └── fixin5mins-post/   # Core brand template
│   │       ├── template.ejs   # Main EJS template file
│   │       └── assets/        # Supporting files for templates
│   ├── index.ts               # Main application entry point
│   ├── jobs/                  # Job scripts
│   │   └── generateAndPostContent.ts # End-to-end content generation and posting
│   ├── examples/              # Example use cases
│   │   ├── html2image-example.ts
│   │   ├── simple-usage.ts
│   │   ├── template-example.ts
│   │   └── test-ai-service.ts
│   └── services/              # Service implementations
│       ├── aiService.ts       # AI text generation service
│       ├── cloudinary.ts      # Cloudinary integration for image hosting
│       ├── html2image-puppeteer.ts # HTML to image using Puppeteer
│       ├── imageGenerator.ts  # Image generation orchestration
│       ├── instagram-carousel.ts # Instagram carousel posting service
│       ├── topicCache.ts      # LRU cache for rotating topics
│       └── templateManager.ts # Template management service
```

### Template Development
Creating a new template involves several steps:
1. Create a new directory in `src/templates/` with your template ID
2. Create a `template.ejs` file with HTML/CSS for the template
3. Add a `README.md` file documenting the template usage
4. Register the template in `src/config/templateConfig.ts`
5. Include any needed fonts from Google Fonts or other sources
6. Implement responsive design for different content lengths
7. Test with various content types

### Setup and Installation
1. Clone the repository
2. Run `npm install` to install dependencies
3. Create `.env` file with required API keys and credentials
   - Instagram/Facebook credentials
   - AI service API key
   - Cloudinary credentials
4. Build the project using `npm run build`

## Technical Constraints

### API Rate Limits
- **Instagram Graph API**: Rate limits on posting content
- **External AI Service**: Rate limits for text generation (if using)
- **Cloudinary API**: Storage and bandwidth limits based on plan

### External Dependencies
- Puppeteer for converting templates to images
- Cloudinary for image hosting before posting to Instagram
- Need for valid API keys and credentials
- Internet connectivity requirement for posting
- Google Fonts for typography in templates
- For emoji rendering in generated images (via Puppeteer/Chrome), the system must have a color emoji font installed. On Google Cloud VMs, install `fonts-noto-color-emoji` (Debian/Ubuntu) to ensure emoji display correctly in output images.

### Security Considerations
- Secure storage of API keys and access tokens
- Handling of Instagram authentication
- Protection of generated content
- Proper management of Cloudinary credentials

## Dependencies

### Production Dependencies
```json
{
  "dotenv": "^16.3.1",      // Environment variable management
  "ejs": "^3.1.9",          // Templating engine for HTML generation
  "form-data": "^4.0.0",    // Multipart form data for API requests
  "node-fetch": "^2.7.0",   // HTTP client for API requests
  "openai": "^4.11.0",      // Optional OpenAI API client
  "cloudinary": "^1.33.0",  // Cloud-based image management and hosting
  "puppeteer": "^20.0.0"    // Headless browser for HTML to image rendering
}
```

### Development Dependencies
```json
{
  "@types/ejs": "^3.1.5",      // TypeScript definitions for EJS
  "@types/form-data": "^2.5.2", // TypeScript definitions
  "@types/node": "^20.8.2",     // Node.js TypeScript definitions
  "rimraf": "^5.0.1",           // Cross-platform directory deletion
  "ts-node": "^10.9.1",         // TypeScript execution in Node.js
  "typescript": "^5.2.2"        // TypeScript compiler
}
```

## Build and Run Scripts
```json
{
  "build": "tsc",                               // Compile TypeScript to JavaScript
  "start": "node dist/index.js",                // Run the compiled application
  "dev": "ts-node src/index.ts",                // Run in development mode
  "test:ai": "ts-node src/examples/test-ai-service.ts",   // Test AI service
  "example": "ts-node src/examples/simple-usage.ts",      // Run simple example
  "example:html": "ts-node src/examples/html2image-example.ts", // HTML2Image example
  "example:template": "ts-node src/examples/template-example.ts", // Template example
  "generate-and-post": "ts-node src/jobs/generateAndPostContent.ts", // Generate and post content
  "lint": "eslint . --ext .ts",                 // Lint TypeScript files
  "clean": "rimraf dist generated",             // Clean build directories
  "prepare": "npm run build"                    // Prepare for publishing
}
```

## Environment Variables
Required environment variables in the `.env` file:
```
# Instagram/Facebook Graph API credentials
INSTAGRAM_ACCESS_TOKEN=your_long_lived_access_token_here
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_instagram_business_account_id_here
INSTAGRAM_HANDLE=your_instagram_handle_without_@

# Facebook app credentials
FACEBOOK_APP_ID=your_facebook_app_id_here
FACEBOOK_APP_SECRET=your_facebook_app_secret_here
FACEBOOK_PAGE_ID=your_facebook_page_id_here

# AI Service (for text generation)
AI_SERVICE_BASE_URL=http://your-ai-service-url.com
AI_SERVICE_API_KEY=your_ai_service_api_key

# Cloudinary credentials
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## Font Usage
The templates use Google Fonts to ensure consistent typography:

1. **self-love-gradient**:
   - **Playfair Display**: For headings (similar to "The Young Serif")
   - **Great Vibes**: For script text (similar to "Burgues Script")
   - **Cormorant Garamond**: For body text and emotional rewards
   - **Poppins**: For UI elements like pills and dates

2. **quote-red**:
   - **DM Serif Display**: For quotes and titles
   - **Cormorant Garamond**: For secondary text
   - **Poppins**: For UI elements and handle name

3. **fixin5mins-post**:
   - Custom brand fonts via the template system 