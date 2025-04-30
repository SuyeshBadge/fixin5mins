# Audio Integration Architecture

The following is a high-level architecture diagram of the Instagram Post Audio Integration feature:

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                    │
│                           FixIn5Mins Audio Integration                             │
│                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                    │
│                              Orchestration Service                                 │
│                                                                                    │
└─────────────────┬─────────────────┬─────────────────┬────────────────┬─────────────┘
                  │                 │                 │                │
                  ▼                 ▼                 ▼                ▼
┌────────────────────┐  ┌─────────────────────┐  ┌─────────────┐  ┌──────────────────┐
│                    │  │                     │  │             │  │                  │
│  Content Analysis  │  │   Audio Library     │  │    Video    │  │   Instagram      │
│      Service       │  │      Service        │  │ Generation  │  │   Publication    │
│                    │  │                     │  │   Service   │  │     Service      │
└────────────────────┘  └─────────────────────┘  └─────────────┘  └──────────────────┘
        │  ▲                     │  ▲                  │  ▲                │  ▲
        │  │                     │  │                  │  │                │  │
        ▼  │                     ▼  │                  ▼  │                ▼  │
┌────────────────────┐  ┌─────────────────────┐  ┌─────────────┐  ┌──────────────────┐
│                    │  │                     │  │             │  │                  │
│     NLP Engine     │  │   Audio Files &     │  │   Canva API │  │   Instagram      │
│   Sentiment Analysis│  │     Metadata DB    │  │   or FFmpeg │  │   Graph API      │
│                    │  │                     │  │             │  │                  │
└────────────────────┘  └─────────────────────┘  └─────────────┘  └──────────────────┘
```

## Detailed Component Flow

### 1. Content Generation Flow

```
┌──────────────┐     ┌───────────────┐     ┌──────────────┐     ┌─────────────┐
│              │     │               │     │              │     │             │
│  Generate    │ ──> │  Analyze      │ ──> │  Select      │ ──> │  Generate   │
│  Content     │     │  Content      │     │  Audio       │     │  Video      │
│              │     │               │     │              │     │             │
└──────────────┘     └───────────────┘     └──────────────┘     └─────────────┘
                                                                       │
                                                                       ▼
                                                              ┌─────────────────┐
                                                              │                 │
                                                              │  Publish to     │
                                                              │  Instagram      │
                                                              │                 │
                                                              └─────────────────┘
```

### 2. Audio Selection Process

```
┌───────────────────────┐
│                       │
│ Post Content          │
│ - Emotional Hook      │
│ - Action Step         │
│ - Emotional Reward    │
│                       │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐    ┌───────────────────────┐
│                       │    │                       │
│ Theme Extraction      │───>│ Emotional Tone        │
│ - Keywords            │    │ - Sentiment Analysis  │
│ - Entities            │    │ - Mood Classification │
│ - Topics              │    │                       │
└───────────┬───────────┘    └───────────┬───────────┘
            │                            │
            └────────────┬───────────────┘
                         │
                         ▼
┌───────────────────────────────────────┐
│                                       │
│ Audio Matching Algorithm              │
│ - Theme-based matching                │
│ - Mood congruence                     │
│ - Popularity weighting                │
│ - Trending status                     │
│                                       │
└────────────────┬──────────────────────┘
                 │
                 ▼
┌───────────────────────┐    ┌───────────────────────┐
│                       │    │                       │
│ Candidate Audio       │───>│ Selected Audio        │
│ - Scored options      │    │ - Best match          │
│ - Ranked list         │    │ - Fallback options    │
│                       │    │                       │
└───────────────────────┘    └───────────────────────┘
```

### 3. Database Schema Relationships

```
┌───────────────────────┐     ┌───────────────────────┐
│ Audio Track           │     │ Content Theme         │
│                       │     │                       │
│ - id                  │     │ - id                  │
│ - title               │     │ - name                │
│ - artistName          │     │ - description         │
│ - duration            │     │ - keywords            │
│ - fileUrl             │     └─────────┬─────────────┘
│ - themes (array)      │               │
│ - moods (array)       │◄──────────────┘
│ - tempo               │
│ - popularity          │     ┌───────────────────────┐
│ - isTrending          │     │ Mood                  │
│ - licenseType         │     │                       │
│ - attributionRequired │     │ - id                  │
│ - attributionText     │     │ - name                │
│ - dateAdded           │     │ - description         │
│ - lastUsed            │     │ - intensity           │
│ - usageCount          │     └─────────┬─────────────┘
└─────────┬─────────────┘               │
          │                             │
          └─────────────────────────────┘


