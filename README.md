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
    const [isColorValid, setIsColorValid] = useState(true)

    return (
        <CustomColorPicker
            id="brand-color"
            name="brandColor"
            value={color}
            onValueChange={setColor}
            onValidityChange={setIsColorValid}
            required
        />
    )
}
```

`onValueChange` wird nur mit einer gültigen, normalisierten Farbe aufgerufen.
Ein ungültiger sichtbarer Entwurf überschreibt deshalb weder den kontrollierten
Wert noch den Formularwert. `onValidityChange` meldet den aktuellen Zustand
beim ersten Rendern und anschließend nur bei tatsächlichen Wechseln. Dabei
werden `required` und kontrollierte externe Fehler berücksichtigt. Deaktivierte
Felder gelten als gültig, weil sie von Browserformularen ausgeschlossen sind.

## Farb-Utilities

Die drei Hilfsfunktionen sind direkt aus dem Paket exportiert:

```ts
import { hexToRgb, isValidColor, normalizeColor } from '@rentnerkev/picker'

normalizeColor('AbC') // '#aabbcc'
normalizeColor('rgb(19, 236, 214)') // '#13ecd6'
normalizeColor('invalid') // null

isValidColor('#13ecd6') // true
hexToRgb('#13ecd6') // { red: 19, green: 236, blue: 214 }
```

Unterstützt werden drei- und sechsstellige HEX-Werte mit optionalem `#` sowie
`rgb(r, g, b)` mit Kanälen von 0 bis 255. Alpha- und Prozentformate werden
bewusst nicht teilweise interpretiert. `normalizeColor` liefert immer einen
kleingeschriebenen sechsstelligen HEX-Wert oder `null`.

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

## Formularanbindung

Der sichtbare Trigger unterstützt einen gemeinsamen Feldvertrag für Labels,
Hilfetexte, kontrollierte externe Fehler und Fokussteuerung. Ein übergebenes
`error` überschreibt die interne Validierung; mit `error={null}` kann ein
externer Formularzustand den Fehler bewusst löschen. Bei einem ungültigen
Submit wird der sichtbare Trigger fokussiert.
Weitere React-`aria-*`-Attribute werden direkt an diesen Trigger
weitergegeben.
Ein deaktivierter Picker wird nicht als Formularwert übertragen; ein
schreibgeschützter Picker behält seinen Wert.

```tsx
const pickerTriggerRef = useRef<HTMLButtonElement>(null)

<CustomColorPicker
    id="brand-color"
    name="brandColor"
    value={color}
    onValueChange={setColor}
    label="Markenfarbe"
    description="Wird für Buttons und Hervorhebungen verwendet."
    error={serverError}
    triggerRef={pickerTriggerRef}
    aria-describedby="brand-color-help"
/>
```

## API-Dokumentation

### `CustomColorPicker`-Props

| Prop               | Typ                          | Standard       | Beschreibung                                     |
| ------------------ | ---------------------------- | -------------- | ------------------------------------------------ |
| `id`               | `string`                     | generiert      | Eindeutige ID für den sichtbaren Trigger.        |
| `name`             | `string`                     | -              | Name für Formular-Submit und native Validierung. |
| `value`            | `string`                     | -              | Aktueller Farbwert als HEX oder RGB.             |
| `onValueChange`    | `(value: string) => void`    | -              | Callback bei gültiger Farbänderung.              |
| `onValidityChange` | `(isValid: boolean) => void` | -              | Meldet Wechsel der aktuellen Entwurfsvalidität.  |
| `required`         | `boolean`                    | `false`        | Aktiviert Pflichtfeld-Validierung.               |
| `disabled`         | `boolean`                    | `false`        | Deaktiviert Eingabe, Picker und Presets.         |
| `readOnly`         | `boolean`                    | `false`        | Verhindert Änderungen, behält den Formularwert.  |
| `label`            | `ReactNode`                  | -              | Sichtbares Label des Feldes.                     |
| `description`      | `ReactNode`                  | -              | Hilfetext mit automatischer ARIA-Verknüpfung.    |
| `error`            | `string \| null`             | `undefined`    | Kontrollierter externer Validierungsfehler.      |
| `triggerRef`       | `Ref<HTMLButtonElement>`     | -              | Ref auf den sichtbaren, fokussierbaren Trigger.  |
| `aria-*`           | `string`                     | -              | Zusätzliche zugängliche Beschriftungsreferenzen. |
| `placeholder`      | `string`                     | `#13ecd6`      | Platzhalter im Textfeld.                         |
| `format`           | `'hex' \| 'rgb'`             | `hex`          | Ausgabeformat für neue Werte.                    |
| `presets`          | `string[]`                   | Standardfarben | Farben für Schnell-Auswahl.                      |
| `showInput`        | `boolean`                    | `true`         | Zeigt das Textfeld neben dem Farbfeld.           |
| `showPresets`      | `boolean`                    | `true`         | Zeigt Preset-Farben unterhalb der Eingabe.       |
| `icon`             | `ReactNode`                  | `Palette`      | Optionales Icon links in der Komponente.         |
| `className`        | `string`                     | `w-full`       | Klassen für den äußeren Container.               |
| `customDesign`     | `CustomColorPickerDesign`    | -              | Objekt zur individuellen Gestaltung.             |
| `locale`           | `'de' \| 'en'`               | `'de'`         | Sprache der Standard- und ARIA-Texte.            |
| `messages`         | `Partial<PickerMessages>`    | -              | Überschreibt einzelne Standard- und ARIA-Texte.  |

## Tastaturbedienung

Nach dem Öffnen erhält die Farbfläche den Fokus. Sie unterstützt folgende
Tasten:

| Taste                       | Wirkung                                        |
| --------------------------- | ---------------------------------------------- |
| `Pfeil links` / `rechts`    | Sättigung um einen Schritt verringern/erhöhen  |
| `Pfeil hoch` / `runter`     | Helligkeit um einen Schritt erhöhen/verringern |
| `Umschalt` + Pfeiltaste     | Änderung in Zehnerschritten                    |
| `Bild hoch` / `Bild runter` | Helligkeit um zehn Schritte ändern             |
| `Pos1` / `Ende`             | Minimale beziehungsweise maximale Sättigung    |
| `Escape`                    | Picker schließen und Trigger fokussieren       |

Der Farbton-Regler verwendet zusätzlich die native Tastaturbedienung eines
HTML-Range-Inputs mit Einerschritten.

## CSS-Integration

Die Bibliothek liefert einen eigenen Tailwind-Einstieg. Importiere ihn nach
Tailwind CSS in deine Haupt-CSS-Datei:

```css
@import 'tailwindcss';
@import '@rentnerkev/picker/tailwind.css';
```

Der Paket-Einstieg scannt ausschließlich die veröffentlichten JavaScript-Dateien
unter `dist`. Er stellt die gemeinsamen Theme-Tokens `primary`, `primary-hover`,
`background-dark`, `surface-dark`, `input-dark`, `border-dark`, `secondary-text`
und `muted-foreground` bereit. Eigene Werte können danach mit einem weiteren
`@theme`-Block überschrieben werden.

## Entwicklung

```bash
bun install
bun run verify
bun run playground:dev
```

`bun run verify` prüft Typen und öffentliche API-Fixtures, Oxlint, Oxfmt,
Interaktionstests, den Paket-Build und den veröffentlichten Paketinhalt per Dry
Run.
