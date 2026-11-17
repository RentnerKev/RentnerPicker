/* eslint-disable no-await-in-loop -- Opening, dismissing and reopening the same popup must be observed sequentially. */
import { expect, test } from '@playwright/test'

for (const portal of ['body', 'shadow'] as const) {
    test(`positions every visible cold-open and reopen frame in a ${portal} portal`, async ({
        page,
    }) => {
        await page.setViewportSize({ width: 1100, height: 850 })
        await page.goto(portal === 'shadow' ? '/?fixture=shadow-portal' : '/')
        if (portal === 'shadow') {
            await page.getByTestId('shadow-host').evaluate((host) => {
                for (const style of document.querySelectorAll(
                    'style, link[rel="stylesheet"]',
                )) {
                    host.shadowRoot!.append(style.cloneNode(true))
                }
            })
        }
        const trigger =
            portal === 'shadow'
                ? page.getByRole('button', {
                      name: 'Shadow color',
                      exact: true,
                  })
                : page.locator('#brand-color')
        await trigger.evaluate((element) => {
            const root = element.closest<HTMLElement>('.group.relative')!
            Object.assign(root.style, {
                position: 'fixed',
                right: '24px',
                top: '70px',
                width: '300px',
            })
        })
        for (const opening of ['cold', 'reopen'] as const) {
            if (opening === 'reopen') {
                await trigger.evaluate((element) => {
                    Object.assign(
                        element.closest<HTMLElement>('.group.relative')!.style,
                        { right: '140px', top: '160px' },
                    )
                })
            }
            const samples = await trigger.evaluate(async (element) => {
                const root = element.closest<HTMLElement>('.group.relative')!
                const shadow = document.querySelector(
                    '[data-testid="shadow-host"]',
                )?.shadowRoot
                const observed: Array<{
                    left: number
                    top: number
                    expectedLeft: number
                    expectedTop: number
                    width: number
                }> = []
                const sample = () => {
                    const popup = (
                        shadow ?? document
                    ).querySelector<HTMLElement>('[role="dialog"]')
                    if (
                        !popup ||
                        getComputedStyle(popup).visibility === 'hidden'
                    )
                        return
                    const bounds = popup.getBoundingClientRect()
                    const anchor = root.getBoundingClientRect()
                    observed.push({
                        left: bounds.left,
                        top: bounds.top,
                        expectedLeft: anchor.left,
                        expectedTop: anchor.bottom + 8,
                        width: bounds.width,
                    })
                }
                const observer = new MutationObserver(sample)
                const options = {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['style'],
                }
                observer.observe(document.body, options)
                if (shadow) observer.observe(shadow, options)
                try {
                    ;(element as HTMLButtonElement).click()
                    for (let frame = 0; frame < 8; frame++) {
                        // Observe paint opportunities in order, without a timing sleep.
                        // eslint-disable-next-line no-await-in-loop
                        await new Promise<void>((resolve) =>
                            requestAnimationFrame(() => resolve()),
                        )
                        sample()
                    }
                    return observed
                } finally {
                    observer.disconnect()
                }
            })
            expect(samples.length).toBeGreaterThanOrEqual(3)
            for (const sample of samples) {
                expect(
                    Math.abs(sample.left - sample.expectedLeft),
                ).toBeLessThan(1)
                expect(Math.abs(sample.top - sample.expectedTop)).toBeLessThan(
                    1,
                )
                expect(sample.width).toBe(300)
            }
            await page.keyboard.press('Escape')
            await expect(page.getByRole('dialog')).toHaveCount(0)
            await expect(trigger).toBeFocused()
        }
    })
}
