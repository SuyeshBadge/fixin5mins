# Template Creation Guide

This guide explains how to create new templates for the content generation system. By following these instructions, you'll be able to create custom templates that integrate seamlessly with the existing system.

## Overview

The template system uses EJS (Embedded JavaScript) to generate HTML content for social media posts. Templates can include variables for customization and can be rendered with different content while maintaining consistent styling.

## Template Directory Structure

Templates are stored in the `src/templates` directory. Each template has its own subdirectory. A minimal template directory structure looks like:

```
src/templates/
  └── your-template-name/
      ├── template.ejs     (Required - Main template file)
      └── README.md        (Recommended - Documentation)
```

Additional files can include:
- CSS files for styling
- Image files (backgrounds, icons, etc.)
- Multiple EJS files for complex templates (like carousels)

## Step-by-Step Guide

### 1. Create Template Directory

Create a new directory in `src/templates` with a descriptive name. Use kebab-case (lowercase with hyphens) for the directory name.

```
mkdir src/templates/your-template-name
```

### 2. Create the Main Template File

Create a `template.ejs` file in your template directory. This file should contain HTML and embedded JavaScript for rendering your template.

Example structure of a basic template:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    /* Inline CSS for the template */
    body {
      margin: 0;
      padding: 0;
      width: 1080px;
      height: 1080px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: linear-gradient(45deg, #ff9966, #ff5e62);
      font-family: Arial, sans-serif;
      color: white;
      text-align: center;
    }
    
    .container {
      width: 90%;
      padding: 40px;
    }
    
    .quote {
      font-size: 48px;
      font-weight: bold;
      margin-bottom: 30px;
    }
    
    .author {
      font-size: 28px;
      font-style: italic;
    }
    
    .footer {
      position: absolute;
      bottom: 40px;
      font-size: 24px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="quote">
      <%= quote %>
    </div>
    <div class="author">
      - <%= author %>
    </div>
    <div class="footer">
      @<%= handle %>
    </div>
  </div>
</body>
</html>
```

### 3. Define Template Variables

Identify the variables your template will use. Common variables include:
- Text content (quotes, titles, descriptions)
- Styling options (colors, fonts, sizes)
- User information (handle, name)
- Date information

In the example above, the template uses three variables:
- `quote`: The main quote text
- `author`: The author of the quote
- `handle`: The Instagram handle

### 4. Create a README.md

Document your template by creating a README.md file that explains:
- Purpose of the template
- Required variables
- Customization options
- Example usage

### 5. Update Template Configuration

Add your template to the `templateConfig.ts` file in the `src/config` directory:

```typescript
"your-template-name": {
  id: "your-template-name",          // Same as folder name
  type: "quote",                     // Template type (quote, post, carousel)
  fileCount: 1,                      // Number of main EJS templates
  files: [
    { fileName: "template.ejs", variableMapping: "mainTemplate" },
    // Add any additional files here
  ],
  defaultVariables: {
    quote: "Your default quote text",
    author: "Default Author",
    handle: "yourhandle"
    // Add any other default variables
  }
}
```

### 6. Advanced Features

#### Adding Multiple Files

For templates with multiple files (CSS, images, etc.), add them to the `files` array in the template configuration:

```typescript
files: [
  { fileName: "template.ejs", variableMapping: "mainTemplate" },
  { fileName: "style.css", variableMapping: "styles" },
  { fileName: "background.jpg", variableMapping: "backgroundImage" }
]
```

#### Carousel Templates

For carousel templates (multiple slides), create separate EJS files for each panel and configure them:

```typescript
"carousel-template": {
  id: "carousel-template",
  type: "carousel",
  fileCount: 3,
  files: [
    { fileName: "panel1.ejs", variableMapping: "panel1Template" },
    { fileName: "panel2.ejs", variableMapping: "panel2Template" },
    { fileName: "panel3.ejs", variableMapping: "panel3Template" }
  ],
  defaultVariables: {
    // Variables for all panels
  }
}
```

## Template Types

The system supports several template types:

1. **quote**: For single quotes or short messages
2. **post**: For longer content posts
3. **carousel**: For multi-slide content

Choose the appropriate type for your template based on its purpose.

## Best Practices

1. **Responsive Design**: Make your templates adaptable to different content lengths
2. **Variable Defaults**: Provide sensible defaults for all variables
3. **Documentation**: Document all variables and special features
4. **Optimization**: Keep file sizes small for better performance
5. **Testing**: Test your template with various content to ensure it handles edge cases well

## Instagram Requirements

For Instagram posts, follow these guidelines:
- Use 1080×1080 pixels for square posts
- Use 1080×1920 pixels for stories
- Use 1080×1350 pixels for portrait posts
- Ensure text is legible on small screens
- Keep important content centered and away from edges

## Example: Creating a Gradient Quote Template

Here's a complete example of creating a new gradient quote template:

1. Create the directory:
```
mkdir src/templates/gradient-quote
```

2. Create template.ejs:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      margin: 0;
      padding: 0;
      width: 1080px;
      height: 1080px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, <%= gradientStart %>, <%= gradientEnd %>);
      font-family: Arial, sans-serif;
      color: white;
      text-align: center;
    }
    
    .container {
      width: 80%;
      padding: 40px;
    }
    
    .quote {
      font-size: <%= fontSize %>;
      font-weight: bold;
      margin-bottom: 30px;
      line-height: 1.3;
    }
    
    .author {
      font-size: 28px;
      font-style: italic;
      margin-bottom: 60px;
    }
    
    .footer {
      font-size: 24px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="quote">
      "<%= quote %>"
    </div>
    <div class="author">
      - <%= author %>
    </div>
    <div class="footer">
      @<%= handle %>
    </div>
  </div>
</body>
</html>
```

3. Update templateConfig.ts:
```typescript
"gradient-quote": {
  id: "gradient-quote",
  type: "quote",
  fileCount: 1,
  files: [
    { fileName: "template.ejs", variableMapping: "mainTemplate" }
  ],
  defaultVariables: {
    quote: "The only limit to our realization of tomorrow is our doubts of today",
    author: "Franklin D. Roosevelt",
    handle: "yourhandle",
    gradientStart: "#ff9966",
    gradientEnd: "#ff5e62",
    fontSize: "48px"
  }
}
```

4. Create README.md:
```markdown
# Gradient Quote Template

A simple, elegant template for quote posts with a customizable gradient background.

## Variables

- `quote`: The main quote text
- `author`: The author of the quote
- `handle`: Instagram handle
- `gradientStart`: Starting color for background gradient
- `gradientEnd`: Ending color for background gradient
- `fontSize`: Size of the quote text (default: "48px")

## Usage Example

```javascript
templateManager.renderTemplate({
  templateId: "gradient-quote",
  variables: {
    quote: "Life is what happens when you're busy making other plans.",
    author: "John Lennon",
    handle: "myhandle",
    gradientStart: "#4158D0",
    gradientEnd: "#C850C0"
  }
});
```

## Testing Your Template

After creating your template:

1. Update the template configuration in `src/config/templateConfig.ts`
2. Create a test script or use the application to render the template
3. Check the output to ensure it looks as expected
4. Test with different variable values to ensure it handles various content

## Troubleshooting

Common issues and solutions:

- **Template not found**: Ensure the template ID in configuration matches the directory name
- **Missing variables**: Check that all required variables are provided or have defaults
- **Rendering errors**: Look for syntax errors in your EJS template

If you encounter any other issues, check the console for error messages that might help identify the problem. 