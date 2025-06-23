# Docker Setup for FixIn5Mins

This document provides instructions for running the FixIn5Mins Instagram content generator using Docker.

## Quick Start

### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+
- `.env` file with all required environment variables

### Environment Setup
1. Copy your `.env` file to the root directory
2. Ensure all required variables are set:
   ```bash
   # Instagram/Facebook credentials
   INSTAGRAM_ACCESS_TOKEN=your_token_here
   INSTAGRAM_BUSINESS_ACCOUNT_ID=your_account_id_here
   FACEBOOK_APP_ID=your_app_id_here
   FACEBOOK_APP_SECRET=your_app_secret_here
   FACEBOOK_PAGE_ID=your_page_id_here
   INSTAGRAM_HANDLE=your_handle_without_@
   
   # OpenRouter AI Service
   OPENROUTER_API_KEY=your_openrouter_key_here
   
   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

### Production Deployment
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Development Setup
```bash
# Use development compose file for hot reload
docker-compose -f docker-compose.dev.yml up

# Build development image
docker-compose -f docker-compose.dev.yml build
```

## Services

### Main Application (`fixin5mins`)
- **Purpose**: Core content generation and Instagram posting
- **Port**: 3000 (health checks)
- **Volumes**: 
  - `./generated` - Generated content storage
  - `./logs` - Application logs
- **Health Check**: Available at startup

### Scheduler (`scheduler`)
- **Purpose**: Automated daily post scheduling
- **Dependencies**: Main application
- **Command**: Runs `dailyPostScheduler.js`

### Redis (`redis`)
- **Purpose**: Caching and session storage (future enhancement)
- **Port**: 6379
- **Data**: Persisted in named volume

## Docker Commands

### Building
```bash
# Build production image
docker build -t fixin5mins:latest .

# Build specific stage
docker build --target builder -t fixin5mins:builder .
```

### Running Individual Containers
```bash
# Run main application
docker run -d \
  --name fixin5mins-app \
  --env-file .env \
  -v $(pwd)/generated:/app/generated \
  -v $(pwd)/logs:/app/logs \
  -p 3000:3000 \
  fixin5mins:latest

# Run scheduler only
docker run -d \
  --name fixin5mins-scheduler \
  --env-file .env \
  -v $(pwd)/generated:/app/generated \
  fixin5mins:latest \
  node dist/jobs/dailyPostScheduler.js

# Run one-time content generation
docker run --rm \
  --env-file .env \
  -v $(pwd)/generated:/app/generated \
  fixin5mins:latest \
  node dist/jobs/generateAndPostContent.js
```

## Volume Management

### Persistent Data
- **Generated Content**: `./generated` - All generated images and content
- **Logs**: `./logs` - Application and container logs
- **Redis Data**: `redis-data` - Redis persistence

### Backup
```bash
# Backup generated content
tar -czf backup-$(date +%Y%m%d).tar.gz generated/ logs/

# Backup Redis data
docker run --rm -v fixin5mins_redis-data:/data -v $(pwd):/backup \
  alpine tar czf /backup/redis-backup-$(date +%Y%m%d).tar.gz -C /data .
```

## Monitoring

### Health Checks
```bash
# Check container health
docker ps
docker inspect fixin5mins-app | grep Health

# Manual health check
docker exec fixin5mins-app node healthcheck.js
```

### Logs
```bash
# View all logs
docker-compose logs

# Follow specific service
docker-compose logs -f fixin5mins

# Container logs
docker logs fixin5mins-app
```

### Resource Usage
```bash
# Monitor resource usage
docker stats

# Container resource limits
docker inspect fixin5mins-app | grep -A 10 Resources
```

## Troubleshooting

### Common Issues

#### 1. Puppeteer/Chrome Issues
```bash
# Check Chrome installation
docker exec fixin5mins-app chromium-browser --version

# Test Puppeteer
docker exec fixin5mins-app node -e "
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium-browser',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  console.log('Puppeteer working!');
  await browser.close();
})();
"
```

#### 2. Font/Emoji Issues
```bash
# Check font installation
docker exec fixin5mins-app fc-list | grep -i emoji

# Test emoji rendering
docker exec fixin5mins-app node -e "console.log('🎉 Emoji test 🚀');"
```

#### 3. Permission Issues
```bash
# Check file permissions
docker exec fixin5mins-app ls -la /app/generated /app/logs

# Fix permissions
docker exec fixin5mins-app chown -R nextjs:nodejs /app/generated /app/logs
```

#### 4. Environment Variables
```bash
# Check environment variables
docker exec fixin5mins-app env | grep -E "(INSTAGRAM|CLOUDINARY|OPENROUTER)"

# Validate .env file
docker run --rm --env-file .env alpine env
```

### Performance Optimization

#### 1. Image Size
- Multi-stage build reduces final image size
- Alpine Linux base for minimal footprint
- Production dependencies only in final stage

#### 2. Build Cache
```bash
# Use BuildKit for better caching
DOCKER_BUILDKIT=1 docker build -t fixin5mins:latest .

# Build with cache mount
docker build --mount=type=cache,target=/app/node_modules -t fixin5mins:latest .
```

#### 3. Resource Limits
Add to docker-compose.yml:
```yaml
services:
  fixin5mins:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
```

## Security Considerations

### 1. Non-Root User
- Application runs as `nextjs` user (UID 1001)
- No root privileges inside container

### 2. Environment Variables
- Never include `.env` in Docker images
- Use Docker secrets for sensitive data in production
- Mount `.env` as read-only volume

### 3. Network Security
- Services communicate through internal network
- Only necessary ports exposed to host

### 4. Image Security
```bash
# Scan image for vulnerabilities
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  -v $(pwd):/src anchore/syft:latest \
  packages dir:/src

# Use specific base image versions
# Update regularly for security patches
```

## Production Deployment

### 1. Using Docker Swarm
```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml fixin5mins

# Scale services
docker service scale fixin5mins_fixin5mins=3
```

### 2. Using Kubernetes
See `k8s/` directory for Kubernetes manifests (if provided separately).

### 3. CI/CD Integration
```bash
# Build and push to registry
docker build -t your-registry/fixin5mins:latest .
docker push your-registry/fixin5mins:latest

# Deploy from registry
docker run -d --env-file .env your-registry/fixin5mins:latest
```

## Development Workflow

### 1. Hot Reload Development
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up

# Rebuild on changes
docker-compose -f docker-compose.dev.yml build
```

### 2. Testing
```bash
# Run tests in container
docker run --rm -v $(pwd):/app -w /app node:18-alpine npm test

# Interactive shell
docker exec -it fixin5mins-app sh
```

### 3. Debugging
```bash
# Enable debug mode
docker run -e DEBUG=* --env-file .env fixin5mins:latest

# Attach debugger (port 9229 exposed in dev compose)
```

For more information, see the main project README and memory bank documentation. 