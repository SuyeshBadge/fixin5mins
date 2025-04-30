# Instagram API Requirements for Audio Integration

## Overview

This document outlines the technical requirements, limitations, and best practices for integrating audio into Instagram posts using the Instagram Graph API. Understanding these requirements is essential for successfully implementing the audio integration feature for the FixIn5Mins application.

## 1. Instagram Video with Audio Publishing Options

### 1.1 Available Post Types

| Feature | Supports Audio | Maximum Duration | API Support | Note |
|---------|---------------|-----------------|------------|------|
| **Reels** | Yes | 90 seconds | Full | Preferred for audio content |
| **Feed Video** | Yes | 60 minutes | Full | Limited audio exposure |
| **Stories** | Yes | 15 seconds | Full | Temporary (24 hour) content |
| **IGTV** | Yes | 60 minutes | Limited | Longer-form content |
| **Carousels** | No* | N/A | Full | *Individual videos in carousel can have audio |

### 1.2 Reels vs. Feed Videos vs. Stories

**Reels** is the recommended format for audio-focused content because:
- Higher visibility in Explore and Reels tabs
- Better discoverability via audio attribution
- Algorithm prioritization for short-form video content
- Optimized for sound-on viewing experience
- Access to Instagram's audio library

## 2. Instagram Graph API for Video Publishing

### 2.1 API Endpoints

| Endpoint | Purpose | Authentication | Rate Limit |
|----------|---------|----------------|-----------|
| `/{ig-user-id}/media` | Create media container | Page Access Token | 240 calls/hour |
| `/{ig-user-id}/media_publish` | Publish created media | Page Access Token | 240 calls/hour |
| `/{ig-container-id}?fields=status_code` | Check publishing status | Page Access Token | 240 calls/hour |
| `/{ig-user-id}/content_publishing_limit` | Check rate limit usage | Page Access Token | 240 calls/hour |

### 2.2 Video Upload Process

The Instagram API uses a 3-step process for video uploads:

1. **Initialize Upload Session**:
   ```
   POST /{ig-user-id}/media
   ```
   Parameters:
   - `media_type`: Set to "REELS" for Reels content
   - `video_url`: URL to the video file (must be publicly accessible)
   - `caption`: Post caption text
   - Other optional parameters

2. **Check Upload Status**:
   ```
   GET /{ig-container-id}?fields=status_code
   ```
   Status codes:
   - `EXPIRED`: Container expired (not published within 24h)
   - `ERROR`: Failed to complete publishing
   - `FINISHED`: Ready to be published
   - `IN_PROGRESS`: Still processing
   - `PUBLISHED`: Successfully published

3. **Publish Media**:
   ```
   POST /{ig-user-id}/media_publish
   ```
   Parameters:
   - `creation_id`: The container ID from step 1

### 2.3 Reels-Specific Parameters

When creating a Reel with audio, the following parameters are relevant:

| Parameter | Description | Required | Format |
|-----------|-------------|----------|--------|
| `media_type` | Specifies the media type | Yes | "REELS" |
| `video_url` | URL to the video file | Yes | URL string |
| `caption` | Text caption for the post | No | String |
| `share_to_feed` | Whether to share to feed | No | Boolean |
| `audio_name` | Name of the audio track | No | String |
| `thumb_offset` | Thumbnail position in ms | No | Integer |
| `cover_url` | Custom cover image URL | No | URL string |

## 3. Technical Requirements and Limitations

### 3.1 Video Specifications

| Specification | Requirement | Notes |
|---------------|-------------|-------|
| **Format** | MP4 (recommended) | MOV also supported |
| **Aspect Ratio** | 9:16 | Min 0.01:1, max 10:1, but 9:16 recommended |
| **Resolution** | 1080x1920 px (recommended) | Minimum 540x960 px |
| **Frame Rate** | 24-60 fps | 30fps recommended |
| **Duration** | 3-90 seconds | >60s only for certain accounts |
| **Maximum File Size** | 100MB | |
| **Video Codec** | H.264, H.265 | Progressive scan, closed GOP, 4:2:0 chroma |
| **Video Bitrate** | 5Mbps maximum | VBR |
| **Audio Codec** | AAC | 48kHz sample rate maximum |
| **Audio Channels** | 1 or 2 (mono or stereo) | |
| **Audio Bitrate** | 128kbps | |

### 3.2 Rate Limits and Quotas

Instagram imposes the following limits:

1. **API Rate Limits**:
   - 240 API calls per user per hour
   - 25 content publishing operations per 24 hours

2. **Content Publishing Limits**:
   - 50 API-published posts within a 24-hour period
   - Reels API limited to 30 API-published posts within 24 hours

3. **Media Container Limitations**:
   - Media containers expire after 24 hours if not published
   - Maximum 10 containers can be in progress simultaneously

### 3.3 Authentication Requirements

To publish videos to Instagram, you need:

