#!/usr/bin/env node
import cron from 'node-cron';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import logger from '../utils/logger';
import { 
  MORNING_WINDOW, 
  EVENING_WINDOW,
  TimeWindow,
  generateRandomTimeInWindow,
  formatDateToCron,
  generateRandomTimeString,
  generateOptimalPostingTime,
  generateSpecificOptimalPostingTime,
  OPTIMAL_POSTING_TIMES
} from '../config/scheduleConfig';
import {
  selectNextTemplate,
  updateState,
  getState
} from '../utils/templateRotation';

/**
 * Path to the content generation script
 */
const CONTENT_GENERATION_SCRIPT = path.join(process.cwd(), 'src', 'jobs', 'generateAndPostContent.ts');

/**
 * Run the content generation script with the specified template
 * @param templateId ID of the template to use
 */
async function runContentGeneration(templateId: string): Promise<void> {
  logger.info(`Running content generation with template: ${templateId}`);
  
  try {
    // Record this post time and template
    await updateState({
      lastUsedTemplate: templateId,
      lastPostTime: new Date().toISOString()
    });
    
    // Run the script with the selected template
    const childProcess = spawn('ts-node', [
      CONTENT_GENERATION_SCRIPT,
      '--template', templateId
    ], {
      stdio: 'inherit',
      shell: true
    });
    
    return new Promise((resolve, reject) => {
      childProcess.on('close', (code) => {
        if (code === 0) {
          logger.info('Content generation completed successfully');
          resolve();
        } else {
          logger.error(`Content generation process exited with code ${code}`);
          reject(new Error(`Process exited with code ${code}`));
        }
      });
      
      childProcess.on('error', (error) => {
        logger.error('Failed to start content generation process', error);
        reject(error);
      });
    });
  } catch (error) {
    logger.error(`Error running content generation: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Helper function to get day name from day number
 */
function getDayName(dayOfWeek: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek];
}

/**
 * Schedule a post based on a specific optimal posting time for the given day
 * @param scheduleName Identifier for this schedule (e.g., 'optimal1')
 * @param timeIndex Index of the optimal time to use
 */
async function scheduleSpecificOptimalPost(scheduleName: string, timeIndex: number): Promise<void> {
  try {
    // Get the day of week (0-6, Sunday-Saturday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    
    // Generate a time based on the specific optimal time index for this day
    const scheduleTime = generateSpecificOptimalPostingTime(dayOfWeek, timeIndex);
    const cronExpression = formatDateToCron(scheduleTime);
    
    const optimalTime = OPTIMAL_POSTING_TIMES[dayOfWeek][timeIndex];
    const baseTimeString = `${optimalTime.hour}:${optimalTime.minute.toString().padStart(2, '0')}`;
    
    logger.info(`Scheduling ${scheduleName} post at ${scheduleTime.toLocaleTimeString()} (based on optimal time ${baseTimeString} for ${getDayName(dayOfWeek)})`);
    
    // Store the schedule in the state
    await updateState({
      [`next${scheduleName.charAt(0).toUpperCase() + scheduleName.slice(1)}Schedule`]: scheduleTime.toISOString()
    });
    
    // Schedule the job
    const job = cron.schedule(cronExpression, async () => {
      try {
        // Select a template that's different from the last used one
        const templateId = await selectNextTemplate();
        logger.info(`Selected template for ${scheduleName} post: ${templateId}`);
        
        // Run the content generation with the selected template
        await runContentGeneration(templateId);
        
        // If this is a one-time job, destroy it after completion
        job.stop();
        
      } catch (error) {
        logger.error(`Error in scheduled ${scheduleName} post: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
    
    logger.info(`Successfully scheduled ${scheduleName} post for ${scheduleTime.toLocaleTimeString()}`);
  } catch (error) {
    logger.error(`Failed to schedule ${scheduleName} post: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Schedule a post for a specific time window (legacy function)
 * @param window The time window to schedule within
 */
async function schedulePost(window: TimeWindow): Promise<void> {
  try {
    // Generate a random time within the window for today
    const scheduleTime = generateRandomTimeInWindow(window);
    const cronExpression = formatDateToCron(scheduleTime);
    
    logger.info(`Scheduling ${window.label} post at ${scheduleTime.toLocaleTimeString()}`);
    
    // Store the schedule in the state
    await updateState({
      [`next${window.label.charAt(0).toUpperCase() + window.label.slice(1)}Schedule`]: scheduleTime.toISOString()
    });
    
    // Schedule the job
    const job = cron.schedule(cronExpression, async () => {
      try {
        // Select a template that's different from the last used one
        const templateId = await selectNextTemplate();
        logger.info(`Selected template for ${window.label} post: ${templateId}`);
        
        // Run the content generation with the selected template
        await runContentGeneration(templateId);
        
        // If this is a one-time job, destroy it after completion
        job.stop();
        
      } catch (error) {
        logger.error(`Error in scheduled ${window.label} post: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
    
    logger.info(`Successfully scheduled ${window.label} post for ${scheduleTime.toLocaleTimeString()}`);
  } catch (error) {
    logger.error(`Failed to schedule ${window.label} post: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Schedule posts for today using optimal posting times
 */
async function scheduleTodaysOptimalPosts(): Promise<void> {
  logger.info('Scheduling today\'s posts using optimal posting times...');
  
  const now = new Date();
  const dayOfWeek = now.getDay();
  const optimalTimes = OPTIMAL_POSTING_TIMES[dayOfWeek];
  
  // Schedule each optimal time exactly once
  for (let i = 0; i < optimalTimes.length; i++) {
    await scheduleSpecificOptimalPost(`optimal${i + 1}`, i);
  }
  
  logger.info(`Today's ${optimalTimes.length} posts have been scheduled using optimal times for ${getDayName(dayOfWeek)}`);
}

/**
 * Schedule both morning and evening posts for today (legacy function)
 */
async function scheduleTodaysPosts(): Promise<void> {
  logger.info('Scheduling today\'s posts...');
  
  // Schedule morning post
  await schedulePost(MORNING_WINDOW);
  
  // Schedule evening post
  await schedulePost(EVENING_WINDOW);
  
  logger.info('Today\'s posts have been scheduled');
}

/**
 * Setup the daily scheduler that runs at midnight to schedule new random times
 */
function setupDailyScheduler(): void {
  logger.info('Setting up daily scheduler');
  
  // Run at midnight every day
  cron.schedule('0 0 * * *', async () => {
    logger.info('Midnight trigger: Scheduling posts for the new day');
    await scheduleTodaysOptimalPosts();
  });
  
  logger.info('Daily scheduler has been set up to run at midnight');
}

/**
 * Check if any posts should be scheduled for the current day
 * (in case the scheduler was started mid-day)
 */
async function checkAndScheduleForToday(): Promise<void> {
  // Always schedule posts when the script starts
  logger.info('Scheduling posts at startup...');
  await scheduleTodaysOptimalPosts();
}

/**
 * Main function to set up the daily posting scheduler
 */
async function main(): Promise<void> {
  try {
    logger.info('Starting daily post scheduler...');
    
    // Check and schedule for today if needed
    await checkAndScheduleForToday();
    
    // Set up the daily midnight scheduler
    setupDailyScheduler();
    
    logger.info('Daily post scheduler is running');
    logger.info('Posts will be scheduled at optimal times based on research for each day of the week');
    
    // Log optimal times for today
    const dayOfWeek = new Date().getDay();
    const optimalTimes = OPTIMAL_POSTING_TIMES[dayOfWeek];
    const dayName = getDayName(dayOfWeek);
    
    logger.info(`Today (${dayName}) optimal posting times:`);
    optimalTimes.forEach((time) => {
      logger.info(`- ${time.hour}:${time.minute.toString().padStart(2, '0')}`);
    });
    
    // Keep the process alive
    process.stdin.resume();
    
  } catch (error) {
    logger.error(`Error in daily post scheduler: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// Run the main function if this script is executed directly
if (require.main === module) {
  main().catch(error => {
    logger.error('Unhandled error in daily post scheduler:', error);
    process.exit(1);
  });
}

// Export for testing
export { main, schedulePost, scheduleSpecificOptimalPost, runContentGeneration }; 