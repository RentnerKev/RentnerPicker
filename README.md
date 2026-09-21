# @rentnerkev/picker

Ein kontrollierter und anpassbarer React-Color-Picker mit Presets, Formularvalidierung und Tailwind-Design.

## Installation

Installiere das Paket mit npm oder Bun:

```bash
npm install @rentnerkev/picker
```

## Verwendung

```tsx
import { useState } from 'react'
import { CustomColorPicker } from '@rentnerkev/picker'

function MyComponent() {
    const [color, setColor] = useState('#13ecd6')

    return (
        <CustomColorPicker
            id="brand-color"
            name="brandColor"
            value={color}
            onValueChange={setColor}
            required
        />
    )
}
```

## Lokalisierung

Die deutschen Meldungen und ARIA-Texte sind standardmäßig aktiv. Mit
`locale="en"` werden die vollständigen englischen Standardtexte verwendet.
Einzelne Texte können über ein typisiertes `Partial<PickerMessages>`-Objekt
überschrieben werden. Der Katalog und der Resolver sind ebenfalls als
`pickerMessageCatalog` und `resolvePickerMessages` exportiert.

```tsx
import {
    CustomColorPicker,
    type PickerMessages,
} from '@rentnerkev/picker'

const messages: Partial<PickerMessages> = {
    invalidColor: 'Please enter a HEX or RGB color',
    selectColor: 'Choose a color',
    presetColor: (color) => `Use ${color}`,
}

<CustomColorPicker
    value={color}
    onValueChange={setColor}
    locale="en"
    messages={messages}
/>
```

## API-Dokumentation

### `CustomColorPicker`-Props

| Prop            | Typ                       | Standard       | Beschreibung                                     |
| --------------- | ------------------------- | -------------- | ------------------------------------------------ |
| `id`            | `string`                  | -              | Eindeutige ID für den nativen Color-Input.       |
| `name`          | `string`                  | -              | Name für Formular-Submit und native Validierung. |
| `value`         | `string`                  | -              | Aktueller Farbwert als HEX oder RGB.             |
| `onValueChange` | `(value: string) => void` | -              | Callback bei gültiger Farbänderung.              |
| `required`      | `boolean`                 | `false`        | Aktiviert Pflichtfeld-Validierung.               |
| `disabled`      | `boolean`                 | `false`        | Deaktiviert Eingabe, Picker und Presets.         |
| `placeholder`   | `string`                  | `#13ecd6`      | Platzhalter im Textfeld.                         |
| `format`        | `'hex' \| 'rgb'`          | `hex`          | Ausgabeformat für neue Werte.                    |
| `presets`       | `string[]`                | Standardfarben | Farben für Schnell-Auswahl.                      |
| `showInput`     | `boolean`                 | `true`         | Zeigt das Textfeld neben dem Farbfeld.           |
| `showPresets`   | `boolean`                 | `true`         | Zeigt Preset-Farben unterhalb der Eingabe.       |
| `icon`          | `ReactNode`               | `Palette`      | Optionales Icon links in der Komponente.         |
| `className`     | `string`                  | `w-full`       | Klassen für den äußeren Container.               |
| `customDesign`  | `CustomColorPickerDesign` | -              | Objekt zur individuellen Gestaltung.             |
| `locale`        | `'de' \| 'en'`            | `'de'`         | Sprache der Standard- und ARIA-Texte.            |
| `messages`      | `Partial<PickerMessages>` | -              | Überschreibt einzelne Standard- und ARIA-Texte.  |

## CSS-Integration

Da diese Bibliothek Tailwind CSS verwendet, füge die Quellen in deine Haupt-CSS-Datei ein:

```css
@import 'tailwindcss';
@source "../node_modules/@rentnerkev/picker";
```

## Entwicklung

```bash
bun install
bun run verify
bun run playground:dev
```

`bun run verify` prüft Typen, Oxlint, Oxfmt, den Paket-Build und den
veröffentlichten Paketinhalt per Dry Run.
