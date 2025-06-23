# Instagram Scheduler

Simple Docker container that automatically posts to Instagram twice daily.

## What it does

- Posts twice daily at optimal times (8am & 6pm weekdays, 9am & 7pm weekends)
- Generates AI-powered content automatically
- Uses different visual templates for variety
- Fully automated - no manual intervention needed

## Setup

### 1. Create `.env` file

```bash
# Instagram/Facebook API
INSTAGRAM_ACCESS_TOKEN=your_long_lived_token
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_business_account_id
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
FACEBOOK_PAGE_ID=your_page_id
INSTAGRAM_HANDLE=your_handle_without_@

# AI Service (OpenRouter)
OPENROUTER_API_KEY=your_openrouter_api_key

# Image Hosting (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 2. Run

```bash
# Start the scheduler
npm run start

# View logs
npm run logs

# Stop the scheduler
npm run stop
```

That's it! Your Instagram will now post automatically twice daily. 🎉 