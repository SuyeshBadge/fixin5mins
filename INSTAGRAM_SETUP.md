# Instagram Posting Setup Guide

This guide will help you set up Instagram posting with Cloudinary for the FixIn5Mins system.

## Step 1: Create a Cloudinary Account

1. Sign up for a free Cloudinary account at [cloudinary.com](https://cloudinary.com/users/register/free)
2. After signing up, you'll be directed to your dashboard
3. Note down your **Cloud Name**, **API Key**, and **API Secret** from the dashboard

## Step 2: Update Your Environment Configuration

Add your Cloudinary credentials to your `.env` file:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

## Step 3: Test Cloudinary Integration

Run the Cloudinary test script to make sure everything is working:

```bash
npm run test-cloudinary
```

If successful, you'll see:
- "SUCCESS: Image uploaded to Cloudinary"
- A URL to the uploaded image

## Step 4: Configure Instagram Posting

Make sure your Instagram Graph API credentials are set in your `.env` file:

```
# Instagram API credentials
INSTAGRAM_GRAPH_ACCESS_TOKEN=your_long_lived_access_token
INSTAGRAM_ACCOUNT_ID=your_instagram_business_account_id
SKIP_INSTAGRAM_POSTING=false
```

## Step 5: Using Carousel Posts

The enhanced Instagram integration now supports carousel posts (multiple images in a single post). To use this feature, you'll need to generate multiple images and then use the carousel posting function:

```typescript
import { postCarouselToInstagram } from './services/instagram-carousel';
import { renderHtmlToImages, HtmlContent } from './services/html2image-puppeteer';

// Example usage:
const htmlContents: HtmlContent[] = [
  { id: 'slide1', html: '<div style="background-color: blue; width: 1080px; height: 1080px;"><h1>Slide 1</h1></div>' },
  { id: 'slide2', html: '<div style="background-color: red; width: 1080px; height: 1080px;"><h1>Slide 2</h1></div>' }
];

const images = await renderHtmlToImages(htmlContents, { preserveImages: true, outputDir: './temp' });

const instagramConfig = {
  accessToken: process.env.INSTAGRAM_GRAPH_ACCESS_TOKEN || '',
  accountId: process.env.INSTAGRAM_ACCOUNT_ID || '',
  skipPosting: process.env.SKIP_INSTAGRAM_POSTING === 'true'
};

const postId = await postCarouselToInstagram(images, 'My post caption', ['hashtag1', 'hashtag2'], instagramConfig);
```

## Troubleshooting

### Cloudinary Issues

* **Error: Cloudinary credentials not fully configured**
  - Make sure all three Cloudinary variables are set correctly in your `.env` file
  
* **Upload Failed**
  - Verify your API key and secret are correct
  - Check network connectivity

### Instagram API Issues

* **Error: Instagram API authorization error**
  - Your access token might have expired. Generate a new long-lived token.
  
* **Error: Only photo or video can be accepted as media type**
  - Make sure Cloudinary is properly configured and returning valid image URLs

* **Permission errors**
  - Ensure your Instagram account is a Business or Creator account
  - Make sure your app has been reviewed by Meta and has proper permissions

## Note on Production Use

For production use:
- Implement a token refresh mechanism for Instagram tokens (they expire after 60 days)
- Set up proper error handling and notifications
- Use environment variables securely

## Need Help?

If you're having trouble with the setup, please refer to:

- Cloudinary Documentation: [https://cloudinary.com/documentation](https://cloudinary.com/documentation)
- Instagram Graph API Documentation: [https://developers.facebook.com/docs/instagram-api](https://developers.facebook.com/docs/instagram-api) 