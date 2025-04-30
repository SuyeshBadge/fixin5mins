# Motivation Accent Template

A clean, modern motivational template featuring an accent-highlighted design with a warm cream background and striking typography. This template is perfect for motivational quotes and action-oriented content.

## Design Features

- Clean cream/beige background
- Bold sans-serif typography
- First word of emotional hook highlighted in gray box
- First word of action step highlighted in orange box
- Accent elements (orange dot, black dots, arrow)
- Responsive text sizing for different content lengths

## Variables

| Variable | Type | Description | Default |
|----------|------|-------------|---------|
| `handle` | string | Instagram handle (displayed in header without @) | Required |
| `emotionalHook` | string | First part of motivational text (first word will be highlighted in gray) | Required |
| `actionStep` | string | Second part of motivational text (first word will be highlighted in orange) | Required |
| `emotionalReward` | string | Additional benefit text shown below main text | Required |
| `date` | string | Optional date to display at bottom | Optional |

## Example Usage

```javascript
const image = await generateImage({
  templateId: 'motivation-accent',
  variables: {
    handle: 'fixin5mins',
    emotionalHook: 'Stop dreaming',
    actionStep: 'start doing',
    emotionalReward: 'Taking action is the fastest path to realizing your dreams.',
    date: 'September 2023'
  }
});
```

## Design Notes

- The template automatically highlights the first word of both the emotional hook and action step
- Text size automatically adjusts for longer content
- Best suited for short, impactful phrases (2-5 words each for emotional hook and action step)
- Emotionally engaging with high-contrast highlights for key action words 