#!/bin/bash

echo "🔍 Docker Container Debug Script"
echo "================================"

# Check if container is running
if ! docker ps | grep -q "instagram-scheduler"; then
    echo "❌ Container is not running. Starting it..."
    docker-compose up -d
    echo "⏳ Waiting for container to start..."
    sleep 10
fi

echo "📊 Container Status:"
docker ps | grep instagram-scheduler

echo ""
echo "🔧 Testing Puppeteer in container..."
docker exec -it instagram-scheduler node src/debug/test-puppeteer.js

echo ""
echo "📋 Container Logs (last 50 lines):"
docker logs --tail=50 instagram-scheduler

echo ""
echo "💾 Container Resource Usage:"
docker stats --no-stream instagram-scheduler

echo ""
echo "🔍 Chrome/Chromium Installation Check:"
docker exec instagram-scheduler which google-chrome || echo "❌ Google Chrome not found"
docker exec instagram-scheduler which chromium-browser || echo "❌ Chromium not found"

echo ""
echo "🌐 Environment Variables:"
docker exec instagram-scheduler printenv | grep -E "(PUPPETEER|CHROME|NODE)"

echo ""
echo "📁 File System Check:"
docker exec instagram-scheduler ls -la /usr/bin/google-chrome* || echo "❌ Chrome binary not found"
docker exec instagram-scheduler ls -la /app/

echo ""
echo "�� Debug complete!" 