1. **Facebook Page** connected to an Instagram Professional Account
2. **Access Token** with the following permissions:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_read_engagement` (if using Page access token)

### 3.4 Audio-Related Limitations

1. **Instagram Music Restrictions**:
   - Business accounts have limited access to Instagram's music library
   - Some music may be restricted in certain regions
   - Instagram may automatically detect copyrighted music and take action

2. **Audio Attribution**:
   - When using Instagram's audio library, attribution is automatic
   - For custom audio, attribution is not displayed in the Instagram interface

## 4. Best Practices for Instagram Audio Integration

### 4.1 Technical Optimizations

1. **Pre-upload Processing**:
   - Format video to exactly match Instagram's specifications
   - Normalize audio to -14 LUFS for consistent loudness
   - Ensure proper audio sync throughout the video
   - Apply fade in/out to avoid abrupt audio starts/stops

2. **Upload Optimizations**:
   - Use a CDN for hosting video files to ensure fast uploads
   - Implement retry logic with exponential backoff for API calls
   - Monitor container status and handle failures appropriately
   - Cache successful publishing patterns

### 4.2 Content Recommendations

1. **Audio Selection**:
   - Use trending audio when possible to boost discoverability
   - Match audio tempo and mood to visual content
   - Keep audio clear and high quality
   - Consider region restrictions when selecting music

2. **Video Creation**:
   - Design for sound-on viewing experience
   - Add visual cues that complement audio elements
   - Include captions/subtitles for accessibility
   - Create a visual hook in the first 3 seconds

### 4.3 Error Handling Strategies

| Error Code | Description | Mitigation Strategy |
|------------|-------------|---------------------|
| 100 | Missing parameter | Validate all required parameters before submission |
| 1363040 | Unsupported aspect ratio | Ensure video conforms to 9:16 ratio |
| 1363127 | Unsupported resolution | Use at least 540x960 resolution |
| 1363128 | Unsupported duration | Verify video is between 3-90 seconds |
| 1363129 | Unsupported frame rate | Ensure frame rate is between 24-60fps |
| 24 | Rate limit reached | Implement queue system with scheduled posting |
| 190 | Invalid access token | Refresh token or re-authenticate |

## 5. Implementation Approach

### 5.1 Audio Selection to Publishing Workflow

```
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│                   │     │                   │     │                   │
│  Select Audio     │────►│  Generate Video   │────►│  Upload to CDN    │
│  Based on Content │     │  with Audio       │     │                   │
│                   │     │                   │     │                   │
└───────────────────┘     └───────────────────┘     └────────┬──────────┘
                                                             │
                                                             │
┌───────────────────┐     ┌───────────────────┐     ┌────────▼──────────┐
│                   │     │                   │     │                   │
│  Publish to       │◄────┤  Media Container  │◄────┤  Create Media     │
│  Instagram        │     │  Status Check     │     │  Container        │
│                   │     │                   │     │                   │
└───────────────────┘     └───────────────────┘     └───────────────────┘
```

### 5.2 Implementation Phases

1. **Phase 1**: Basic Video with Audio Publishing
   - Implement core video generation with static audio
   - Set up Instagram API authentication
   - Build basic publishing workflow

2. **Phase 2**: Audio-Content Matching
   - Develop content analysis system
   - Implement audio selection algorithm
   - Create audio metadata system

3. **Phase 3**: Advanced Features
   - Trending audio integration
   - A/B testing of audio impact
   - Analytics and performance tracking

## 6. Testing and Verification

### 6.1 Pre-Release Testing Checklist

- [ ] Video format compliance with Instagram specifications
- [ ] Audio quality and synchronization verification
- [ ] API authentication and permissions validation
- [ ] Rate limit monitoring and handling
- [ ] Error recovery testing
- [ ] Content delivery speed optimization

### 6.2 Publishing Validation Tests

| Test | Description | Success Criteria |
|------|-------------|-----------------|
| **Format Test** | Test various video formats and specs | All supported formats publish successfully |
| **Audio Test** | Test different audio types and sources | Audio plays clearly in published content |
| **Duration Test** | Test various video durations | Videos of different lengths publish correctly |
| **Error Recovery** | Test system response to API errors | System recovers and retries appropriately |
| **Concurrent Publishing** | Test multiple simultaneous uploads | All uploads complete without errors |
| **Regional Test** | Test content in different regions | Content accessible across target regions |

## 7. Resources

### 7.1 Official Instagram Documentation

- [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-api/)
- [Instagram Content Publishing Guide](https://developers.facebook.com/docs/instagram-api/guides/content-publishing)
- [Reels Publishing Documentation](https://developers.facebook.com/docs/instagram-api/guides/reels-publishing)

### 7.2 Sample API Calls

**1. Create a Reels Container**:
```
curl -X POST \
  "https://graph.facebook.com/v18.0/{ig-user-id}/media" \
  -H "Content-Type: application/json" \
  -d '{
        "media_type": "REELS",
        "video_url": "https://example.com/video.mp4",
        "caption": "Check out this amazing content! #fixin5mins #motivation",
        "share_to_feed": "true"
      }'
```

**2. Check Media Container Status**:
```
curl -X GET \
  "https://graph.facebook.com/v18.0/{ig-container-id}?fields=status_code" \
  -H "Authorization: Bearer {access-token}"
```

**3. Publish Container**:
```
curl -X POST \
  "https://graph.facebook.com/v18.0/{ig-user-id}/media_publish" \
  -H "Content-Type: application/json" \
  -d '{
        "creation_id": "{ig-container-id}"
      }'
```

### 7.3 Troubleshooting Common Issues

1. **"Media container expired"**:
   - Ensure you're publishing within 24 hours of container creation
   - Implement a monitoring system to track container status

2. **"Unsupported media type"**:
   - Verify video format, codec, and container meet specifications
   - Use FFmpeg to convert to supported formats

3. **"Rate limit exceeded"**:
   - Implement queuing system with scheduled posting
   - Monitor rate limits with the content_publishing_limit endpoint

4. **"Invalid access token"**:
   - Implement token refresh mechanism
   - Store tokens securely and refresh before expiration 