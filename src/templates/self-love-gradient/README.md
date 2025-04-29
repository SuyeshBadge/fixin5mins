# Self-Love Gradient Template

This template creates Instagram posts featuring inspirational self-care quotes with a modern gradient design. It uses a soft gradient background transitioning from blue/lavender to pink/orange with elegant typography, creating a soothing yet striking visual effect perfect for self-care and personal growth content.

## Template Preview

When rendered, this template displays:
- A smooth gradient background
- "fix your life in 5 minutes" in the top left corner
- Date in the top right corner
- Handle name in a pill/button at the top center
- Main inspirational message in two parts:
  - Emotional hook in serif font
  - Action step in elegant script font
- Emotional reward message at the bottom

## Variables

This template accepts the following variables:

| Variable | Type | Description | Default |
|----------|------|-------------|---------|
| `emotionalHook` | string | The main heading text (in serif font) | Required |
| `actionStep` | string | The action text (displayed in script font) | Required |
| `emotionalReward` | string | The bottom message | Required |
| `handle` | string | The handle name (displayed in pill) | Required |
| `date` | string | Date to display in the top right | Current date if not provided |

## Example Usage

```javascript
const image = await generateImage({
  templateId: 'self-love-gradient',
  variables: {
    emotionalHook: 'YOU\'LL BLOOM',
    actionStep: 'if you take the time to water',
    emotionalReward: 'self love is the best love',
    handle: 'fixin5mins',
    date: 'June 2023'
  }
});
```

## Design Notes

- The template features a calming gradient background that creates a soothing atmosphere
- The typography combines elegant serif for the main heading with flowing script for the action step
- "The Young Serif" and "Burgues Script" inspired font choices create a premium, modern aesthetic
- The pill-shaped handle display adds a contemporary touch to the design
- The contrast between fonts creates visual interest and hierarchy 