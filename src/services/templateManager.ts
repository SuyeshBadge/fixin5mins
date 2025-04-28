import fs from 'fs';
import path from 'path';
import ejs from 'ejs';
import { promisify } from 'util';
import { templateConfig, Template, TemplateConfig } from '../config/templateConfig';

const readFile = promisify(fs.readFile);
const TEMPLATES_DIR = path.join(process.cwd(), 'src', 'templates');

export interface TemplateRenderOptions {
  templateId: string;
  variables: Record<string, any>;
}

export class TemplateManager {
  private config: TemplateConfig;
  
  constructor(config: TemplateConfig = templateConfig) {
    this.config = config;
  }
  
  /**
   * Get template by ID
   */
  getTemplate(templateId: string): Template | null {
    return this.config[templateId] || null;
  }
  
  /**
   * Get all available templates
   */
  getAllTemplates(): Template[] {
    return Object.values(this.config);
  }
  
  /**
   * Get templates by type
   */
  getTemplatesByType(type: string): Template[] {
    return this.getAllTemplates().filter(template => template.type === type);
  }
  
  /**
   * Get a random template of a specific type
   */
  getRandomTemplateByType(type: string): Template | null {
    const templates = this.getTemplatesByType(type);
    if (templates.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * templates.length);
    return templates[randomIndex];
  }
  
  /**
   * Get the file path for a template file
   */
  getTemplatePath(templateId: string, fileName: string): string {
    return path.join(TEMPLATES_DIR, templateId, fileName);
  }
  
  /**
   * Read a template file
   */
  async readTemplateFile(templateId: string, fileName: string): Promise<string> {
    try {
      const filePath = this.getTemplatePath(templateId, fileName);
      return await readFile(filePath, 'utf8');
    } catch (error) {
      console.error(`Error reading template file ${fileName} for template ${templateId}:`, error);
      throw error;
    }
  }
  
  /**
   * Load all files for a template
   */
  async loadTemplateFiles(templateId: string): Promise<Record<string, string>> {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template with ID ${templateId} not found`);
    }
    
    const files: Record<string, string> = {};
    for (const file of template.files) {
      try {
        if (file.fileName.endsWith('.ejs') || file.fileName.endsWith('.css')) {
          files[file.variableMapping] = await this.readTemplateFile(templateId, file.fileName);
        } else {
          // For non-text files like images, just store the file path
          files[file.variableMapping] = this.getTemplatePath(templateId, file.fileName);
        }
      } catch (error) {
        console.error(`Error loading file ${file.fileName} for template ${templateId}:`, error);
        throw error;
      }
    }
    
    return files;
  }
  
  /**
   * Render a template with the provided variables
   */
  async renderTemplate(options: TemplateRenderOptions): Promise<string> {
    const { templateId, variables } = options;
    const template = this.getTemplate(templateId);
    
    if (!template) {
      throw new Error(`Template with ID ${templateId} not found`);
    }
    
    // Merge default variables with provided variables
    const mergedVariables = {
      ...template.defaultVariables,
      ...variables
    };
    
    // Load template files
    const files = await this.loadTemplateFiles(templateId);
    
    // Find the main EJS template
    const mainTemplate = template.files.find(f => f.fileName.endsWith('.ejs') && f.variableMapping.includes('Template'));
    
    if (!mainTemplate) {
      throw new Error(`No main EJS template found for template ${templateId}`);
    }
    
    // Get the template content
    const templateContent = files[mainTemplate.variableMapping];
    
    // Add files to variables
    const renderVariables = {
      ...mergedVariables,
      ...files
    };
    
    // Render the template
    try {
      return ejs.render(templateContent, renderVariables);
    } catch (error) {
      console.error(`Error rendering template ${templateId}:`, error);
      throw error;
    }
  }
}

export default new TemplateManager(); 