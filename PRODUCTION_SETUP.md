# Production Setup Guide for FixIn5Mins

## 🎯 Overview
This guide covers the complete production deployment of the dockerized FixIn5Mins Instagram content generator.

## 📋 Prerequisites

### System Requirements
- **Docker Engine**: 20.10+
- **Docker Compose**: 2.0+
- **Memory**: Minimum 2GB RAM (4GB recommended)
- **Storage**: 10GB free space
- **Network**: Outbound HTTPS access

### API Keys Required
```bash
# Instagram/Facebook
INSTAGRAM_ACCESS_TOKEN=your_long_lived_token
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_account_id
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
FACEBOOK_PAGE_ID=your_page_id
INSTAGRAM_HANDLE=your_handle_without_@

# AI Service
OPENROUTER_API_KEY=your_openrouter_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 🚀 Quick Production Deployment

### 1. Prepare Environment
```bash
# Clone repository
git clone <repository-url>
cd fixin5mins

# Create .env file with your credentials
cp .env.example .env
# Edit .env with your actual values
```

### 2. Start Production Environment
```bash
# Build and start all services
npm run docker:prod

# Or manually:
docker-compose up -d --build
```

### 3. Verify Deployment
```bash
# Check service status
docker-compose ps

# Check health
npm run docker:health

# View logs
npm run docker:logs
```

## 🔧 Production Configuration

### Resource Limits
Current configuration includes:
- **Main App**: 1GB RAM, 0.5 CPU cores
- **Redis**: 512MB RAM, 0.25 CPU cores  
- **Scheduler**: 512MB RAM, 0.25 CPU cores

### Security Features
- ✅ Non-root user execution
- ✅ Read-only environment mounts
- ✅ Network isolation
- ✅ Resource limits
- ✅ Health monitoring

### Data Persistence
- **Generated Content**: `./generated` → `/app/generated`
- **Application Logs**: `./logs` → `/app/logs`
- **Redis Data**: Named volume `redis-data`

## 📊 Monitoring & Maintenance

### Health Checks
```bash
# Manual health check
npm run docker:health

# Check container status
docker-compose ps

# View health logs
tail -f logs/health.log
```

### Log Management
```bash
# View all logs
npm run docker:logs

# View specific service
npm run docker:logs-app
npm run docker:logs-scheduler

# Follow logs in real-time
docker-compose logs -f --tail=100
```

### Resource Monitoring
```bash
# Check resource usage
docker stats

# Check disk usage
docker system df

# Check container processes
docker-compose top
```

## 🔄 Maintenance Operations

### Updates & Rebuilds
```bash
# Rebuild without cache
npm run docker:rebuild

# Restart services
npm run docker:restart

# Update and restart
git pull
npm run docker:prod
```

### Backup Operations
```bash
# Backup generated content
tar -czf backup-content-$(date +%Y%m%d).tar.gz generated/ logs/

# Backup Redis data
docker run --rm -v fixin5mins_redis-data:/data -v $(pwd):/backup \
  alpine tar czf /backup/redis-backup-$(date +%Y%m%d).tar.gz -C /data .
```

### Cleanup Operations
```bash
# Clean containers and images
npm run docker:clean

# Remove everything including volumes
docker-compose down -v
docker system prune -a
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Check build context
ls -la src/

# Clean rebuild
docker-compose down
docker-compose build --no-cache
```

#### 2. Memory Issues
```bash
# Check memory usage
docker stats

# Increase Docker memory limit
# Edit docker-compose.yml resource limits
```

#### 3. Permission Issues
```bash
# Fix volume permissions
sudo chown -R 1001:1001 generated/ logs/

# Check container user
docker exec fixin5mins-app id
```

#### 4. Network Issues
```bash
# Check port conflicts
netstat -tulpn | grep :3000

# Reset network
docker network prune
```

### Debug Mode
```bash
# Access container shell
npm run docker:shell

# Run with debug output
docker-compose up --build

# Check environment variables
docker exec fixin5mins-app env | grep -E "(INSTAGRAM|CLOUDINARY)"
```

## 🔒 Security Best Practices

### Environment Variables
- Never commit `.env` files
- Use Docker secrets in production
- Rotate API keys regularly
- Monitor access logs

### Container Security
- ✅ Non-root user execution
- ✅ Resource limits enforced
- ✅ Network isolation enabled
- ✅ Read-only mounts where possible

### Network Security
```bash
# Only expose necessary ports
# Current: 3000 (health), 6379 (Redis)

# Use firewall rules
sudo ufw allow 3000/tcp
sudo ufw enable
```

## 📈 Scaling Considerations

### Horizontal Scaling
```bash
# Scale main application
docker-compose up -d --scale fixin5mins=3

# Load balancer configuration needed
# Use nginx or cloud load balancer
```

### Vertical Scaling
Edit `docker-compose.yml`:
```yaml
deploy:
  resources:
    limits:
      memory: 2G
      cpus: '1.0'
```

## 🚨 Production Alerts

### Set up monitoring for:
- Container health status
- Memory usage > 80%
- Disk space < 2GB
- Failed Instagram posts
- API rate limits

### Recommended Tools
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack or Loki
- **Alerts**: AlertManager or PagerDuty

## 📞 Support

### Getting Help
1. Check container logs: `npm run docker:logs`
2. Run health check: `npm run docker:health`
3. Review this guide's troubleshooting section
4. Check Docker and system resources

### Emergency Procedures
```bash
# Quick restart
npm run docker:restart

# Emergency stop
docker-compose down

# Complete reset
npm run docker:clean
```

---

**Note**: This setup is production-ready with security, monitoring, and scalability considerations. Always test in a staging environment before production deployment. 