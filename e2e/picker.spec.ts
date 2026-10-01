import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.describe('picker playground', () => {
    test('keeps a read-only trigger focusable with supported ARIA state', async ({
        page,
    }) => {
        await page.goto('/?fixture=read-only')

        const trigger = page.locator('#read-only-color')
        await expect(trigger).toHaveAttribute('aria-disabled', 'true')
        await expect(trigger).not.toHaveAttribute('aria-readonly')
        await expect(trigger).not.toHaveAttribute('disabled')
        await trigger.focus()
        await expect(trigger).toBeFocused()

        const results = await new AxeBuilder({ page }).analyze()
        expect(results.violations).toEqual([])

        await trigger.evaluate((element) => element.click())
        await expect(page.getByRole('dialog')).toHaveCount(0)
    })

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

    test('fits a short narrow viewport and exposes semantic color sliders', async ({
        page,
    }) => {
        await page.setViewportSize({ width: 240, height: 160 })
        await page.goto('/')

        const trigger = page
            .getByRole('button', { name: 'Farbe auswählen' })
            .first()
        await trigger.scrollIntoViewIfNeeded()
        await trigger.click()

        const dialog = page.getByRole('dialog', { name: 'Farbe auswählen' })
        await expect(dialog).toBeVisible()

        const bounds = await dialog.boundingBox()
        expect(bounds).not.toBeNull()
        expect(bounds!.x).toBeGreaterThanOrEqual(0)
        expect(bounds!.y).toBeGreaterThanOrEqual(0)
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(240)
        expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(160)
        await expect(
            dialog.getByRole('slider', { name: 'Sättigung' }),
        ).toHaveCount(1)
        await expect(
            dialog.getByRole('slider', { name: 'Helligkeit' }),
        ).toHaveCount(1)
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
