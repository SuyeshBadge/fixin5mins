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
 * Optimal posting times for each day of the week based on research
 * Times are stored in 24-hour format
 */
export interface OptimalTime {
  hour: number;
  minute: number;
}

export interface DailyOptimalTimes {
  [day: number]: OptimalTime[];
}

/**
 * Optimal posting times for each day of the week
 * Day numbers are 0-6 (Sunday-Saturday)
 */
export const OPTIMAL_POSTING_TIMES: DailyOptimalTimes = {
  0: [ // Sunday
    { hour: 10, minute: 0 }, // 10am
    { hour: 19, minute: 0 }  // 7pm
  ],
  1: [ // Monday
    { hour: 15, minute: 0 }, // 3pm
    { hour: 17, minute: 0 }, // 5pm
    { hour: 19, minute: 0 }  // 7pm
  ],
  2: [ // Tuesday
    { hour: 16, minute: 0 }, // 4pm
    { hour: 18, minute: 0 }, // 6pm
    { hour: 19, minute: 0 }  // 7pm
  ],
  3: [ // Wednesday
    { hour: 14, minute: 0 }, // 2pm
    { hour: 17, minute: 0 }, // 5pm
    { hour: 20, minute: 0 }  // 8pm
  ],
  4: [ // Thursday
    { hour: 14, minute: 0 }, // 2pm
    { hour: 16, minute: 0 }, // 4pm
    { hour: 21, minute: 0 }  // 9pm
  ],
  5: [ // Friday
    { hour: 10, minute: 0 }, // 10am
    { hour: 13, minute: 0 }, // 1pm
    { hour: 15, minute: 0 }  // 3pm
  ],
  6: [ // Saturday
    { hour: 11, minute: 0 }, // 11am
    { hour: 14, minute: 0 }  // 2pm
  ]
};

// Maximum random variation in minutes to add or subtract from optimal times
export const MAX_TIME_VARIATION_MINUTES = 15;

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
 * Generates a random time based on the optimal posting times for the given day
 * with small random variation (±15 minutes)
 * @param dayOfWeek Day of week (0-6, Sunday-Saturday)
 * @returns Random time based on optimal posting times
 */
export function generateOptimalPostingTime(dayOfWeek: number): Date {
  const now = new Date();
  const optimalTimes = OPTIMAL_POSTING_TIMES[dayOfWeek];
  
  if (!optimalTimes || optimalTimes.length === 0) {
    throw new Error(`No optimal times configured for day ${dayOfWeek}`);
  }
  
  // Randomly select one of the optimal times for this day
  const randomIndex = Math.floor(Math.random() * optimalTimes.length);
  const selectedTime = optimalTimes[randomIndex];
  
  // Create date object for today with the selected time
  const date = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    selectedTime.hour,
    selectedTime.minute,
    0
  );
  
  // Add random variation (±MAX_TIME_VARIATION_MINUTES minutes)
  const randomVariation = Math.floor(Math.random() * (MAX_TIME_VARIATION_MINUTES * 2 + 1)) - MAX_TIME_VARIATION_MINUTES;
  date.setMinutes(date.getMinutes() + randomVariation);
  
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