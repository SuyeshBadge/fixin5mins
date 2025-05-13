# Instagram AI Content Generator

A Node.js TypeScript application that uses AI to generate content and post it to Instagram through the Graph API.

## Features

- Generate image prompts based on simple themes
- Create images using AI image generation (OpenAI DALL-E)
- Create images using template-based generation with various designs
- Generate HTML templates and convert them to images
- Create beautiful quote images from AI-generated content
- Generate engaging captions for Instagram posts
- Post images to Instagram automatically via Graph API
- Post Instagram Stories with proper 9:16 aspect ratio
- Schedule posts at research-backed optimal times for maximum engagement
- Automatically rotate between different templates for visual variety

## Prerequisites

- Node.js (v14 or higher)
- Instagram Business Account connected to a Facebook Page
- Facebook Developer Account and App
- Access to AI service API (OpenRouter for free models)
- Cloudinary account for image hosting

## Installation

1. Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd instagram-ai-generator
npm install
```

2. Create a `.env` file in the root directory with the following variables:

```
# OpenRouter API key (for free AI models)
OPENROUTER_API_KEY=your_openrouter_api_key

# Instagram/Facebook Graph API credentials
INSTAGRAM_GRAPH_ACCESS_TOKEN=your_long_lived_access_token_here
INSTAGRAM_ACCOUNT_ID=your_instagram_business_account_id_here

# Facebook app credentials
FACEBOOK_APP_ID=your_facebook_app_id_here
FACEBOOK_APP_SECRET=your_facebook_app_secret_here
FACEBOOK_PAGE_ID=your_facebook_page_id_here

# Cloudinary credentials
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## Usage

### Build the project

```bash
npm run build
```

### Generate and Post Content

```bash
# Generate and post with a random topic
npm run generate-and-post

# Generate with a specific topic
npm run generate-and-post -- --topic="mindfulness"

# Generate with a specific template
npm run generate-and-post -- --template="self-love-gradient"

# Generate in mock mode (no AI service needed)
npm run generate-and-post -- --mock
```

### Post Instagram Stories

```bash
# Run the Instagram Story example
npm run example:ig-story
```

This will create a vertical 9:16 image formatted for Instagram Stories and post it using the Instagram Graph API.

### Schedule Posts at Optimal Times

```bash
# Start the post scheduler
npm run schedule-posts
```

The scheduler will automatically:
- Determine the current day of the week
- Select optimal posting times based on Instagram engagement research
- Add small random variations to maintain unpredictability
- Rotate between different templates for visual variety
- Persist scheduling state between runs

For more details about the optimal posting times, see [OPTIMAL_POSTING_TIMES.md](OPTIMAL_POSTING_TIMES.md).

### Run examples

```bash
# Run the simple usage example
npm run example

# Run the HTML2Image example
npm run example:html

# Test the OpenRouter AI service
npm run test:openrouter

# Test Instagram content generation
npm run test:instagram

# Generate with the quote-red template
npm run example:quote-red

# Generate and post an Instagram Story
npm run example:ig-story
```

## Templates

This project includes several templates for content generation:

1. **Quote Red**: Motivational quotes with red typography on a cream background
2. **Self-love Gradient**: Elegant design with gradient background for self-care content
3. **Motivation Accent**: Clean design with highlighted accent words for bold motivational content

## Content Types

The application can generate different types of Instagram content:

1. **Feed Posts**: Standard square (1:1) or landscape/portrait posts for your Instagram feed
2. **Carousel Posts**: Multiple images in a single post that users can swipe through
3. **Stories**: Vertical content (9:16 aspect ratio) that appears in your Instagram Stories

## How It Works

1. **Topic Selection**: Choose a topic or let the system select one
2. **Content Generation**: 
   - Generate emotional content with hook, action step, and reward
   - Create images using the template system
   - Apply appropriate typography and design elements
3. **Image Hosting**: Upload images to Cloudinary for reliable hosting
4. **Instagram Posting**: Post images to Instagram with engaging captions
5. **Scheduling**: Schedule posts at optimal times for maximum engagement

## Services Used

### OpenRouter
- Access to free, open-source AI models like Mistral and Llama
- Model fallback mechanism for reliability
- Learn more at [openrouter.ai](https://openrouter.ai/)

### Cloudinary
- Cloud-based image hosting and manipulation
- Reliable image URLs for Instagram posting
- Learn more at [cloudinary.com](https://cloudinary.com/)

### Instagram Graph API
- Posts content to Instagram business accounts
- Supports feed posts, carousel posts, and stories
- Requires Facebook developer setup

## License

MIT 