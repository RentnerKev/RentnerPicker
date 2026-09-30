export async function check({ page, expect }) {
    const refEvents = page.getByTestId('trigger-ref-events')
    const objectRefStatus = page.getByTestId('trigger-object-ref-status')
    await expect(refEvents).toHaveText('cleanup:attached')
    await page.getByRole('button', { name: 'Use legacy trigger ref' }).click()
    await expect(refEvents).toHaveText(
        'cleanup:attached,cleanup:cleanup,legacy:attached',
    )
    await page.getByRole('button', { name: 'Use object trigger ref' }).click()
    await expect(refEvents).toHaveText(
        'cleanup:attached,cleanup:cleanup,legacy:attached,legacy:null',
    )
    await expect(objectRefStatus).toHaveText('attached')
    await page.getByRole('button', { name: 'Use cleanup trigger ref' }).click()
    await expect(objectRefStatus).toHaveText('detached')
    await page.getByRole('button', { name: 'Remove ref target' }).click()
    await expect(refEvents).toHaveText(
        'cleanup:attached,cleanup:cleanup,legacy:attached,legacy:null,cleanup:attached,cleanup:cleanup',
    )
    await expect(objectRefStatus).toHaveText('detached')

    const acceptChanges = page.getByRole('checkbox', {
        name: 'Accept parent color changes',
    })
    const acceptedForm = page.getByRole('form', {
        name: 'Accepted color form',
    })
    const colorInput = acceptedForm.getByRole('textbox', {
        name: 'Brand color',
    })
    const trigger = acceptedForm.getByRole('button', {
        name: 'Brand color',
        exact: true,
    })

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
    await page.keyboard.press('Escape')

    await colorInput.fill('#123456')
    await colorInput.press('Enter')
    await expect(page.getByTestId('brand-submit-count')).toHaveText('1')
    await expect(page.getByTestId('brand-submission')).toHaveText('#123456')

    await colorInput.fill('#224466')
    await acceptedForm.evaluate((form) => form.requestSubmit())
    await expect(page.getByTestId('brand-submit-count')).toHaveText('2')
    await expect(page.getByTestId('brand-submission')).toHaveText('#224466')
    await colorInput.fill('#invalid')
    await colorInput.press('Enter')
    await expect(page.getByTestId('brand-submit-count')).toHaveText('2')
    expect(
        await acceptedForm.evaluate((form) =>
            new FormData(form).get('brandColor'),
        ),
    ).toBe('#224466')

    await optionalInput.fill('#654321')
    await optionalInput.press('Enter')
    await expect(page.getByTestId('optional-submit-count')).toHaveText('1')
    await expect(page.getByTestId('optional-submission')).toHaveText('#abcdef')
    await expect(optionalInput).toHaveValue('#abcdef')

    const requiredInput = page
        .getByRole('form', { name: 'Required color form' })
        .getByRole('textbox', { name: 'Required color' })
    await requiredInput.fill('#112233')
    await requiredInput.press('Enter')
    await expect(page.getByTestId('required-submit-count')).toHaveText('1')
    await expect(page.getByTestId('required-submission')).toHaveText('#112233')

    const multiForm = page.getByRole('form', { name: 'Multiple color form' })
    // Keep both drafts uncommitted, as a form library can do before requestSubmit.
    /* eslint-disable no-await-in-loop -- Sequential input events prepare both drafts on the same form. */
    for (const [name, value] of [
        ['First color', '#333333'],
        ['Second color', '#444444'],
    ]) {
        await multiForm
            .getByRole('textbox', { name, exact: true })
            .evaluate((input, nextValue) => {
                Object.getOwnPropertyDescriptor(
                    HTMLInputElement.prototype,
                    'value',
                ).set.call(input, nextValue)
                input.dispatchEvent(new Event('input', { bubbles: true }))
            }, value)
    }
    /* eslint-enable no-await-in-loop */
    await multiForm.evaluate((form) => form.requestSubmit())
    await expect(page.getByTestId('multi-submit-count')).toHaveText('1')
    await expect(page.getByTestId('multi-submission')).toHaveText(
        JSON.stringify({ firstColor: '#333333', secondColor: '#444444' }),
    )

    const removingForm = page.getByRole('form', {
        name: 'Removing color form',
    })
    await removingForm
        .getByRole('textbox', { name: 'Removing color' })
        .fill('#123456')
    await removingForm.evaluate((form) => form.requestSubmit())
    await expect(page.getByTestId('removing-submit-count')).toHaveText('1')
    await expect(page.getByTestId('removing-submission')).toHaveText('retained')
    await expect(
        removingForm.getByRole('textbox', { name: 'Removing color' }),
    ).toHaveCount(0)

    const repeatedForm = page.getByRole('form', {
        name: 'Repeated color form',
    })
    await repeatedForm
        .getByRole('textbox', { name: 'Repeated color' })
        .fill('#667788')
    await repeatedForm.evaluate((form) => {
        const submitter = form.querySelector('button[type="submit"]')
        form.requestSubmit(submitter)
        form.requestSubmit(submitter)
    })
    await expect(page.getByTestId('repeated-change-count')).toHaveText('1')
    await expect(page.getByTestId('repeated-submissions')).toHaveText(
        JSON.stringify(['#667788', '#667788']),
    )
    await expect(page.getByTestId('repeated-submitter')).toHaveText(
        'Submit repeated color',
    )
}
