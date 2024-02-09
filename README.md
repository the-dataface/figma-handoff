# Design 🤝 Dev Handoff

Design to dev done right. A Figma plugin to turn design variabes + styles into Tailwind & POSTCSS.

## Features

- [x] Convert Figma variables + styles to Tailwind config variables
- [x] Convert Figma text styles to POSTCSS syntax with responsive media queries
- [x] Consolidate design + dev tokens into one source of truth, extensible by designers and developers

## Usage

1. Install the plugin from the Figma Community
2. Open the plugin from the Figma toolbar
3. Generate handoff files (.json and .postcss) from the plugin
4. Pass files to developers to integrate into their Tailwind config and Tailwind `@component` layers

## Text Styles

The plugin will convert Figma text styles to POSTCSS syntax with responsive media queries. The plugin will also generate a JSON file with the font sizes. The plugin is opinionated as to what gets converted to a class, so it's recommended to review the generated POSTCSS file and adjust as needed.

The POSTCSS file will work from the smallest breakpoint to the largest, assigning media queries using Tailwind's `screen` function as breakpoints appear. Properties are diffed to the base style and only novel properties are added to the media query.

```css
.body-1 {
  font-family: Inter;
  font-size: 16px;
  line-height: 24px;
  font-weight: 400;
  letter-spacing: 0.5px;

  @media screen(md) {
		font-size: 2.75rem;
	}

	@media screen(lg) {
		font-size: 3.5rem;
	}
}
```

### Naming Schema

The naming schema works so that we capture only the most important classes. For the sake of brevity, we only capture the default classes, defined as not having any variants or as being named the `default` variant.

`{viewport}/{style}/{variant}`

- `viewport` - The viewport size in Tailwind syntax (e.g. `sm`, `md`, `lg`, `xl`). This corresponds directly to the `Screens` variables, so a matching entry should exist in that variable collection.
- `style` - The Figma text style name, such as `display-1` or `body-3`. This is semantic and can be named anything, but it should be consistent across the design system. The styles for this should be the _default_ styles, as in the most common styles used in the design system for this type of text.
- `variant` - The variant of the style in semantic or property synax, such as `bold`, `italic`, `uppercase`, `lowercase`, `capitalize`, `normal`, `underline`, `line-through`, `no-underline`. This is optional and can be omitted if the style does not have a variant. NOTE: A `default` style _MUST_ be named here in order to be converted to POSTCSS (ex: `md/body-3/default`). 

## Variables

The plugin will convert Figma variables and effects styles to Tailwind config variables via a resulting JSON file matching the Tailwind configuration. The plugin is optimized to account for a few key properties such as `screens`, `spacing`, `backdropBlur`, `blur`, `borderRadius`, etc, which are numbers converted specially to corresponding formats. The ability to customize a properties format is in the works. Need it sooner? Open an issue and we can prioritize it.

_NOTE_ Library names *must* match the proper Tailwind config name in order to extend the configuration properly.

```json
{
  "colors": {
    "primary": "#FF0000",
    "secondary": "#00FF00",
    "tertiary": "#0000FF"
  },
  "spacing": {
    "1": "0.25rem",
    "2": "0.5rem",
    "3": "0.75rem"
  },
  "screens": {
    "sm": "640px",
    "md": "768px",
    "lg": "1024px",
    "xl": "1280px"
  }
}
```
