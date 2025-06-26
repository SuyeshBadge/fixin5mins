# Project Brief: FixIn5Mins Instagram Content Generator

## Overview
An AI-powered Instagram content generator that automatically creates and schedules Instagram posts using templates and AI-generated content.

## Core Components
- **AI Content Generation**: Uses OpenAI API to generate engaging content
- **Template System**: EJS-based templates for different post types (quotes, carousels, etc.)
- **Image Generation**: Puppeteer-based HTML-to-image conversion for Instagram posts
- **Scheduling**: Automated daily post scheduling using node-cron
- **Instagram Integration**: Posts content to Instagram using their API
- **Docker Deployment**: Containerized application for easy deployment

## Current Issue
Puppeteer timeout errors occurring during image generation process:
- Error: `ProtocolError: Network.enable timed out`
- Happening in Docker container environment
- Using Alpine Linux with Chromium browser

## Technologies
- Node.js 18+ with TypeScript
- Puppeteer for browser automation
- EJS for templating
- OpenAI API for content generation
- Docker for containerization
- Instagram API for posting

## Architecture
- Service-based architecture with clear separation of concerns
- Template-based image generation pipeline
- Scheduled job execution for automation
- Logging and error handling throughout 