# Active Context: Puppeteer Timeout Issue

## Current Problem
The application is experiencing Puppeteer timeout errors during image generation:

```
ProtocolError: Network.enable timed out. Increase the 'protocolTimeout' setting in launch/connect calls for a higher timeout if needed.
```

## Root Cause Analysis
1. **Default Timeout Too Low**: Puppeteer's default protocol timeout (30s) may be insufficient in Docker environment
2. **Docker Environment**: Alpine Linux + Chromium setup may have slower initialization
3. **Resource Constraints**: Container may have limited resources affecting browser startup
4. **Network Configuration**: Docker networking may add latency to browser protocol communication

## Current Configuration
- Using Puppeteer 24.6.1
- Running in Docker with Node 18 Alpine
- Chromium browser installed via apk
- Current timeout settings: 30s for page loading, no protocol timeout set

## Impact
- Image generation fails completely
- Instagram posts cannot be created
- Scheduled jobs fail

## Implemented Solutions
✅ **Protocol Timeout**: Added 60-second timeout to Puppeteer launch options
✅ **Retry Logic**: Implemented exponential backoff retry mechanism (3 attempts)
✅ **Docker Optimization**: Enhanced Chromium flags for container environment
✅ **Resource Management**: Added memory/CPU limits and shared memory size
✅ **Error Handling**: Improved error reporting and validation

## Changes Made
1. **html2image-puppeteer.ts**: Added protocol timeout, retry logic, optimized Chromium flags
2. **docker-compose.yml**: Added resource limits and shared memory configuration
3. **imageGenerator.ts**: Enhanced error handling for template rendering

## Expected Results
- Eliminates `ProtocolError: Network.enable timed out` errors
- More reliable browser initialization in Docker
- Better error recovery and logging
- Improved resource utilization 