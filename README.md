# @rentnerkev/picker

A controlled and accessible React color picker with presets, native form validation, localization, and Tailwind CSS styling.

## Requirements

Use React 19 with React DOM 19, an ESM-capable build, and Tailwind CSS 4 for
the documented styling. Import this package's `tailwind.css` entry into your
Tailwind stylesheet. It uses `@source` for published classes and `@theme` for
global tokens such as `--color-primary`. Check for token name collisions with
your app and override them in a later `@theme` block if needed.

In a React Server Components app, import and render the picker from a module
beginning with `'use client'`; define its state and callbacks there. See the
[Tailwind directives](https://tailwindcss.com/docs/functions-and-directives)
and [React client boundary](https://react.dev/reference/rsc/use-client) guides.

## Installation

Install the package with npm:

```bash
npm install @rentnerkev/picker
```

Or with Bun:

```bash
bun add @rentnerkev/picker
```

## Quick start

```tsx
import { CustomColorPicker } from '@rentnerkev/picker'
import { useState } from 'react'

export function BrandColorPicker() {
    const [color, setColor] = useState('#13ecd6')
    const [isColorValid, setIsColorValid] = useState(true)

    return (
        <div>
            <CustomColorPicker
                id="brand-color"
                name="brandColor"
                label="Brand color"
                value={color}
                onValueChange={setColor}
                onValidityChange={setIsColorValid}
                locale="en"
                required
            />
            <p aria-live="polite">
                {isColorValid ? 'Valid color' : 'Invalid color'}
            </p>
        </div>
    )
}
```

`onValueChange` receives valid, normalized colors, plus an empty string when an optional input is cleared. An invalid non-empty draft never overwrites the controlled value or native form value. `onValidityChange` reports the initial validity and then fires only when validity changes. It includes `required` and controlled external errors; disabled fields are valid because browsers exclude them from form submission.

## Color utilities

The public color helpers normalize and validate supported values without relying on the component:

```ts
import { hexToRgb, isValidColor, normalizeColor } from '@rentnerkev/picker'

normalizeColor('AbC') // '#aabbcc'
normalizeColor('rgb(19, 236, 214)') // '#13ecd6'
normalizeColor('invalid') // null

isValidColor('#13ecd6') // true
hexToRgb('#13ecd6') // { red: 19, green: 236, blue: 214 }
```

The parser accepts three- and six-digit HEX values with an optional `#`, plus `rgb(r, g, b)` values with channels from 0 to 255. Alpha and percentage formats are rejected instead of being partially interpreted. `normalizeColor` returns a lowercase six-digit HEX value or `null`.

## Localization

German messages remain the default for backward compatibility. Set `locale="en"` for the complete English catalog, or override individual messages with a typed `Partial<PickerMessages>`. The catalog and resolver are available as `pickerMessageCatalog` and `resolvePickerMessages`.

```tsx
import { CustomColorPicker, type PickerMessages } from '@rentnerkev/picker'
import { useState } from 'react'

const messages: Partial<PickerMessages> = {
    invalidColor: 'Please enter a HEX or RGB color',
    selectColor: 'Choose a color',
    presetColor: (color) => `Use ${color}`,
}

export function LocalizedPicker() {
    const [color, setColor] = useState('#13ecd6')

    return (
        <CustomColorPicker
            value={color}
            onValueChange={setColor}
            locale="en"
            messages={messages}
        />
    )
}
```

## Forms and accessibility

The visible trigger supports labels, descriptions, controlled external errors, native validation, forwarded `aria-*` attributes, and focus control. A string passed to `error` overrides internal validation; `error={null}` explicitly clears external and native errors. Invalid form submission focuses the visible trigger.

Disabled pickers are excluded from form submission. Read-only pickers prevent changes while retaining their submitted value.

```tsx
import { useRef, useState } from 'react'
import { CustomColorPicker } from '@rentnerkev/picker'

export function AccessiblePicker() {
    const [color, setColor] = useState('#13ecd6')
    const triggerRef = useRef<HTMLButtonElement>(null)

    return (
        <CustomColorPicker
            id="accent-color"
            name="accentColor"
            value={color}
            onValueChange={setColor}
            label="Accent color"
            description="Used for buttons and highlighted content."
            triggerRef={triggerRef}
            locale="en"
        />
    )
}
```

## API

### `CustomColorPicker` props

| Prop               | Type                         | Default         | Description                                             |
| ------------------ | ---------------------------- | --------------- | ------------------------------------------------------- |
| `id`               | `string`                     | generated       | Unique ID for the visible trigger.                      |
| `name`             | `string`                     | -               | Native form field name.                                 |
| `value`            | `string`                     | -               | Controlled HEX or RGB color.                            |
| `onValueChange`    | `(value: string) => void`    | -               | Receives normalized colors or an optional empty value.  |
| `onValidityChange` | `(isValid: boolean) => void` | -               | Reports initial validity and subsequent changes.        |
| `required`         | `boolean`                    | `false`         | Enables required-field validation.                      |
| `disabled`         | `boolean`                    | `false`         | Disables the input, picker, presets, and validation.    |
| `readOnly`         | `boolean`                    | `false`         | Prevents changes while retaining the form value.        |
| `label`            | `ReactNode`                  | -               | Visible field label.                                    |
| `description`      | `ReactNode`                  | -               | Supporting text linked through ARIA.                    |
| `error`            | `string \| null`             | `undefined`     | Controlled external validation message.                 |
| `triggerRef`       | `Ref<HTMLButtonElement>`     | -               | Ref for the visible, focusable trigger.                 |
| `aria-*`           | `string`                     | -               | Additional accessible names and description references. |
| `placeholder`      | `string`                     | `#13ecd6`       | Text-field placeholder.                                 |
| `format`           | `'hex' \| 'rgb'`             | `'hex'`         | Output format for new values.                           |
| `presets`          | `string[]`                   | built-in colors | Colors offered for quick selection.                     |
| `showInput`        | `boolean`                    | `true`          | Shows the text input beside the preview.                |
| `showPresets`      | `boolean`                    | `true`          | Shows preset colors below the input.                    |
| `icon`             | `ReactNode`                  | `Palette`       | Icon rendered at the start of the trigger.              |
| `className`        | `string`                     | `w-full`        | Additional Tailwind classes for the outer container.    |
| `customDesign`     | `CustomColorPickerDesign`    | -               | Tailwind class overrides for individual visual parts.   |
| `locale`           | `'de' \| 'en'`               | `'de'`          | Selects the default message catalog.                    |
| `messages`         | `Partial<PickerMessages>`    | -               | Overrides individual messages and ARIA text.            |

## Keyboard interaction

Opening the picker focuses the color area. It supports:

| Key                          | Behavior                                               |
| ---------------------------- | ------------------------------------------------------ |
| `Arrow Left` / `Arrow Right` | Decrease or increase saturation by one step.           |
| `Arrow Up` / `Arrow Down`    | Increase or decrease brightness by one step.           |
| `Shift` + an arrow key       | Apply the corresponding change in ten-step increments. |
| `Page Up` / `Page Down`      | Change brightness by ten steps.                        |
| `Home` / `End`               | Set minimum or maximum saturation.                     |
| `Escape`                     | Close the picker and return focus to the trigger.      |

The hue control also supports the native keyboard behavior of an HTML range input in one-step increments.

## Tailwind CSS

Import the package entry after Tailwind CSS in your application stylesheet:

```css
@import 'tailwindcss';
@import '@rentnerkev/picker/tailwind.css';
```

The package entry scans only the published JavaScript under `dist` and provides the shared theme tokens `primary`, `primary-hover`, `background-dark`, `surface-dark`, `input-dark`, `border-dark`, `secondary-text`, and `muted-foreground`. Override them with a later `@theme` block when needed.

## Public entry points

| Entry point                       | Purpose                                               |
| --------------------------------- | ----------------------------------------------------- |
| `@rentnerkev/picker`              | Component, color helpers, messages, and public types. |
| `@rentnerkev/picker/picker`       | `CustomColorPicker` component module.                 |
| `@rentnerkev/picker/color`        | Color parsing, conversion, and formatting helpers.    |
| `@rentnerkev/picker/messages`     | Locale catalog, resolver, and message types.          |
| `@rentnerkev/picker/types`        | Component, design, and color types.                   |
| `@rentnerkev/picker/tailwind.css` | Tailwind source and shared theme tokens.              |
| `@rentnerkev/picker/package.json` | Package metadata.                                     |

## Development

```bash
bun install
bun run verify
bun run test:e2e
bun run playground:dev
```

`bun run verify` checks public API types, lint, formatting, interaction tests, the package build, and the published package contents.

## License

MIT
