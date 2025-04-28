# Red Quote Template

This template creates Instagram posts featuring motivational quotes with a clean, minimal design inspired by modern typography. It uses a cream/beige textured background with red accents, particularly suitable for inspirational/motivational content.

## Template Preview

When rendered, this template displays:
- A cream/beige textured background
- Large red quotation mark
- Main quote text in red
- Optional heading and date
- Handle name at the bottom

## Variables

This template accepts the following variables:

| Variable | Type   | Description                                | Default            |
|----------|--------|--------------------------------------------|-------------------|
| `quote`  | string | The main quote text (displayed in red)     | Required          |
| `handle` | string | The handle name (without @)                | Required          |
| `heading`| string | Optional heading text                      | null (not shown)  |
| `date`   | string | Optional date text                         | null (not shown)  |

## Example Usage

```javascript
const image = await generateImage({
  templateId: 'quote-red',
  variables: {
    quote: 'Wake up every day with the thought that something amazing is about to happen.',
    handle: 'REALLYGREATSITE',
    heading: 'Daily Inspiration',
    date: 'May 2023'
  }
});
```

## Design Notes

- The template is optimized for quotes of medium length (15-30 words)
- For longer quotes, the font size will remain the same but may take up more vertical space
- The cream background with subtle texture adds a premium feel while keeping the focus on the quote
- The red color (#e63a3a) provides high contrast and emotional impact 