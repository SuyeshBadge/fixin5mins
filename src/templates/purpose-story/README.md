# Purpose Story Template

A clean, modern template with strong typography for motivational messages and purpose-driven content. This template features a minimalist design with a light gradient background, bold text for impact, and clean branding.

## Design Features

- Minimalist design with gradient background
- Strong typography with "MOTIVATION" label
- Bold uppercase main message
- Clean branding area
- Social handle display
- Supports both standard and emotional content formats

## Content Formats

This template supports two content formats:

### 1. Standard Format (Original)

Uses a simple structure with a main message as the focal point.

| Variable | Description | Default |
|----------|-------------|---------|
| `topLabel` | Label text displayed at the top | "MOTIVATION" |
| `mainMessage` | Main message text (large and bold) | "LIVE YOUR PURPOSE!" |
| `brandName` | Primary brand name | "HANOVER" |
| `brandSubtitle` | Secondary brand text | "AND TYKE" |
| `handle` | Instagram handle (without @) | - |
| `date` | Date to display (optional) | - |

### 2. Emotional Content Format

Compatible with other templates in the system, using the three-part emotional structure.

| Variable | Description |
|----------|-------------|
| `emotionalHook` | Main headline text (replaces mainMessage) |
| `patternInterruptHook` | Alternative to emotionalHook |
| `actionStep` | Action-oriented follow-up text |
| `emotionalReward` | Description of the emotional benefit |
| `saveReason` | When provided, displays a "Save this!" indicator |

## Usage Examples

### Standard Format

```javascript
templateManager.renderTemplate({
  templateId: "purpose-story",
  variables: {
    topLabel: "INSPIRATION",
    mainMessage: "FOLLOW YOUR DREAMS",
    brandName: "CREATIVE",
    brandSubtitle: "STUDIOS",
    handle: "fixin5mins",
    date: "May 2023"
  }
});
```

### Emotional Format

```javascript
templateManager.renderTemplate({
  templateId: "purpose-story",
  variables: {
    topLabel: "MOTIVATION",
    emotionalHook: "COMMIT TO GROWTH",
    actionStep: "Set one small goal today",
    emotionalReward: "Small steps lead to tremendous journeys when taken with purpose and consistency.",
    brandName: "CREATIVE",
    brandSubtitle: "STUDIOS",
    handle: "fixin5mins",
    date: "May 2023",
    saveReason: true
  }
});
```

## Customization Tips

- The main message should be concise for maximum impact - preferably 1-3 words
- Use all caps for the main message to match the design
- Customize the top label to match the content theme
- If you have a longer message, reduce the font size by adding a CSS override
- The template automatically detects which content format to use based on provided variables
- Add `saveReason: true` to display the "Save this!" indicator 