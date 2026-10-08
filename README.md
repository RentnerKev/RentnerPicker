<p align="center">
    <img src="https://raw.githubusercontent.com/RentnerKev/RentnerPicker/main/assets/readme/banner.png" alt="RentnerPicker" width="100%">
</p>

<p align="center">
    <a href="https://github.com/RentnerKev/RentnerPicker/actions/workflows/ci.yml"><img src="https://github.com/RentnerKev/RentnerPicker/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI"></a>
    <a href="https://github.com/RentnerKev/RentnerPicker/actions/workflows/codeql.yml"><img src="https://github.com/RentnerKev/RentnerPicker/actions/workflows/codeql.yml/badge.svg?branch=main" alt="CodeQL"></a>
    <a href="https://www.npmjs.com/package/@rentnerkev/picker"><img src="https://img.shields.io/npm/v/@rentnerkev/picker" alt="npm version"></a>
    <a href="https://www.npmjs.com/package/@rentnerkev/picker"><img src="https://img.shields.io/npm/dm/@rentnerkev/picker" alt="npm downloads"></a>
    <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT license"></a>
</p>

Controlled React color picker with presets, HEX/RGB input, accessible controls, and localization.

## Installation

Requires React 19, React DOM 19, and Tailwind CSS 4.

```bash
npm install @rentnerkev/picker
# or with Bun
bun add @rentnerkev/picker
```

Import the package styles after Tailwind in your app stylesheet:

```css
@import 'tailwindcss';
@import '@rentnerkev/picker/tailwind.css';
```

## Quick start

```tsx
'use client'

import { useState } from 'react'
import { CustomColorPicker } from '@rentnerkev/picker'

export function BrandColor() {
    const [color, setColor] = useState('#13ecd6')
    return (
        <CustomColorPicker
            label="Brand color"
            value={color}
            onValueChange={setColor}
            locale="en"
        />
    )
}
```

## Screenshots

|                                                                                                                                                                                                                                                                                                                         |                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Hue, saturation & brightness**<br>[![Hue, saturation & brightness](https://raw.githubusercontent.com/RentnerKev/RentnerPicker/main/assets/readme/screenshots/hue-saturation-brightness.png)](https://raw.githubusercontent.com/RentnerKev/RentnerPicker/main/assets/readme/screenshots/hue-saturation-brightness.png) | **Custom indigo presets**<br>[![Custom indigo presets](https://raw.githubusercontent.com/RentnerKev/RentnerPicker/main/assets/readme/screenshots/custom-indigo-presets.png)](https://raw.githubusercontent.com/RentnerKev/RentnerPicker/main/assets/readme/screenshots/custom-indigo-presets.png) |
| **RGB color input**<br>[![RGB color input](https://raw.githubusercontent.com/RentnerKev/RentnerPicker/main/assets/readme/screenshots/rgb-color-input.png)](https://raw.githubusercontent.com/RentnerKev/RentnerPicker/main/assets/readme/screenshots/rgb-color-input.png)                                               | **Compact color trigger**<br>[![Compact color trigger](https://raw.githubusercontent.com/RentnerKev/RentnerPicker/main/assets/readme/screenshots/compact-color-trigger.png)](https://raw.githubusercontent.com/RentnerKev/RentnerPicker/main/assets/readme/screenshots/compact-color-trigger.png) |

[Full API & usage](https://npm.rentner.dev/docs/color-picker) · [Local playground](./playground) · [MIT license](./LICENSE)

Run the playground from the repository root:

```bash
bun install --cwd playground
bun run playground:dev
```

## AI and read-only MCP access

The separate `@rentnerkev/picker/ai` entry is for Node.js and Bun tooling. It reads
only this installed package's manifest, README, usage guide, and built TypeScript
declarations. It does not import React, mount UI, run examples, perform network
requests, or require an MCP runtime. Keep it in server/tooling code.

```ts
import {
    getPackageInfo,
    getPackageApi,
    getPackageDocumentation,
    searchPackageDocumentation,
    getPackageExamples,
} from '@rentnerkev/picker/ai'

const info = getPackageInfo()
const api = getPackageApi() // All public typed subpaths and dependent declarations
const usage = getPackageDocumentation('usage') // Full guide, including CSS and providers
const readme = getPackageDocumentation('readme')
const matches = searchPackageDocumentation('messages') // Literal, case-insensitive lines
const examples = getPackageExamples() // Fenced examples from the usage guide
```

`getPackageApi({ subpath: '.', symbol: 'CustomColorPicker' })` validates the symbol
against the selected public entry and returns its complete declaration context.
Unknown subpaths or symbols throw an error. File paths are not accepted. The
`./ai` entry itself is excluded from this UI API context. The manifest's `exports`
map remains available through `getPackageInfo()`.

Public website discovery is planned at
[llms.txt](https://packages.rentner.dev/llms.txt) and
[the MCP endpoint](https://packages.rentner.dev/mcp). These addresses become
available after the website deployment; this documentation does not claim the
endpoint is already online. The website's read-only tools expose public package
information, API declarations, usage guides, examples, and search, without
accounts, write operations, or access to private project files. The installed
`/ai` entry works locally without that service. Always use the documentation and
declarations for the version installed in your project.
