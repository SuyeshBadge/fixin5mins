# Instagram AI Content Generator

A Node.js TypeScript application that uses AI to generate content and post it to Instagram through the Graph API.

## Features

- Generate image prompts based on simple themes
- Create images using AI image generation (OpenAI DALL-E)
- Generate HTML templates and convert them to images
- Create beautiful quote images from AI-generated content
- Generate engaging captions for Instagram posts
- Post images to Instagram automatically via Graph API

## Prerequisites

- Node.js (v14 or higher)
- Instagram Business Account connected to a Facebook Page
- Facebook Developer Account and App
- Access to AI service API
- HTML2Image API key (get it from [html2image.net](https://www.html2image.net/))

## Installation

1. Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd instagram-ai-generator
npm install
```

2. Create a `.env` file in the root directory with the following variables:

```
# OpenAI API key (fallback if AI service doesn't generate images)
OPENAI_API_KEY=your_openai_api_key

# Instagram/Facebook Graph API credentials
INSTAGRAM_ACCESS_TOKEN=your_long_lived_access_token_here
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_instagram_business_account_id_here

# Facebook app credentials
FACEBOOK_APP_ID=your_facebook_app_id_here
FACEBOOK_APP_SECRET=your_facebook_app_secret_here
FACEBOOK_PAGE_ID=your_facebook_page_id_here

# AI Service
AI_SERVICE_BASE_URL=http://your-ai-service-url.com
AI_SERVICE_API_KEY=your_ai_service_api_key

# HTML2Image API
HTML2IMAGE_API_KEY=your_html2image_api_key
```

## Usage

### Build the project

```bash
npm run build
```

### Run the application

```bash
# Generate and post with a random theme (HTML post by default)
npm start

# Generate with a specific theme
npm start -- --theme="sunset at beach"

# Generate a specific content type (ai-image, html-post, or quote)
npm start -- --type=quote --theme="perseverance"

# Generate with a specific prompt (for ai-image type)
npm start -- --type=ai-image --prompt="A serene lake surrounded by mountains at dawn with mist rising from the water"

# Generate HTML post with specific title and content
npm start -- --type=html-post --title="Morning Motivation" --content="Start your day with positive thoughts and watch how it transforms your life."

# Generate but skip posting to Instagram
npm start -- --skip-posting
```

### Run examples

```bash
# Run the simple usage example
npm run example

# Run the HTML2Image example
npm run example:html

# Test the AI service connection
npm run test:ai
```

## Content Types

This project supports three types of content generation:

1. **AI Image (`--type=ai-image`)**: Uses OpenAI DALL-E to generate custom images from prompts
2. **HTML Post (`--type=html-post`)**: Creates stylized text posts using HTML templates
3. **Quote (`--type=quote`)**: Generates inspirational quotes with beautiful backgrounds

## How It Works

1. **Theme/Content Selection**: Choose a theme or provide specific content
2. **Content Generation**: 
   - For AI images: Generate detailed prompts and create images with DALL-E
   - For HTML posts: Create HTML templates and convert to images with HTML2Image
   - For quotes: Generate inspiring quotes and create stylized images
3. **Caption Creation**: The AI service generates an engaging caption
4. **Instagram Posting**: The image and caption are posted to Instagram

## Services Used

### AI Service
- External API for text generation (see OpenAPI schema in project)

### HTML2Image API
- Converts HTML templates to images
- Free API with unlimited requests
- Learn more at [html2image.net](https://www.html2image.net/)

### Instagram Graph API
- Posts content to Instagram business accounts
- Requires Facebook developer setup

## License

MIT 