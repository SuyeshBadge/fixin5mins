import dotenv from 'dotenv';
dotenv.config();



interface InstagramConfig {
  accessToken: string | undefined;
  businessAccountId: string | undefined;
}

interface FacebookConfig {
  appId: string | undefined;
  appSecret: string | undefined;
  pageId: string | undefined;
}

interface AiServiceConfig {
  baseUrl: string | undefined;
  apiKey: string | undefined;
}

interface OpenRouterConfig {
  apiKey: string | undefined;
  defaultModel: string | undefined;
  referrerUrl: string | undefined;
  siteName: string | undefined;
}

interface Html2ImageConfig {
  apiKey: string | undefined;
}

interface CloudinaryConfig {
  cloudName: string | undefined;
  apiKey: string | undefined;
  apiSecret: string | undefined;
}

interface Config {
  instagram: InstagramConfig;
  facebook: FacebookConfig;
  aiService: AiServiceConfig;
  openRouter: OpenRouterConfig;
  html2image: Html2ImageConfig;
  cloudinary: CloudinaryConfig;
}

const config: Config = {
  instagram: {
    accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
    businessAccountId: process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID
  },
  facebook: {
    appId: process.env.FACEBOOK_APP_ID,
    appSecret: process.env.FACEBOOK_APP_SECRET,
    pageId: process.env.FACEBOOK_PAGE_ID
  },
  aiService: {
    baseUrl: process.env.AI_SERVICE_BASE_URL || 'http://localhost:5293',
    apiKey: process.env.AI_SERVICE_API_KEY
  },
  openRouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultModel: process.env.OPENROUTER_DEFAULT_MODEL || 'qwen/qwen3-4b:free',
    referrerUrl: process.env.OPENROUTER_REFERRER_URL,
    siteName: process.env.OPENROUTER_SITE_NAME || 'Fixin5mins'
  },
  html2image: {
    apiKey: process.env.HTML2IMAGE_API_KEY
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  }
};

export default config; 