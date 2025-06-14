/**
 * Template configuration file
 * Defines all available templates and their properties
 */

export interface TemplateFileMap {
  fileName: string;
  variableMapping: string; // Maps to EJS variable name
}

export interface Template {
  id: string;               // Unique ID (same as folder name)
  type: string;             // Type of template (post, quote, carousel)
  fileCount: number;        // Number of EJS template files
  files: TemplateFileMap[]; // Files and their variable mappings
  defaultVariables?: any;   // Default values for template variables
  contentMapping?: { [key: string]: string }; // Optional: Maps EJS vars to content source keys
}

export interface TemplateConfig {
  [templateId: string]: Template;
}

export const templateConfig: TemplateConfig = {
  "quote-basic": {
    id: "quote-basic",
    type: "quote",
    fileCount: 1,
    files: [
      { fileName: "template.ejs", variableMapping: "mainTemplate" },
      { fileName: "background.png", variableMapping: "backgroundImage" }
    ],
    defaultVariables: {
      quoteColor: "#ffffff",
      authorColor: "#cccccc",
      fontSize: "36px",
      backgroundColor: "#1da1f2"
    }
  },
  "quote-red": {
    id: "quote-red",
    type: "quote",
    fileCount: 1,
    files: [
      { fileName: "template.ejs", variableMapping: "mainTemplate" }
    ],
    defaultVariables: {
      quote: "Your inspirational quote here",
      handle: "YOURHANDLE",
      heading: "",
      date: ""
    }
  },
  "self-love-gradient": {
    id: "self-love-gradient",
    type: "quote",
    fileCount: 1,
    files: [
      { fileName: "template.ejs", variableMapping: "mainTemplate" }
    ],
    defaultVariables: {
      emotionalHook: "YOU'LL BLOOM",
      actionStep: "if you take the time to water",
      emotionalReward: "self love is the best love",
      handle: "fixin5mins",
      date: ""
    },
    contentMapping: {
      emotionalHook: "emotionalHook",
      actionStep: "actionStep",
      emotionalReward: "emotionalReward"
      // caption and hashtags are handled by the job script, not direct template vars here
    }
  },
  "motivation-accent": {
    id: "motivation-accent",
    type: "quote",
    fileCount: 1,
    files: [
      { fileName: "template.ejs", variableMapping: "mainTemplate" }
    ],
    defaultVariables: {
      emotionalHook: "Stop dreaming",
      actionStep: "start doing",
      emotionalReward: "Taking action is the fastest path to realizing your dreams.",
      handle: "fixin5mins",
      date: ""
    }
  },
  "purpose-story": {
    id: "purpose-story",
    type: "quote",
    fileCount: 1,
    files: [
      { fileName: "template.ejs", variableMapping: "mainTemplate" }
    ],
    defaultVariables: {
      topLabel: "MOTIVATION",
      mainMessage: "LIVE YOUR PURPOSE!",
      brandName: "HANOVER",
      brandSubtitle: "AND TYKE",
      handle: "fixin5mins"
    }
  },
  "post-gradient": {
    id: "post-gradient",
    type: "post",
    fileCount: 1,
    files: [
      { fileName: "template.ejs", variableMapping: "mainTemplate" },
      { fileName: "background.png", variableMapping: "backgroundImage" },
      { fileName: "style.css", variableMapping: "styles" }
    ],
    defaultVariables: {
      titleColor: "#ffffff",
      contentColor: "#ffffff",
      titleSize: "72px",
      contentSize: "36px"
    }
  },
  "carousel-3panel": {
    id: "carousel-3panel",
    type: "carousel",
    fileCount: 3,
    files: [
      { fileName: "panel1.ejs", variableMapping: "panel1Template" },
      { fileName: "panel2.ejs", variableMapping: "panel2Template" },
      { fileName: "panel3.ejs", variableMapping: "panel3Template" },
      { fileName: "background.jpg", variableMapping: "backgroundImage" }
    ],
    defaultVariables: {
      titleColor: "#ffffff",
      contentColor: "#eeeeee",
      backgroundColor: "#333333"
    }
  },
  "fixin5mins-post": {
    id: "fixin5mins-post",
    type: "post",
    fileCount: 1,
    files: [
      { fileName: "template.ejs", variableMapping: "mainTemplate" },
      { fileName: "style.css", variableMapping: "styles" },
      { fileName: "background.svg", variableMapping: "backgroundImage" }
    ],
    defaultVariables: {
      postType: "single-tip",
      emotionalHook: "Feeling overwhelmed?",
      actionStep: "Spend 5 minutes today closing tabs you don't need.",
      emotionalReward: "Watch how much lighter your mind feels.",
      title: "Today's 5-Minute Fix",
      checklistItems: [
        "Take 3 deep breaths",
        "Close 5 browser tabs",
        "Put away one item on your desk"
      ],
      totalSlides: 3
    }
  },
  "elegant-dark": {
    id: "elegant-dark",
    type: "quote", // This type seems most fitting for the described aesthetic
    fileCount: 1,
    files: [
      { fileName: "template.ejs", variableMapping: "mainTemplate" }
    ],
    defaultVariables: {
      mainHeading: "Timeless Wisdom",
      subHeading: "Reflections for the Soul",
      bodyText: "Elegance is not about being noticed, it's about being remembered.",
      accentText: "Ancient Proverb",
      handle: "fixin5mins",
      date: "" // Default to empty; can be dynamically set or omitted by user
    },
    contentMapping: {
      mainHeading: "emotionalHook",   // Map to emotionalHook from generated content
      subHeading: "actionStep",      // Map to actionStep
      bodyText: "emotionalReward", // Map to emotionalReward
      accentText: "topic"            // Use the current topic for accentText
    }
  }
}; 