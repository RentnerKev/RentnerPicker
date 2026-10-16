import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

type PackageManifest = {
    exports: Record<string, unknown>
    files: string[]
    sideEffects: string[]
}

const repositoryRoot = resolve(import.meta.dir, '../..')
const manifest = JSON.parse(
    readFileSync(resolve(repositoryRoot, 'package.json'), 'utf8'),
) as PackageManifest
const tailwindEntry = readFileSync(
    resolve(repositoryRoot, 'tailwind.css'),
    'utf8',
)

describe('Tailwind package contract', () => {
    test('publishes an explicit CSS entry', () => {
        expect(manifest.exports['./tailwind.css']).toBe('./tailwind.css')
        expect(manifest.files).toContain('tailwind.css')
        expect(manifest.sideEffects).toEqual(['./tailwind.css', './theme.css'])
    })

    test('scans only built JavaScript and provides the shared theme tokens', () => {
        const sources = [
            ...tailwindEntry.matchAll(/@source\s+["']([^"']+)["']/g),
        ].map(([, source]) => source)

        expect(sources).toEqual(['./dist/**/*.js'])
        expect(tailwindEntry).not.toContain('..')

        for (const token of [
            '--color-primary',
            '--color-primary-hover',
            '--color-background-dark',
            '--color-surface-dark',
            '--color-input-dark',
            '--color-border-dark',
            '--color-secondary-text',
            '--color-muted-foreground',
        ]) {
            expect(tailwindEntry).toContain(token)
        }
    })
})

test('exports the common theme and sizes as reachable Tailwind tokens', () => {
    expect(manifest.files).toContain('theme.css')
    expect(manifest.exports['./theme.css']).toBe('./theme.css')
    expect(tailwindEntry).toContain("@import './theme.css'")
    const sharedTheme = readFileSync(
        resolve(repositoryRoot, 'theme.css'),
        'utf8',
    )
    for (const token of [
        '--rentner-control',
        '--rentner-surface',
        '--rentner-foreground',
        '--rentner-muted',
        '--rentner-border',
        '--rentner-accent',
        '--rentner-danger',
        '--rentner-radius',
        '--spacing-rentner-control-sm',
        '--spacing-rentner-control-md',
        '--spacing-rentner-control-lg',
    ])
        expect(sharedTheme).toContain(token)
})
