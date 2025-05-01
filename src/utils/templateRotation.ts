import fs from 'fs';
import path from 'path';
import logger from './logger';

const STATE_FILE_PATH = path.join(process.cwd(), '.post-scheduler-state.json');

// Define template state interface
interface SchedulerState {
  lastUsedTemplate: string;
  lastPostTime: string;
  nextMorningSchedule: string | null;
  nextEveningSchedule: string | null;
}

// Default template list - will be populated dynamically when available
const AVAILABLE_TEMPLATES = [
  'motivation-accent',
  'quote-red',
  'self-love-gradient'
];

/**
 * Gets all available templates by reading the templates directory
 */
export async function getAvailableTemplates(): Promise<string[]> {
  try {
    const templatesDir = path.join(process.cwd(), 'src', 'templates');
    const templates = await fs.promises.readdir(templatesDir, { withFileTypes: true });
    
    // Only include directories
    return templates
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
  } catch (error) {
    logger.error(`Failed to read templates directory: ${error instanceof Error ? error.message : String(error)}`);
    // Fall back to default list
    return AVAILABLE_TEMPLATES;
  }
}

/**
 * Initializes the state file if it doesn't exist
 */
async function initializeStateFile(): Promise<SchedulerState> {
  const defaultState: SchedulerState = {
    lastUsedTemplate: '',
    lastPostTime: new Date().toISOString(),
    nextMorningSchedule: null,
    nextEveningSchedule: null
  };

  try {
    await fs.promises.writeFile(STATE_FILE_PATH, JSON.stringify(defaultState, null, 2));
    return defaultState;
  } catch (error) {
    logger.error(`Failed to initialize state file: ${error instanceof Error ? error.message : String(error)}`);
    return defaultState;
  }
}

/**
 * Reads the current state from the state file
 */
export async function getState(): Promise<SchedulerState> {
  try {
    // Check if the file exists
    try {
      await fs.promises.access(STATE_FILE_PATH);
    } catch {
      // File doesn't exist, create it
      return await initializeStateFile();
    }

    // Read the file
    const data = await fs.promises.readFile(STATE_FILE_PATH, 'utf-8');
    return JSON.parse(data) as SchedulerState;
  } catch (error) {
    logger.error(`Failed to read state file: ${error instanceof Error ? error.message : String(error)}`);
    return await initializeStateFile();
  }
}

/**
 * Updates the state file
 */
export async function updateState(state: Partial<SchedulerState>): Promise<void> {
  try {
    // Read current state
    const currentState = await getState();
    
    // Update with new values
    const newState: SchedulerState = {
      ...currentState,
      ...state
    };

    // Write back to file
    await fs.promises.writeFile(STATE_FILE_PATH, JSON.stringify(newState, null, 2));
  } catch (error) {
    logger.error(`Failed to update state file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Selects a template different from the last used one
 */
export async function selectNextTemplate(): Promise<string> {
  const templates = await getAvailableTemplates();
  
  if (templates.length === 0) {
    logger.warn('No templates found, using default "quote-red"');
    return 'quote-red';
  }
  
  if (templates.length === 1) {
    return templates[0];
  }
  
  const state = await getState();
  
  // Filter out the last used template, if any
  const availableTemplates = state.lastUsedTemplate
    ? templates.filter(t => t !== state.lastUsedTemplate)
    : templates;
  
  // Pick a random template from the filtered list
  const selectedIndex = Math.floor(Math.random() * availableTemplates.length);
  const selectedTemplate = availableTemplates[selectedIndex];
  
  // Update the state with the new template
  await updateState({ lastUsedTemplate: selectedTemplate });
  
  return selectedTemplate;
} 