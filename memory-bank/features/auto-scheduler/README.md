# Instagram Auto-Scheduler

This feature automatically schedules Instagram posts twice daily with randomly generated posting times and rotating templates.

## Features

- Posts automatically twice per day - once in the morning and once in the evening
- Random posting times that change daily:
  - Morning: Between 6:00 AM and 11:00 AM
  - Evening: Between 4:00 PM and 9:00 PM
- Automatically rotates between templates to avoid repetition
- Maintains state between runs
- Reschedules automatically at midnight each day

## Usage

### Running Manually

To start the scheduler:

```bash
npm run schedule-posts
```

This will:
1. Schedule two posts for the current day (if not already scheduled)
2. Set up automatic scheduling for future days
3. The scheduler will remain running and execute posts at the scheduled times

### Running with PM2 (Recommended for Production)

To ensure the scheduler stays running even after system restarts:

1. Install PM2 globally if you haven't already:
```bash
npm install pm2 -g
```

2. Start the scheduler with PM2:
```bash
pm2 start npm --name "instagram-scheduler" -- run schedule-posts
```

3. Save the PM2 configuration so it restarts automatically:
```bash
pm2 save
```

4. Set up PM2 to start on system boot:
```bash
pm2 startup
```

### Configuration

The scheduler's time windows can be adjusted in `src/config/scheduleConfig.ts`:

- `MORNING_WINDOW`: Configures the morning time range (default: 6:00 AM - 11:00 AM)
- `EVENING_WINDOW`: Configures the evening time range (default: 4:00 PM - 9:00 PM)

### How It Works

1. The scheduler generates random posting times within the configured windows
2. At the scheduled time, it:
   - Selects a template that differs from the last used one
   - Runs the content generation script with the selected template
   - Posts the content to Instagram
3. At midnight each day, new random times are generated for the next day

### State Persistence

The scheduler maintains state in a file called `.post-scheduler-state.json`, which includes:
- The last used template
- The last post timestamp
- The next scheduled morning and evening post times

## Troubleshooting

If posts aren't being published:

1. Check the logs with `pm2 logs instagram-scheduler`
2. Verify Instagram credentials in your `.env` file
3. Ensure the script has permissions to execute and access the internet 