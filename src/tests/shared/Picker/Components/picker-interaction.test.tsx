import { afterEach, describe, expect, mock, test } from 'bun:test'
import { useEffect, useRef, useState } from 'react'
import {
    act,
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CustomColorPicker } from '../../../../index.js'

afterEach(() => {
    cleanup()
})

function cancelSubmit(event: Event) {
    event.preventDefault()
}

describe('picker interactions', () => {
    test('reports validity transitions for the visible draft', async () => {
        const validityChanges: boolean[] = []
        const valueChanges: string[] = []

        render(
            <CustomColorPicker
                value="#13ecd6"
                onValueChange={(value) => valueChanges.push(value)}
                onValidityChange={(isValid) => validityChanges.push(isValid)}
            />,
        )

        const input = screen.getByPlaceholderText('#13ecd6')

        expect(validityChanges).toEqual([true])

        fireEvent.change(input, { target: { value: 'invalid' } })
        fireEvent.change(input, { target: { value: 'still-invalid' } })

        await waitFor(() => {
            expect(validityChanges).toEqual([true, false])
        })
        expect(valueChanges).toEqual([])

        fireEvent.change(input, { target: { value: 'AbC' } })

        await waitFor(() => {
            expect(validityChanges).toEqual([true, false, true])
        })

        fireEvent.blur(input)

        expect(valueChanges).toEqual(['#aabbcc'])
    })

    test('keeps invalid drafts visible and reverts valid commits rejected by the controlled parent', async () => {
        const valueChanges: string[] = []

        render(
            <form aria-label="color form">
                <CustomColorPicker
                    name="brandColor"
                    value="#abcdef"
                    onValueChange={(value) => valueChanges.push(value)}
                />
            </form>,
        )

        const input = screen.getByPlaceholderText('#13ecd6') as HTMLInputElement
        const form = screen.getByRole('form') as HTMLFormElement

        fireEvent.change(input, { target: { value: 'invalid' } })
        expect(input.value).toBe('invalid')
        fireEvent.blur(input)
        expect(input.value).toBe('invalid')
        expect(new FormData(form).get('brandColor')).toBe('#abcdef')

        fireEvent.change(input, { target: { value: 'AbC' } })
        fireEvent.blur(input)

        await waitFor(() => expect(input.value).toBe('#abcdef'))
        expect(valueChanges).toEqual(['#aabbcc'])
        expect(new FormData(form).get('brandColor')).toBe('#abcdef')
    })

    test('reverts a rejected optional clear to the controlled value', async () => {
        const valueChanges: string[] = []

        render(
            <form aria-label="color form">
                <CustomColorPicker
                    name="brandColor"
                    value="#abcdef"
                    onValueChange={(value) => valueChanges.push(value)}
                />
            </form>,
        )

        const input = screen.getByPlaceholderText('#13ecd6') as HTMLInputElement
        const form = screen.getByRole('form') as HTMLFormElement
        fireEvent.change(input, { target: { value: '' } })
        fireEvent.blur(input)

        await waitFor(() => expect(input.value).toBe('#abcdef'))
        expect(valueChanges).toEqual([''])
        expect(new FormData(form).get('brandColor')).toBe('#abcdef')
    })

    test('forwards blur from the visible field trigger', () => {
        const onBlur = mock(() => undefined)

        render(
            <CustomColorPicker
                value="#13ecd6"
                onValueChange={() => undefined}
                onBlur={onBlur}
            />,
        )

        fireEvent.blur(screen.getByRole('button', { name: 'Farbe auswählen' }))

        expect(onBlur).toHaveBeenCalledTimes(1)
    })

    test('does not blur the field when focus moves into the open picker', () => {
        const onBlur = mock(() => undefined)

        render(
            <>
                <CustomColorPicker
                    value="#13ecd6"
                    onValueChange={() => undefined}
                    onBlur={onBlur}
                />
                <button type="button">Outside</button>
            </>,
        )

        const trigger = screen.getByRole('button', {
            name: 'Farbe auswählen',
        })
        fireEvent.click(trigger)

        const colorArea = screen.getByRole('button', {
            name: /Farbfläche/,
        })
        fireEvent.blur(trigger, { relatedTarget: colorArea })
        expect(onBlur).not.toHaveBeenCalled()

        fireEvent.blur(colorArea, {
            relatedTarget: screen.getByRole('button', { name: 'Outside' }),
        })
        expect(onBlur).toHaveBeenCalledTimes(1)
    })

    test('keeps an invalid draft out of submitted form data', () => {
        render(
            <form aria-label="color form">
                <CustomColorPicker
                    name="brandColor"
                    value="#13ecd6"
                    onValueChange={() => undefined}
                />
            </form>,
        )

        fireEvent.change(screen.getByPlaceholderText('#13ecd6'), {
            target: { value: 'invalid' },
        })

        const form = screen.getByRole('form') as HTMLFormElement

        expect(new FormData(form).get('brandColor')).toBe('#13ecd6')
    })

    test('reconciles an accepted draft before requestSubmit from the focused input', async () => {
        const user = userEvent.setup()
        const changes: string[] = []
        const submittedValues: Array<string | null> = []
        const capturedValues: Array<string | null> = []
        const capturedSubmitters: Array<HTMLElement | null> = []

        function Harness() {
            const [value, setValue] = useState('#abcdef')

            return (
                <form
                    aria-label="color form"
                    onSubmitCapture={(event) => {
                        capturedValues.push(
                            new FormData(event.currentTarget).get(
                                'brandColor',
                            ) as string | null,
                        )
                        capturedSubmitters.push(
                            (event.nativeEvent as SubmitEvent).submitter,
                        )
                    }}
                    onSubmit={(event) => {
                        event.preventDefault()
                        submittedValues.push(
                            new FormData(event.currentTarget).get(
                                'brandColor',
                            ) as string | null,
                        )
                    }}
                >
                    <CustomColorPicker
                        name="brandColor"
                        value={value}
                        onValueChange={(nextValue) => {
                            changes.push(nextValue)
                            setValue(nextValue)
                        }}
                    />
                    <button type="submit" name="intent" value="save">
                        Save
                    </button>
                </form>
            )
        }

        render(<Harness />)

        const input = screen.getByPlaceholderText('#13ecd6')
        const form = screen.getByRole('form') as HTMLFormElement
        const submitter = screen.getByRole('button', {
            name: 'Save',
        }) as HTMLButtonElement
        await user.click(input)
        await user.clear(input)
        await user.type(input, '#123456')

        act(() => form.requestSubmit(submitter))

        await waitFor(() => {
            expect(submittedValues).toEqual(['#123456'])
        })
        expect(changes).toEqual(['#123456'])
        expect(capturedValues).toEqual(['#123456'])
        expect(capturedSubmitters).toEqual([submitter])
        expect(submitter.name).toBe('intent')
        expect(submitter.value).toBe('save')
        expect(new FormData(form).get('brandColor')).toBe('#123456')
    })

    test('reconciles requestSubmit initiated from a React effect', async () => {
        const user = userEvent.setup()
        const submittedValues: Array<string | null> = []

        function Harness() {
            const [value, setValue] = useState('#abcdef')
            const [submitFromEffect, setSubmitFromEffect] = useState(false)
            const formRef = useRef<HTMLFormElement>(null)
            const didSubmitFromEffect = useRef(false)

            useEffect(() => {
                if (!submitFromEffect || didSubmitFromEffect.current) return

                didSubmitFromEffect.current = true
                formRef.current?.requestSubmit()
            }, [submitFromEffect])

            return (
                <>
                    <form
                        ref={formRef}
                        aria-label="color form"
                        onSubmit={(event) => {
                            event.preventDefault()
                            submittedValues.push(
                                new FormData(event.currentTarget).get(
                                    'brandColor',
                                ) as string | null,
                            )
                        }}
                    >
                        <CustomColorPicker
                            name="brandColor"
                            value={value}
                            onValueChange={setValue}
                        />
                    </form>
                    <button
                        type="button"
                        onClick={() => setSubmitFromEffect(true)}
                    >
                        Submit from effect
                    </button>
                </>
            )
        }

        render(<Harness />)

        const input = screen.getByPlaceholderText('#13ecd6') as HTMLInputElement
        const form = screen.getByRole('form') as HTMLFormElement
        fireEvent.change(input, { target: { value: '#123456' } })
        await user.click(
            screen.getByRole('button', { name: 'Submit from effect' }),
        )

        await waitFor(() => expect(submittedValues).toEqual(['#123456']))
        expect(new FormData(form).get('brandColor')).toBe('#123456')
    })

    test('submits the connected form when the accepted picker unmounts', async () => {
        const user = userEvent.setup()
        const changes: string[] = []
        const submittedValues: Array<[string | null, string | null]> = []

        function Harness() {
            const [value, setValue] = useState('#abcdef')
            const [showPicker, setShowPicker] = useState(true)

            return (
                <form
                    aria-label="color form"
                    onSubmit={(event) => {
                        event.preventDefault()
                        const formData = new FormData(event.currentTarget)
                        submittedValues.push([
                            formData.get('brandColor') as string | null,
                            formData.get('other') as string | null,
                        ])
                    }}
                >
                    {showPicker && (
                        <CustomColorPicker
                            name="brandColor"
                            value={value}
                            onValueChange={(nextValue) => {
                                changes.push(nextValue)
                                setValue(nextValue)
                                setShowPicker(false)
                            }}
                        />
                    )}
                    <input name="other" value="kept" readOnly />
                </form>
            )
        }

        render(<Harness />)

        const input = screen.getByPlaceholderText('#13ecd6')
        const form = screen.getByRole('form') as HTMLFormElement
        await user.click(input)
        await user.clear(input)
        await user.type(input, '#123456')

        act(() => form.requestSubmit())

        await waitFor(() => {
            expect(submittedValues).toEqual([[null, 'kept']])
        })
        expect(changes).toEqual(['#123456'])
        expect(form.isConnected).toBe(true)
        expect(screen.queryByPlaceholderText('#13ecd6')).toBeNull()
        expect(new FormData(form).get('other')).toBe('kept')
    })

    test('commits once and replays both same-batch requestSubmit attempts', async () => {
        const user = userEvent.setup()
        const changes: string[] = []
        const submittedValues: Array<string | null> = []
        const submittedSubmitters: Array<HTMLElement | null> = []

        function Harness() {
            const [value, setValue] = useState('#abcdef')

            return (
                <form
                    aria-label="color form"
                    onSubmit={(event) => {
                        event.preventDefault()
                        submittedValues.push(
                            new FormData(event.currentTarget).get(
                                'brandColor',
                            ) as string | null,
                        )
                        submittedSubmitters.push(
                            (event.nativeEvent as SubmitEvent).submitter,
                        )
                    }}
                >
                    <CustomColorPicker
                        name="brandColor"
                        value={value}
                        onValueChange={(nextValue) => {
                            changes.push(nextValue)
                            setValue(nextValue)
                        }}
                    />
                    <button type="submit" name="intent" value="save">
                        Save
                    </button>
                </form>
            )
        }

        render(<Harness />)

        const input = screen.getByPlaceholderText('#13ecd6')
        const form = screen.getByRole('form') as HTMLFormElement
        const submitter = screen.getByRole('button', {
            name: 'Save',
        }) as HTMLButtonElement
        await user.click(input)
        await user.clear(input)
        await user.type(input, '#123456')

        act(() => {
            form.requestSubmit(submitter)
            form.requestSubmit(submitter)
        })

        await waitFor(() => {
            expect(submittedValues).toEqual(['#123456', '#123456'])
        })
        expect(changes).toEqual(['#123456'])
        expect(submittedSubmitters).toEqual([submitter, submitter])
    })

    test('does not commit a draft when an earlier document listener cancels submit', () => {
        const changes: string[] = []
        const submitEvents: Array<string | null> = []
        document.addEventListener('submit', cancelSubmit, true)

        try {
            render(
                <form
                    aria-label="color form"
                    onSubmit={(event) => {
                        event.preventDefault()
                        submitEvents.push(
                            new FormData(event.currentTarget).get(
                                'brandColor',
                            ) as string | null,
                        )
                    }}
                >
                    <CustomColorPicker
                        name="brandColor"
                        value="#abcdef"
                        onValueChange={(value) => changes.push(value)}
                    />
                </form>,
            )

            const input = screen.getByPlaceholderText('#13ecd6')
            const form = screen.getByRole('form') as HTMLFormElement
            fireEvent.change(input, { target: { value: '#123456' } })

            act(() => form.requestSubmit())

            expect(changes).toEqual([])
            expect(submitEvents).toEqual(['#abcdef'])
            expect(new FormData(form).get('brandColor')).toBe('#abcdef')
        } finally {
            document.removeEventListener('submit', cancelSubmit, true)
        }
    })

    test('submits the first Enter from a valid draft in an initially empty required field', async () => {
        const user = userEvent.setup()
        const changes: string[] = []
        const submittedValues: Array<string | null> = []

        function Harness() {
            const [value, setValue] = useState('')

            return (
                <form
                    aria-label="color form"
                    onSubmit={(event) => {
                        event.preventDefault()
                        submittedValues.push(
                            new FormData(event.currentTarget).get(
                                'brandColor',
                            ) as string | null,
                        )
                    }}
                >
                    <CustomColorPicker
                        name="brandColor"
                        value={value}
                        required
                        onValueChange={(nextValue) => {
                            changes.push(nextValue)
                            setValue(nextValue)
                        }}
                    />
                    <button type="submit">Save</button>
                </form>
            )
        }

        render(<Harness />)

        const input = screen.getByPlaceholderText('#13ecd6')
        const form = screen.getByRole('form') as HTMLFormElement
        await user.click(input)
        await user.type(input, '#123456')
        await user.keyboard('{Enter}')

        await waitFor(() => {
            expect(submittedValues).toEqual(['#123456'])
        })
        expect(changes).toEqual(['#123456'])
        expect(new FormData(form).get('brandColor')).toBe('#123456')
    })

    test('keeps an invalid draft editable and lets native validation block requestSubmit', async () => {
        const user = userEvent.setup()
        const changes: string[] = []
        const submittedValues: string[] = []

        render(
            <form
                aria-label="color form"
                onSubmit={(event) => {
                    event.preventDefault()
                    submittedValues.push('submitted')
                }}
            >
                <CustomColorPicker
                    name="brandColor"
                    value="#abcdef"
                    onValueChange={(value) => changes.push(value)}
                />
                <button type="submit">Save</button>
            </form>,
        )

        const input = screen.getByPlaceholderText('#13ecd6') as HTMLInputElement
        const form = screen.getByRole('form') as HTMLFormElement
        await user.click(input)
        await user.clear(input)
        await user.type(input, 'not-a-color')

        act(() => form.requestSubmit())

        expect(input.value).toBe('not-a-color')
        expect(new FormData(form).get('brandColor')).toBe('#abcdef')
        expect(changes).toEqual([])
        expect(submittedValues).toEqual([])
    })

    test('respects noValidate while submitting only the controlled value for an invalid draft', async () => {
        const user = userEvent.setup()
        const changes: string[] = []
        const submittedValues: Array<string | null> = []

        render(
            <form
                aria-label="color form"
                noValidate
                onSubmit={(event) => {
                    event.preventDefault()
                    submittedValues.push(
                        new FormData(event.currentTarget).get('brandColor') as
                            | string
                            | null,
                    )
                }}
            >
                <CustomColorPicker
                    name="brandColor"
                    value="#abcdef"
                    onValueChange={(value) => changes.push(value)}
                />
                <button type="submit">Save</button>
            </form>,
        )

        const input = screen.getByPlaceholderText('#13ecd6') as HTMLInputElement
        const form = screen.getByRole('form') as HTMLFormElement
        await user.click(input)
        await user.clear(input)
        await user.type(input, 'not-a-color')

        act(() => form.requestSubmit())

        expect(input.value).toBe('not-a-color')
        expect(changes).toEqual([])
        expect(submittedValues).toEqual(['#abcdef'])
    })

    test('preserves formNoValidate when replaying a rejected required change', async () => {
        const user = userEvent.setup()
        const changes: string[] = []
        const submittedValues: Array<string | null> = []
        const submittedSubmitters: Array<HTMLElement | null> = []
        const submittedFormNoValidate: boolean[] = []

        render(
            <form
                aria-label="color form"
                onSubmit={(event) => {
                    event.preventDefault()
                    submittedFormNoValidate.push(event.currentTarget.noValidate)
                    submittedSubmitters.push(
                        (event.nativeEvent as SubmitEvent).submitter,
                    )
                    submittedValues.push(
                        new FormData(event.currentTarget).get('brandColor') as
                            | string
                            | null,
                    )
                }}
            >
                <CustomColorPicker
                    name="brandColor"
                    value=""
                    required
                    onValueChange={(value) => changes.push(value)}
                />
                <button type="submit" formNoValidate>
                    Skip validation
                </button>
            </form>,
        )

        const input = screen.getByPlaceholderText('#13ecd6')
        const form = screen.getByRole('form') as HTMLFormElement
        const submitter = screen.getByRole('button', {
            name: 'Skip validation',
        }) as HTMLButtonElement
        await user.click(input)
        await user.type(input, '#123456')

        act(() => form.requestSubmit(submitter))

        await waitFor(() => expect(submittedValues).toEqual(['']))
        expect(changes).toEqual(['#123456'])
        expect(submittedSubmitters).toEqual([submitter])
        expect(submittedFormNoValidate).toEqual([false])
    })

    test('does not submit an optimistic value when the controlled parent rejects Enter', async () => {
        const user = userEvent.setup()
        const changes: string[] = []
        const submittedValues: Array<string | null> = []

        render(
            <form
                aria-label="color form"
                onSubmit={(event) => {
                    event.preventDefault()
                    submittedValues.push(
                        new FormData(event.currentTarget).get('brandColor') as
                            | string
                            | null,
                    )
                }}
            >
                <CustomColorPicker
                    name="brandColor"
                    value="#abcdef"
                    onValueChange={(value) => changes.push(value)}
                />
                <button type="submit">Save</button>
            </form>,
        )

        const input = screen.getByPlaceholderText('#13ecd6') as HTMLInputElement
        const form = screen.getByRole('form') as HTMLFormElement
        await user.click(input)
        await user.clear(input)
        await user.type(input, '#123456')
        await user.keyboard('{Enter}')

        await waitFor(() => expect(input.value).toBe('#abcdef'))
        expect(changes).toEqual(['#123456'])
        expect(new FormData(form).get('brandColor')).toBe('#abcdef')
        expect(submittedValues).toEqual(['#abcdef'])
    })

    test('keeps external errors in native form validation', () => {
        const submittedValues: string[] = []

        render(
            <form
                aria-label="color form"
                onSubmit={(event) => {
                    event.preventDefault()
                    submittedValues.push('submitted')
                }}
            >
                <CustomColorPicker
                    name="brandColor"
                    value="#abcdef"
                    error="Choose an approved color"
                    onValueChange={() => undefined}
                />
                <button type="submit">Save</button>
            </form>,
        )

        const form = screen.getByRole('form') as HTMLFormElement

        act(() => form.requestSubmit())

        expect(submittedValues).toEqual([])
        expect(new FormData(form).get('brandColor')).toBe('#abcdef')
    })

    test('lets error=null clear native validation without submitting an invalid draft', async () => {
        const user = userEvent.setup()
        const changes: string[] = []
        const submittedValues: Array<string | null> = []

        render(
            <form
                aria-label="color form"
                onSubmit={(event) => {
                    event.preventDefault()
                    submittedValues.push(
                        new FormData(event.currentTarget).get('brandColor') as
                            | string
                            | null,
                    )
                }}
            >
                <CustomColorPicker
                    name="brandColor"
                    value="#abcdef"
                    required
                    error={null}
                    onValueChange={(value) => changes.push(value)}
                />
                <button type="submit">Save</button>
            </form>,
        )

        const input = screen.getByPlaceholderText('#13ecd6')
        const form = screen.getByRole('form') as HTMLFormElement
        await user.click(input)
        await user.clear(input)
        await user.type(input, 'not-a-color')

        act(() => form.requestSubmit())

        expect(changes).toEqual([])
        expect(submittedValues).toEqual(['#abcdef'])
    })

    test('replays submission with each accepted picker value in the same form', async () => {
        const submittedValues: Array<[string | null, string | null]> = []

        function Harness() {
            const [firstValue, setFirstValue] = useState('#111111')
            const [secondValue, setSecondValue] = useState('#222222')

            return (
                <form
                    aria-label="color form"
                    onSubmitCapture={(event) => {
                        const formData = new FormData(event.currentTarget)
                        submittedValues.push([
                            formData.get('firstColor') as string | null,
                            formData.get('secondColor') as string | null,
                        ])
                    }}
                    onSubmit={(event) => event.preventDefault()}
                >
                    <CustomColorPicker
                        name="firstColor"
                        value={firstValue}
                        onValueChange={setFirstValue}
                    />
                    <CustomColorPicker
                        name="secondColor"
                        value={secondValue}
                        onValueChange={setSecondValue}
                    />
                    <button type="submit">Save</button>
                </form>
            )
        }

        render(<Harness />)

        const [firstInput, secondInput] =
            screen.getAllByPlaceholderText('#13ecd6')
        const form = screen.getByRole('form') as HTMLFormElement

        act(() => {
            fireEvent.change(firstInput, { target: { value: '#333333' } })
            fireEvent.change(secondInput, { target: { value: '#444444' } })
            form.requestSubmit()
        })

        await waitFor(() => {
            expect(submittedValues).toEqual([['#333333', '#444444']])
        })
    })

    test('replays multiple dirty pickers without submitting a rejected sibling draft', async () => {
        const submittedValues: Array<[string | null, string | null]> = []
        const rejectedChanges: string[] = []

        function Harness() {
            const [firstValue, setFirstValue] = useState('#111111')

            return (
                <form
                    aria-label="color form"
                    onSubmit={(event) => {
                        event.preventDefault()
                        const formData = new FormData(event.currentTarget)
                        submittedValues.push([
                            formData.get('firstColor') as string | null,
                            formData.get('secondColor') as string | null,
                        ])
                    }}
                >
                    <CustomColorPicker
                        name="firstColor"
                        value={firstValue}
                        onValueChange={setFirstValue}
                    />
                    <CustomColorPicker
                        name="secondColor"
                        value="#222222"
                        onValueChange={(value) => rejectedChanges.push(value)}
                    />
                </form>
            )
        }

        render(<Harness />)

        const [firstInput, secondInput] =
            screen.getAllByPlaceholderText('#13ecd6')
        const form = screen.getByRole('form') as HTMLFormElement

        fireEvent.change(firstInput, { target: { value: '#333333' } })
        fireEvent.change(secondInput, { target: { value: '#444444' } })
        act(() => form.requestSubmit())

        await waitFor(() => {
            expect(submittedValues).toEqual([['#333333', '#222222']])
        })
        expect(rejectedChanges).toEqual(['#444444'])
        expect(new FormData(form).get('firstColor')).toBe('#333333')
        expect(new FormData(form).get('secondColor')).toBe('#222222')
    })

    test('uses sibling validation props updated by controlled acceptance before replay', async () => {
        const submittedValues: Array<[string | null, string | null]> = []

        function Harness() {
            const [firstValue, setFirstValue] = useState('#111111')
            const [secondError, setSecondError] = useState<string | undefined>(
                undefined,
            )

            return (
                <form
                    aria-label="color form"
                    onSubmit={(event) => {
                        event.preventDefault()
                        const formData = new FormData(event.currentTarget)
                        submittedValues.push([
                            formData.get('firstColor') as string | null,
                            formData.get('secondColor') as string | null,
                        ])
                    }}
                >
                    <CustomColorPicker
                        name="firstColor"
                        value={firstValue}
                        onValueChange={(nextValue) => {
                            setFirstValue(nextValue)
                            setSecondError('Choose an approved color')
                        }}
                    />
                    <CustomColorPicker
                        name="secondColor"
                        value="#222222"
                        error={secondError}
                        onValueChange={() => undefined}
                    />
                </form>
            )
        }

        render(<Harness />)

        const [firstInput, secondInput] =
            screen.getAllByPlaceholderText('#13ecd6')
        const form = screen.getByRole('form') as HTMLFormElement
        const validationInputs = document.querySelectorAll<HTMLInputElement>(
            'input[aria-hidden="true"]',
        )

        fireEvent.change(firstInput, { target: { value: '#333333' } })
        fireEvent.change(secondInput, { target: { value: '#444444' } })
        act(() => form.requestSubmit())

        await waitFor(() => {
            expect(validationInputs[1]?.validity.valid).toBe(false)
        })
        expect(submittedValues).toEqual([])
        expect(new FormData(form).get('firstColor')).toBe('#333333')
        expect(new FormData(form).get('secondColor')).toBe('#222222')
    })

    test('falls back safely if the original submitter is removed during controlled acceptance', async () => {
        const user = userEvent.setup()
        const submittedValues: Array<string | null> = []

        function Harness() {
            const [value, setValue] = useState('#abcdef')
            const [showSubmitter, setShowSubmitter] = useState(true)

            return (
                <form
                    aria-label="color form"
                    onSubmit={(event) => {
                        event.preventDefault()
                        submittedValues.push(
                            new FormData(event.currentTarget).get(
                                'brandColor',
                            ) as string | null,
                        )
                    }}
                >
                    <CustomColorPicker
                        name="brandColor"
                        value={value}
                        onValueChange={(nextValue) => {
                            setValue(nextValue)
                            setShowSubmitter(false)
                        }}
                    />
                    {showSubmitter && (
                        <button type="submit" name="intent" value="save">
                            Save
                        </button>
                    )}
                </form>
            )
        }

        render(<Harness />)

        const input = screen.getByPlaceholderText('#13ecd6')
        const form = screen.getByRole('form') as HTMLFormElement
        const submitter = screen.getByRole('button', {
            name: 'Save',
        }) as HTMLButtonElement
        await user.click(input)
        await user.clear(input)
        await user.type(input, '#123456')

        act(() => form.requestSubmit(submitter))

        await waitFor(() => expect(submittedValues).toEqual(['#123456']))
        expect(screen.queryByRole('button', { name: 'Save' })).toBeNull()
    })

    test('submits an accepted optional clear and the controlled value for a rejected clear', async () => {
        const user = userEvent.setup()
        const acceptedValues: Array<string | null> = []
        const rejectedSubmissions: Array<string | null> = []
        const changes: string[] = []

        function AcceptingForm() {
            const [value, setValue] = useState('#abcdef')

            return (
                <form
                    aria-label="accepting form"
                    onSubmit={(event) => {
                        event.preventDefault()
                        acceptedValues.push(
                            new FormData(event.currentTarget).get(
                                'brandColor',
                            ) as string | null,
                        )
                    }}
                >
                    <CustomColorPicker
                        name="brandColor"
                        value={value}
                        onValueChange={(nextValue) => {
                            changes.push(nextValue)
                            setValue(nextValue)
                        }}
                    />
                    <button type="submit">Save accepted</button>
                </form>
            )
        }

        function RejectingForm() {
            return (
                <form
                    aria-label="rejecting form"
                    onSubmit={(event) => {
                        event.preventDefault()
                        rejectedSubmissions.push(
                            new FormData(event.currentTarget).get(
                                'rejectedColor',
                            ) as string | null,
                        )
                    }}
                >
                    <CustomColorPicker
                        name="rejectedColor"
                        value="#abcdef"
                        onValueChange={(nextValue) => changes.push(nextValue)}
                    />
                    <button type="submit">Save rejected</button>
                </form>
            )
        }

        render(
            <>
                <AcceptingForm />
                <RejectingForm />
            </>,
        )

        const acceptingInput = screen.getAllByPlaceholderText(
            '#13ecd6',
        )[0] as HTMLInputElement
        const rejectingInput = screen.getAllByPlaceholderText(
            '#13ecd6',
        )[1] as HTMLInputElement
        const acceptingForm = screen.getByRole('form', {
            name: 'accepting form',
        }) as HTMLFormElement
        const rejectingForm = screen.getByRole('form', {
            name: 'rejecting form',
        }) as HTMLFormElement

        await user.click(acceptingInput)
        await user.clear(acceptingInput)
        act(() => acceptingForm.requestSubmit())

        await waitFor(() => expect(acceptedValues).toEqual(['']))
        expect(new FormData(acceptingForm).get('brandColor')).toBe('')

        await user.click(rejectingInput)
        await user.clear(rejectingInput)
        act(() => rejectingForm.requestSubmit())

        await waitFor(() => expect(rejectingInput.value).toBe('#abcdef'))
        expect(new FormData(rejectingForm).get('rejectedColor')).toBe('#abcdef')
        expect(rejectedSubmissions).toEqual(['#abcdef'])
        expect(changes).toEqual(['', ''])
    })

    test('does not call onValueChange when blur leaves the controlled color unchanged', () => {
        const changes: string[] = []

        render(
            <CustomColorPicker
                value="#abcdef"
                onValueChange={(value) => changes.push(value)}
            />,
        )

        fireEvent.blur(screen.getByPlaceholderText('#13ecd6'))

        expect(changes).toEqual([])
    })

    test('omits disabled values and retains read-only values in forms', () => {
        const { rerender } = render(
            <form aria-label="color form">
                <CustomColorPicker
                    name="brandColor"
                    value="#13ecd6"
                    onValueChange={() => undefined}
                    disabled
                />
            </form>,
        )

        const form = screen.getByRole('form') as HTMLFormElement

        expect(new FormData(form).get('brandColor')).toBeNull()

        rerender(
            <form aria-label="color form">
                <CustomColorPicker
                    name="brandColor"
                    value="#13ecd6"
                    onValueChange={() => undefined}
                    readOnly
                />
            </form>,
        )

        expect(new FormData(form).get('brandColor')).toBe('#13ecd6')
    })

    test('reports disabled fields as excluded from validation', async () => {
        const validityChanges: boolean[] = []
        const { rerender } = render(
            <CustomColorPicker
                value="invalid"
                onValueChange={() => undefined}
                onValidityChange={(isValid) => validityChanges.push(isValid)}
                disabled
            />,
        )

        expect(validityChanges).toEqual([true])

        rerender(
            <CustomColorPicker
                value="invalid"
                onValueChange={() => undefined}
                onValidityChange={(isValid) => validityChanges.push(isValid)}
            />,
        )

        await waitFor(() => {
            expect(validityChanges).toEqual([true, false])
        })
    })

    test('reports read-only fields as valid when native forms exclude them from validation', () => {
        const validityChanges: boolean[] = []

        render(
            <form aria-label="color form">
                <CustomColorPicker
                    name="brandColor"
                    value=""
                    onValueChange={() => undefined}
                    onValidityChange={(isValid) =>
                        validityChanges.push(isValid)
                    }
                    required
                    readOnly
                />
            </form>,
        )

        const form = screen.getByRole('form') as HTMLFormElement
        const validationInput = form.querySelector(
            'input[name="brandColor"]',
        ) as HTMLInputElement

        expect(validationInput.willValidate).toBe(false)
        expect(form.checkValidity()).toBe(true)
        expect(new FormData(form).get('brandColor')).toBe('')
        expect(validityChanges).toEqual([true])
    })

    test('moves focus into the color area and restores it on Escape', async () => {
        const user = userEvent.setup()

        render(
            <CustomColorPicker
                value="#808080"
                onValueChange={() => undefined}
                showPresets={false}
            />,
        )

        const trigger = screen.getByRole('button', {
            name: 'Farbe auswählen',
        })

        await user.click(trigger)

        const colorArea = screen.getByRole('button', {
            name: /Farbfläche/,
        })
        expect(document.activeElement).toBe(colorArea)

        await user.keyboard('{Escape}')

        expect(screen.queryByRole('dialog')).toBeNull()
        await waitFor(() => expect(document.activeElement).toBe(trigger))
    })

    test('supports precise and coarse keyboard changes in the color area', () => {
        const changes: string[] = []

        function Harness() {
            const [value, setValue] = useState('#808080')

            return (
                <CustomColorPicker
                    value={value}
                    onValueChange={(nextValue) => {
                        changes.push(nextValue)
                        setValue(nextValue)
                    }}
                    showPresets={false}
                />
            )
        }

        render(<Harness />)

        fireEvent.click(screen.getByRole('button', { name: 'Farbe auswählen' }))

        const colorArea = screen.getByRole('button', {
            name: /Farbfläche/,
        })
        const marker = colorArea.querySelector('span') as HTMLSpanElement

        expect(marker.style.left).toBe('0%')
        expect(marker.style.top).toBe('50%')

        fireEvent.keyDown(colorArea, { key: 'ArrowRight' })
        expect(marker.style.left).toBe('1%')

        fireEvent.keyDown(colorArea, { key: 'ArrowLeft' })
        expect(marker.style.left).toBe('0%')

        fireEvent.keyDown(colorArea, { key: 'ArrowDown' })
        expect(marker.style.top).toBe('51%')

        fireEvent.keyDown(colorArea, { key: 'ArrowUp' })
        expect(marker.style.top).toBe('50%')

        fireEvent.keyDown(colorArea, { key: 'ArrowRight', shiftKey: true })
        expect(marker.style.left).toBe('10%')

        fireEvent.keyDown(colorArea, { key: 'PageUp' })
        expect(marker.style.top).toBe('40%')

        fireEvent.keyDown(colorArea, { key: 'PageDown' })
        expect(marker.style.top).toBe('50%')

        fireEvent.keyDown(colorArea, { key: 'Home' })
        expect(marker.style.left).toBe('0%')

        fireEvent.keyDown(colorArea, { key: 'End' })
        expect(marker.style.left).toBe('100%')

        fireEvent.keyDown(colorArea, { key: 'ArrowRight' })
        expect(marker.style.left).toBe('100%')
        expect(changes).toHaveLength(9)
    })

    test('marks equivalent short HEX and RGB presets as active', () => {
        render(
            <CustomColorPicker
                value="#aabbcc"
                onValueChange={() => undefined}
                presets={['#abc', 'rgb(170, 187, 204)']}
                showInput={false}
            />,
        )

        expect(
            screen
                .getByRole('button', { name: 'Farbe #abc auswählen' })
                .getAttribute('aria-pressed'),
        ).toBe('true')
        expect(
            screen
                .getByRole('button', {
                    name: 'Farbe rgb(170, 187, 204) auswählen',
                })
                .getAttribute('aria-pressed'),
        ).toBe('true')
    })

    test('exposes saturation and brightness as labeled sliders', () => {
        const changes: string[] = []

        render(
            <CustomColorPicker
                value="#abcdef"
                onValueChange={(value) => changes.push(value)}
                showPresets={false}
            />,
        )

        fireEvent.click(screen.getByRole('button', { name: 'Farbe auswählen' }))

        const saturation = screen.getByRole('slider', { name: 'Sättigung' })
        const brightness = screen.getByRole('slider', { name: 'Helligkeit' })

        expect(Number((saturation as HTMLInputElement).value)).toBeCloseTo(
            (68 / 239) * 100,
            8,
        )
        expect(Number((brightness as HTMLInputElement).value)).toBeCloseTo(
            (239 / 255) * 100,
            8,
        )
        expect(saturation.getAttribute('min')).toBe('0')
        expect(saturation.getAttribute('max')).toBe('100')
        expect(brightness.getAttribute('min')).toBe('0')
        expect(brightness.getAttribute('max')).toBe('100')
        expect(saturation.getAttribute('aria-valuetext')).toBe('28%')
        expect(brightness.getAttribute('aria-valuetext')).toBe('94%')

        fireEvent.change(saturation, { target: { value: '50.5' } })
        expect(changes.at(-1)).not.toBe('#abcdef')
        fireEvent.change(brightness, { target: { value: '72.25' } })
        expect(changes).toHaveLength(2)
    })

    test('lets an external error control reported validity', async () => {
        const validityChanges: boolean[] = []

        function Harness() {
            const [error, setError] = useState<string | null | undefined>(
                undefined,
            )

            return (
                <>
                    <CustomColorPicker
                        value="#13ecd6"
                        onValueChange={() => undefined}
                        onValidityChange={(isValid) =>
                            validityChanges.push(isValid)
                        }
                        error={error}
                    />
                    <button
                        type="button"
                        onClick={() => setError('Server error')}
                    >
                        Set error
                    </button>
                    <button type="button" onClick={() => setError(null)}>
                        Clear error
                    </button>
                </>
            )
        }

        const user = userEvent.setup()
        render(<Harness />)

        expect(validityChanges).toEqual([true])

        await user.click(screen.getByRole('button', { name: 'Set error' }))
        await waitFor(() => {
            expect(validityChanges).toEqual([true, false])
        })

        await user.click(screen.getByRole('button', { name: 'Clear error' }))
        await waitFor(() => {
            expect(validityChanges).toEqual([true, false, true])
        })
    })
})
