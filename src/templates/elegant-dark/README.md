# Elegant Dark Template

A sophisticated Instagram post template featuring a dark background, premium typography (Playfair Display, Montserrat, Satisfy), rich accent colors, and clean spacing. Ideal for quotes, insightful messages, or announcements requiring a touch of elegance.

## Variables

| Variable        | Type   | Description                                                                 | Example                                        |
|-----------------|--------|-----------------------------------------------------------------------------|------------------------------------------------|
| `mainHeading`   | string | The primary heading text.                                                   | "Discover Your Inner Strength"                 |
| `subHeading`    | string | Optional. Secondary text, smaller than the main heading.                    | "A Journey of a Thousand Miles"                |
| `bodyText`      | string | The main content, such as a quote or paragraph.                             | "The only way to do great work is to love what you do." |
| `accentText`    | string | Optional. A small piece of text for emphasis, like an author or a category. | "- Steve Jobs" or "Profound Thoughts"          |
| `handle`        | string | The Instagram handle (without '@').                                         | "fixin5mins"                                   |
| `date`          | string | Optional. A date to display.                                                | "October 2023"                                 |

## Example Usage

```javascript
// Assuming templateManager is an instance of TemplateManager
// const imageHtml = await templateManager.renderTemplate({
//   templateId: "elegant-dark",
//   variables: {
//     mainHeading: "Embrace the Night",
//     subHeading: "Stars Can't Shine Without Darkness",
//     bodyText: "Let the quiet of the night inspire dreams that illuminate your path.",
//     accentText: "Nocturnal Wisdom",
//     handle: "YourBrand",
//     date: "Dec 2023"
//   }
// });
```

## Design Notes

Ensure sufficient contrast between text and background colors for optimal readability. The template is designed for a 1:1 aspect ratio (1080x1080px). 