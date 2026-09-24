import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.describe('picker playground', () => {
    test('opens the portal dialog and restores focus after Escape', async ({
        page,
    }) => {
        await page.goto('/')

        const trigger = page
            .getByRole('button', { name: 'Farbe auswählen' })
            .first()
        await trigger.click()

        const dialog = page.getByRole('dialog', { name: 'Farbe auswählen' })
        await expect(dialog).toBeVisible()
        await expect(
            dialog.getByRole('button', { name: /Farbfläche/ }),
        ).toBeFocused()

        await page.keyboard.press('Escape')
        await expect(dialog).toBeHidden()
        await expect(trigger).toBeFocused()
    })

    test('reports field blur after focus leaves the portal', async ({
        page,
    }) => {
        await page.goto('/')

        const blurred = page.getByTestId('brand-blurred')
        const trigger = page
            .getByRole('button', { name: 'Farbe auswählen' })
            .first()
        await trigger.click()
        await expect(page.getByRole('dialog')).toBeVisible()
        await expect(blurred).toHaveText('false')

        await page.getByRole('button', { name: 'Farben speichern' }).focus()
        await expect(blurred).toHaveText('true')
    })

    test('exposes preset state and field metadata', async ({ page }) => {
        await page.goto('/')

        const pickerInput = page.getByPlaceholder('#13ecd6').first()
        await expect(pickerInput).not.toHaveAttribute('name')
        await expect(pickerInput).toHaveAttribute('autocomplete', 'off')
        await expect(pickerInput).toHaveAttribute('inputmode', 'text')
        await expect(page.locator('input[name="brandColor"]')).toHaveCount(1)

        const preset = page
            .getByRole('button', { name: 'Farbe #13ecd6 auswählen' })
            .first()
        await preset.click()
        await expect(preset).toHaveAttribute('aria-pressed', 'true')
    })

    test('has no axe violations in the open picker flow', async ({ page }) => {
        await page.goto('/')
        await page
            .getByRole('button', { name: 'Farbe auswählen' })
            .first()
            .click()

        const results = await new AxeBuilder({ page }).analyze()
        expect(results.violations).toEqual([])
    })

    test('keeps the dark playground stable under reduced motion', async ({
        page,
    }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' })
        await page.goto('/')

        await expect
            .poll(() =>
                page.evaluate(
                    () =>
                        getComputedStyle(document.documentElement).colorScheme,
                ),
            )
            .toBe('dark')
    })
})
