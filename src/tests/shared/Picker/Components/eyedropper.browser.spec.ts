import { expect, test } from '@playwright/test'

type DropperRequest = {
    resolve: (result: { sRGBHex: string }) => void
    reject: (error: unknown) => void
    signal?: AbortSignal
}
type DropperHarness = Window & { dropperRequests: DropperRequest[] }

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
        const harness = window as DropperHarness
        harness.dropperRequests = []
        Object.defineProperty(window, 'EyeDropper', {
            configurable: true,
            value: class {
                open(options?: { signal?: AbortSignal }) {
                    return new Promise<{ sRGBHex: string }>((resolve, reject) => {
                        harness.dropperRequests.push({ resolve, reject, signal: options?.signal })
                    })
                }
            },
        })
    })
    await page.goto('/')
})

test('native selection is single-flight, exposes pending, commits and restores trigger focus', async ({ page }) => {
    const trigger = page.locator('#brand-color')
    await trigger.click()
    const dropper = page.getByRole('button', { name: 'Farbe mit Pipette auswählen' })
    await dropper.focus()
    await page.keyboard.press('Enter')
    await expect(dropper).toBeDisabled()
    await expect(dropper).toHaveAttribute('aria-busy', 'true')
    await expect(dropper).toBeFocused()
    await dropper.evaluate((element: HTMLButtonElement) => element.click())
    expect(await page.evaluate(() => (window as DropperHarness).dropperRequests.length)).toBe(1)
    await page.evaluate(() => (window as DropperHarness).dropperRequests[0]?.resolve({ sRGBHex: '#abcdef' }))
    await expect(page.getByRole('textbox', { name: 'Farbe auswählen', exact: true }).first()).toHaveValue('#abcdef')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(trigger).toBeFocused()
})

test('close and reopen abort the old native selection without committing or clearing the newer pending state', async ({ page }) => {
    const trigger = page.locator('#alpha-color')
    await trigger.click()
    const dropper = page.getByRole('button', { name: 'Farbe mit Pipette auswählen' })
    await dropper.click()
    await page.keyboard.press('Escape')
    expect(await page.evaluate(() => (window as DropperHarness).dropperRequests[0]?.signal?.aborted)).toBe(true)
    await trigger.click()
    await dropper.click()
    await page.evaluate(() => (window as DropperHarness).dropperRequests[0]?.resolve({ sRGBHex: '#ffffff' }))
    await expect(page.getByRole('textbox', { name: 'Transparente Farbe' })).toHaveValue('rgba(19, 236, 214, 0.5)')
    await expect(dropper).toHaveAttribute('aria-busy', 'true')
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.evaluate(() => (window as DropperHarness).dropperRequests[1]?.resolve({ sRGBHex: '#abcdef' }))
    await expect(page.getByRole('textbox', { name: 'Transparente Farbe' })).toHaveValue('rgba(171, 205, 239, 1)')
    await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('native cancellation leaves the color unchanged and allows another launch', async ({ page }) => {
    await page.locator('#brand-color').click()
    const dropper = page.getByRole('button', { name: 'Farbe mit Pipette auswählen' })
    await dropper.focus()
    await page.keyboard.press('Enter')
    await page.evaluate(() => (window as DropperHarness).dropperRequests[0]?.reject(new DOMException('Cancelled', 'AbortError')))
    await expect(dropper).toBeEnabled()
    await expect(dropper).toBeFocused()
    await expect(dropper).not.toHaveAttribute('aria-busy', 'true')
    await expect(page.getByRole('textbox', { name: 'Farbe auswählen', exact: true }).first()).toHaveValue('#13ecd6')
    await dropper.click()
    expect(await page.evaluate(() => (window as DropperHarness).dropperRequests.length)).toBe(2)
})
