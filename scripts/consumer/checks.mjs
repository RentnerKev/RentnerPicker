export async function check({ page, expect }) {
    const acceptChanges = page.getByRole('checkbox', {
        name: 'Accept parent color changes',
    })
    const acceptedForm = page.getByRole('form', {
        name: 'Accepted color form',
    })
    const colorInput = acceptedForm.getByRole('textbox', {
        name: 'Brand color',
    })
    const trigger = acceptedForm.getByRole('button', { name: 'Brand color' })

    await expect(acceptChanges).not.toBeChecked()
    await expect(colorInput).toHaveValue('#abcdef')
    expect(
        await acceptedForm.evaluate((node) =>
            new FormData(node).get('brandColor'),
        ),
    ).toBe('#abcdef')

    await trigger.click()
    const dialog = page.getByRole('dialog', { name: 'Select color' })
    expect(
        await dialog.evaluate((node) =>
            Number.parseFloat(getComputedStyle(node).paddingLeft),
        ),
    ).toBeGreaterThan(0)
    expect(
        await dialog.evaluate((node) =>
            Number.parseFloat(getComputedStyle(node).borderTopWidth),
        ),
    ).toBeGreaterThan(0)
    const colorArea = page.getByRole('button', { name: /Color area/ })
    await colorArea.press('ArrowRight')

    await expect(colorInput).toHaveValue('#abcdef')
    expect(
        await trigger.evaluate(
            (node) => getComputedStyle(node).backgroundColor,
        ),
    ).toBe('rgb(171, 205, 239)')
    expect(
        await acceptedForm.evaluate((node) =>
            new FormData(node).get('brandColor'),
        ),
    ).toBe('#abcdef')

    await acceptChanges.check()
    await trigger.click()
    await page.getByRole('button', { name: /Color area/ }).press('ArrowRight')
    await expect(colorInput).not.toHaveValue('#abcdef')

    const acceptedColor = await colorInput.inputValue()
    expect(
        await acceptedForm.evaluate((node) =>
            new FormData(node).get('brandColor'),
        ),
    ).toBe(acceptedColor)

    await page.keyboard.press('Escape')
    await expect(
        page.getByRole('dialog', { name: 'Select color' }),
    ).toHaveCount(0)

    const optionalForm = page.getByRole('form', {
        name: 'Optional color form',
    })
    const optionalInput = optionalForm.getByRole('textbox', {
        name: 'Optional color',
    })
    await optionalInput.fill('')
    await optionalInput.blur()
    await expect(optionalInput).toHaveValue('#abcdef')
    expect(
        await optionalForm.evaluate((node) =>
            new FormData(node).get('optionalColor'),
        ),
    ).toBe('#abcdef')

    await page.getByRole('button', { name: 'Equivalent preset' }).click()
    await expect(
        page.getByRole('button', { name: 'Select color #abc' }),
    ).toHaveAttribute('aria-pressed', 'true')
}
