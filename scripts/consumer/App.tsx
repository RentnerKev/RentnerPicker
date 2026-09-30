import { useCallback, useEffect, useRef, useState } from 'react'
import { CustomColorPicker } from '@rentnerkev/picker'

export function App() {
    const [acceptColorChanges, setAcceptColorChanges] = useState(false)
    const [color, setColor] = useState('#abcdef')
    const [brandSubmissions, setBrandSubmissions] = useState<string[]>([])
    const [optionalSubmission, setOptionalSubmission] = useState('')
    const [optionalSubmitCount, setOptionalSubmitCount] = useState(0)
    const [requiredColor, setRequiredColor] = useState('')
    const [requiredSubmission, setRequiredSubmission] = useState('')
    const [requiredSubmitCount, setRequiredSubmitCount] = useState(0)
    const [firstColor, setFirstColor] = useState('#111111')
    const [secondColor, setSecondColor] = useState('#222222')
    const [multiSubmission, setMultiSubmission] = useState('')
    const [multiSubmitCount, setMultiSubmitCount] = useState(0)
    const [showRemovingPicker, setShowRemovingPicker] = useState(true)
    const [removingSubmission, setRemovingSubmission] = useState('')
    const [removingSubmitCount, setRemovingSubmitCount] = useState(0)
    const [repeatedColor, setRepeatedColor] = useState('#556677')
    const [repeatedChanges, setRepeatedChanges] = useState(0)
    const [repeatedSubmissions, setRepeatedSubmissions] = useState<string[]>([])
    const [repeatedSubmitter, setRepeatedSubmitter] = useState('')
    const [refMode, setRefMode] = useState<'cleanup' | 'legacy' | 'object'>(
        'cleanup',
    )
    const [showRefPicker, setShowRefPicker] = useState(true)
    const [refEventsText, setRefEventsText] = useState('')
    const [objectRefStatus, setObjectRefStatus] = useState('detached')
    const refEvents = useRef<string[]>([])
    const objectTriggerRef = useRef<HTMLButtonElement>(null)
    const cleanupTriggerRef = useCallback((node: HTMLButtonElement | null) => {
        if (node) {
            refEvents.current.push('cleanup:attached')
            return () => {
                refEvents.current.push('cleanup:cleanup')
            }
        }

        refEvents.current.push('cleanup:null')
    }, [])
    const legacyTriggerRef = useCallback((node: HTMLButtonElement | null) => {
        refEvents.current.push(node ? 'legacy:attached' : 'legacy:null')
    }, [])

    useEffect(() => {
        setRefEventsText(refEvents.current.join(','))
        setObjectRefStatus(
            refMode === 'object' && showRefPicker && objectTriggerRef.current
                ? 'attached'
                : 'detached',
        )
    }, [refMode, showRefPicker])

    const triggerRef =
        refMode === 'cleanup'
            ? cleanupTriggerRef
            : refMode === 'legacy'
              ? legacyTriggerRef
              : objectTriggerRef

    return (
        <div className="bg-background-dark text-white">
            <label>
                <input
                    type="checkbox"
                    checked={acceptColorChanges}
                    onChange={(event) =>
                        setAcceptColorChanges(event.target.checked)
                    }
                />
                Accept parent color changes
            </label>

            <form
                aria-label="Accepted color form"
                onSubmit={(event) => {
                    event.preventDefault()
                    const submitted = String(
                        new FormData(event.currentTarget).get('brandColor') ??
                            '',
                    )
                    setBrandSubmissions((values) => [...values, submitted])
                }}
            >
                <CustomColorPicker
                    name="brandColor"
                    aria-label="Brand color"
                    locale="en"
                    value={color}
                    onValueChange={(nextColor) => {
                        if (acceptColorChanges) {
                            setColor(nextColor)
                        }
                    }}
                />
                <button type="submit">Submit brand color</button>
            </form>
            <output
                aria-label="Brand submission count"
                data-testid="brand-submit-count"
            >
                {brandSubmissions.length}
            </output>
            <output
                aria-label="Last brand submission"
                data-testid="brand-submission"
            >
                {brandSubmissions.at(-1) ?? ''}
            </output>

            <form
                aria-label="Optional color form"
                onSubmit={(event) => {
                    event.preventDefault()
                    setOptionalSubmission(
                        String(
                            new FormData(event.currentTarget).get(
                                'optionalColor',
                            ) ?? '',
                        ),
                    )
                    setOptionalSubmitCount((count) => count + 1)
                }}
            >
                <CustomColorPicker
                    name="optionalColor"
                    aria-label="Optional color"
                    locale="en"
                    value="#abcdef"
                    onValueChange={() => undefined}
                />
                <button type="submit">Submit optional color</button>
            </form>
            <output
                aria-label="Optional submission count"
                data-testid="optional-submit-count"
            >
                {optionalSubmitCount}
            </output>
            <output
                aria-label="Optional submission"
                data-testid="optional-submission"
            >
                {optionalSubmission}
            </output>

            <form
                aria-label="Required color form"
                onSubmit={(event) => {
                    event.preventDefault()
                    setRequiredSubmission(
                        String(
                            new FormData(event.currentTarget).get(
                                'requiredColor',
                            ) ?? '',
                        ),
                    )
                    setRequiredSubmitCount((count) => count + 1)
                }}
            >
                <CustomColorPicker
                    name="requiredColor"
                    aria-label="Required color"
                    locale="en"
                    required
                    value={requiredColor}
                    onValueChange={setRequiredColor}
                />
                <button type="submit">Submit required color</button>
            </form>
            <output
                aria-label="Required submission count"
                data-testid="required-submit-count"
            >
                {requiredSubmitCount}
            </output>
            <output
                aria-label="Required submission"
                data-testid="required-submission"
            >
                {requiredSubmission}
            </output>

            <form
                aria-label="Multiple color form"
                onSubmit={(event) => {
                    event.preventDefault()
                    setMultiSubmission(
                        JSON.stringify(
                            Object.fromEntries(
                                new FormData(event.currentTarget),
                            ),
                        ),
                    )
                    setMultiSubmitCount((count) => count + 1)
                }}
            >
                <CustomColorPicker
                    name="firstColor"
                    aria-label="First color"
                    locale="en"
                    value={firstColor}
                    onValueChange={setFirstColor}
                />
                <CustomColorPicker
                    name="secondColor"
                    aria-label="Second color"
                    locale="en"
                    value={secondColor}
                    onValueChange={setSecondColor}
                />
                <button type="submit">Submit multiple colors</button>
            </form>
            <output
                aria-label="Multiple color submission count"
                data-testid="multi-submit-count"
            >
                {multiSubmitCount}
            </output>
            <output
                aria-label="Multiple color submission"
                data-testid="multi-submission"
            >
                {multiSubmission}
            </output>

            <form
                aria-label="Removing color form"
                onSubmit={(event) => {
                    event.preventDefault()
                    setRemovingSubmission(
                        String(
                            new FormData(event.currentTarget).get('remaining'),
                        ),
                    )
                    setRemovingSubmitCount((count) => count + 1)
                }}
            >
                {showRemovingPicker && (
                    <CustomColorPicker
                        name="removingColor"
                        aria-label="Removing color"
                        locale="en"
                        value="#445566"
                        onValueChange={() => setShowRemovingPicker(false)}
                    />
                )}
                <input type="hidden" name="remaining" value="retained" />
                <button type="submit">Submit removing color</button>
            </form>
            <output
                aria-label="Removing color submission count"
                data-testid="removing-submit-count"
            >
                {removingSubmitCount}
            </output>
            <output
                aria-label="Remaining form value"
                data-testid="removing-submission"
            >
                {removingSubmission}
            </output>

            <form
                aria-label="Repeated color form"
                onSubmit={(event) => {
                    event.preventDefault()
                    const submitted = String(
                        new FormData(event.currentTarget).get('repeatedColor'),
                    )
                    setRepeatedSubmissions((values) => [...values, submitted])
                    setRepeatedSubmitter(
                        (event.nativeEvent as SubmitEvent).submitter
                            ?.textContent ?? '',
                    )
                }}
            >
                <CustomColorPicker
                    name="repeatedColor"
                    aria-label="Repeated color"
                    locale="en"
                    value={repeatedColor}
                    onValueChange={(nextColor) => {
                        setRepeatedColor(nextColor)
                        setRepeatedChanges((count) => count + 1)
                    }}
                />
                <button type="submit">Submit repeated color</button>
            </form>
            <output
                aria-label="Repeated color change count"
                data-testid="repeated-change-count"
            >
                {repeatedChanges}
            </output>
            <output
                aria-label="Repeated color submissions"
                data-testid="repeated-submissions"
            >
                {JSON.stringify(repeatedSubmissions)}
            </output>
            <output
                aria-label="Repeated submitter"
                data-testid="repeated-submitter"
            >
                {repeatedSubmitter}
            </output>

            <CustomColorPicker
                aria-label="Equivalent preset"
                locale="en"
                value="#aabbcc"
                presets={['#abc']}
                onValueChange={() => undefined}
                showInput={false}
            />

            <section aria-label="Trigger ref lifecycle">
                <div>
                    <button type="button" onClick={() => setRefMode('legacy')}>
                        Use legacy trigger ref
                    </button>
                    <button type="button" onClick={() => setRefMode('object')}>
                        Use object trigger ref
                    </button>
                    <button type="button" onClick={() => setRefMode('cleanup')}>
                        Use cleanup trigger ref
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowRefPicker(false)}
                    >
                        Remove ref target
                    </button>
                </div>
                {showRefPicker && (
                    <CustomColorPicker
                        aria-label="Reference color"
                        locale="en"
                        value="#abcdef"
                        onValueChange={() => undefined}
                        showInput={false}
                        triggerRef={triggerRef}
                    />
                )}
                <output data-testid="trigger-ref-events">
                    {refEventsText}
                </output>
                <output data-testid="trigger-object-ref-status">
                    {objectRefStatus}
                </output>
            </section>
        </div>
    )
}