┌───────────────────────┐     ┌───────────────────────┐
│ Post                  │     │ Video                 │
│                       │     │                       │
│ - id                  │     │ - id                  │
│ - emotionalHook       │     │ - postId             ◄┼─────┐
│ - actionStep          │     │ - audioTrackId       ◄┼──┐  │
│ - emotionalReward     │     │ - fileUrl             │  │  │
│ - themes (array)      │     │ - duration            │  │  │
│ - caption             │     │ - instagramPostId     │  │  │
│ - hashtags            │     │ - createdAt           │  │  │
│ - createdAt           │     └───────────────────────┘  │  │
└─────────┬─────────────┘                                │  │
          │                                              │  │
          └──────────────────────────────────────────────┘  │
                                                            │
                                                            │
┌───────────────────────┐                                   │
│ Analytics             │                                   │
│                       │                                   │
│ - id                  │                                   │
│ - postId             ◄┼───────────────────────────────────┘
│ - likes               │
│ - comments            │
│ - shares              │
│ - views               │
│ - engagement_rate     │
│ - createdAt           │
└───────────────────────┘
```

## Deployment Architecture

```
                                   ┌─────────────────┐
                                   │                 │
                                   │    Internet     │
                                   │                 │
                                   └────────┬────────┘
                                            │
                ┌───────────────────────────┼───────────────────────────┐
                │                           │                           │
                │                  ┌────────▼────────┐                  │
                │                  │                 │                  │
                │                  │   API Gateway   │                  │
                │                  │                 │                  │
                │                  └────────┬────────┘                  │
                │                           │                           │
┌───────────────▼───────────────┐ ┌────────▼────────┐ ┌────────────────▼────────────────┐
│                               │ │                 │ │                                  │
│   Kubernetes Cluster          │ │   CloudFront    │ │     External Services            │
│                               │ │                 │ │                                  │
│  ┌─────────┐   ┌─────────┐    │ │      CDN        │ │  ┌─────────────┐ ┌─────────────┐│
│  │Orchest- │   │Content  │    │ │                 │ │  │  Instagram  │ │    Canva    ││
│  │ration   │   │Analysis │    │ └────────┬────────┘ │  │  Graph API  │ │     API     ││
│  │Service  │   │Service  │    │          │          │  │             │ │             ││
│  └─────────┘   └─────────┘    │          │          │  └─────────────┘ └─────────────┘│
│                               │          │          │                                  │
│  ┌─────────┐   ┌─────────┐    │ ┌────────▼────────┐ │  ┌─────────────┐ ┌─────────────┐│
│  │Audio    │   │Video    │    │ │                 │ │  │  Audio      │ │  Analytics  ││
│  │Library  │   │Generator│    │ │      S3         │ │  │  APIs       │ │  Services   ││
│  │Service  │   │Service  │    │ │                 │ │  │             │ │             ││
│  └─────────┘   └─────────┘    │ └─────────────────┘ │  └─────────────┘ └─────────────┘│
│                               │                     │                                  │
└───────────────────────────────┘                     └──────────────────────────────────┘
                │                                                       │
                │                                                       │
   ┌────────────▼────────────────┐                      ┌───────────────▼─────────────┐
   │                             │                      │                             │
   │        MongoDB              │                      │         Elasticsearch       │
   │  (Audio Metadata Storage)   │                      │    (Search Capabilities)    │
   │                             │                      │                             │
   └─────────────────────────────┘                      └─────────────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────┐
│                                     │
│          Client Application         │
│                                     │
└──────────────────┬──────────────────┘
                   │
                   │ HTTPS / TLS 1.3
                   │
┌──────────────────▼──────────────────┐
│                                     │
│          WAF / API Gateway          │
│                                     │
└──────────────────┬──────────────────┘
                   │
                   │ OAuth 2.0 / JWT
                   │
┌──────────────────▼──────────────────┐     ┌───────────────────────┐
│                                     │     │                       │
│        Authentication Service       │◄───►│    Identity Provider  │
│                                     │     │                       │
└──────────────────┬──────────────────┘     └───────────────────────┘
                   │
                   │ Encrypted Communication
                   │
┌──────────────────▼──────────────────┐     ┌───────────────────────┐
│                                     │     │                       │
│     Microservices (with RBAC)      │◄───►│     Secret Manager    │
│                                     │     │                       │
└──────────────────┬──────────────────┘     └───────────────────────┘
                   │
                   │ Encrypted at Rest
                   │
┌──────────────────▼──────────────────┐
│                                     │
│     Databases & Storage (Encrypted) │
│                                     │
└─────────────────────────────────────┘
``` 