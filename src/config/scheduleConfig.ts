/**
 * Configuration for daily posting schedule
 */

export interface TimeWindow {
  startHour: number;
  endHour: number;
  label: string;
}

/**
 * Morning posting window (6:00 AM - 11:00 AM)
 */
export const MORNING_WINDOW: TimeWindow = {
  startHour: 6,
  endHour: 11,
  label: 'morning'
};

/**
 * Evening posting window (4:00 PM - 9:00 PM)
 */
export const EVENING_WINDOW: TimeWindow = {
  startHour: 16, // 4:00 PM in 24-hour format
  endHour: 21,   // 9:00 PM in 24-hour format
  label: 'evening'
};

/**
 * Generate a random time within a specified window
 * @param window Time window to generate within
 * @returns ISO string of the randomly generated time for today
 */
export function generateRandomTimeInWindow(window: TimeWindow): Date {
  const now = new Date();
  
  // Create a date for today at the start hour
  const date = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    window.startHour,
    0,
    0
  );
  
  // Calculate window size in minutes
  const windowSizeMinutes = (window.endHour - window.startHour) * 60;
  
  // Generate random minutes within the window
  const randomMinutes = Math.floor(Math.random() * windowSizeMinutes);
  
  // Add the random minutes to the start time
  date.setMinutes(randomMinutes);
  
  return date;
}

/**
 * Generates a random hour and minute combination within a time window
 * Returns in format HH:MM
 */
export function generateRandomTimeString(window: TimeWindow): string {
  const date = generateRandomTimeInWindow(window);
  
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return `${hours}:${minutes}`;
}

/**
 * Check if the current time is within a time window
 */
export function isTimeInWindow(date: Date, window: TimeWindow): boolean {
  const hour = date.getHours();
  return hour >= window.startHour && hour < window.endHour;
}

/**
 * Format date to cron expression for scheduling
 * @param date Date object
 * @returns Cron expression for the specific time
 */
export function formatDateToCron(date: Date): string {
  const minutes = date.getMinutes();
  const hours = date.getHours();
  
  // cron format: minute hour * * *
  return `${minutes} ${hours} * * *`;
} 