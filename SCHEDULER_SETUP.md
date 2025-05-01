# Instagram Posting Scheduler Setup

This guide explains how to set up the automatic Instagram posting scheduler for the fixin5mins project.

## Overview

The scheduler:
- Posts content twice daily at random times:
  - Once in the morning (between 6:00 AM - 11:00 AM)
  - Once in the evening (between 4:00 PM - 9:00 PM)
- Rotates between different templates to ensure visual variety
- Generates new random posting times each day at midnight

## Prerequisites

Before using the scheduler, ensure you have:

1. Set up your Instagram Business Account and Instagram Graph API
2. Added required credentials to your `.env` file:
   - `INSTAGRAM_ACCESS_TOKEN`
   - `INSTAGRAM_BUSINESS_ACCOUNT_ID`
   - Other required API credentials for content generation

## Quick Start

Run the scheduler directly with:

```bash
npm run schedule-posts
```

This will:
1. Generate random times for today's posts (if not already scheduled)
2. Set up a midnight job to schedule new random times for tomorrow
3. Keep running in the foreground, posting content at the scheduled times

## Production Setup with PM2

For production environments, use PM2 to manage the scheduler process:

1. Install PM2 globally (if not already installed):
   ```bash
   npm install pm2 -g
   ```

2. Start the scheduler with PM2:
   ```bash
   pm2 start npm --name "instagram-scheduler" -- run schedule-posts
   ```

3. Save the PM2 configuration:
   ```bash
   pm2 save
   ```

4. Set up PM2 to start on system boot:
   ```bash
   pm2 startup
   ```
   (Follow the instructions displayed after running this command)

## Monitoring

Check the status of the scheduler:

```bash
pm2 status
```

View logs:

```bash
pm2 logs instagram-scheduler
```

## Customization

To customize the scheduler's time windows, edit `src/config/scheduleConfig.ts`:

- `MORNING_WINDOW`: Modify the start and end hours for morning posts
- `EVENING_WINDOW`: Modify the start and end hours for evening posts

## Troubleshooting

If posts aren't being published:

1. Check the logs: `pm2 logs instagram-scheduler`
2. Verify your `.env` file has valid Instagram credentials
3. Make sure your Instagram Business Account is properly set up

If the scheduler stops working after a system restart:

1. Run `pm2 resurrect` to restore previously saved processes
2. Run `pm2 save` to update the saved process list
3. Check that PM2 startup is properly configured with `pm2 startup`

## Files

Key files in this feature:

- `src/jobs/dailyPostScheduler.ts`: Main scheduler implementation
- `src/utils/templateRotation.ts`: Template selection logic
- `src/config/scheduleConfig.ts`: Time window configuration
- `.post-scheduler-state.json`: Automatically created state file

For more details, see `memory-bank/features/auto-scheduler/README.md` 