import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'

export function useConsumerAppLogic() {
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

    function handleBrandSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const submitted = String(
            new FormData(event.currentTarget).get('brandColor') ?? '',
        )
        setBrandSubmissions((values) => [...values, submitted])
    }

    function handleColorChange(nextColor: string) {
        if (acceptColorChanges) {
            setColor(nextColor)
        }
    }

    function handleOptionalSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setOptionalSubmission(
            String(
                new FormData(event.currentTarget).get('optionalColor') ?? '',
            ),
        )
        setOptionalSubmitCount((count) => count + 1)
    }

    function handleRequiredSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setRequiredSubmission(
            String(
                new FormData(event.currentTarget).get('requiredColor') ?? '',
            ),
        )
        setRequiredSubmitCount((count) => count + 1)
    }

    function handleMultipleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setMultiSubmission(
            JSON.stringify(
                Object.fromEntries(new FormData(event.currentTarget)),
            ),
        )
        setMultiSubmitCount((count) => count + 1)
    }

    function handleRemovingSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setRemovingSubmission(
            String(new FormData(event.currentTarget).get('remaining')),
        )
        setRemovingSubmitCount((count) => count + 1)
    }

    function handleRepeatedSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const submitted = String(
            new FormData(event.currentTarget).get('repeatedColor'),
        )
        setRepeatedSubmissions((values) => [...values, submitted])
        setRepeatedSubmitter(
            (event.nativeEvent as SubmitEvent).submitter?.textContent ?? '',
        )
    }

    function handleRepeatedColorChange(nextColor: string) {
        setRepeatedColor(nextColor)
        setRepeatedChanges((count) => count + 1)
    }

    return {
        state: {
            acceptColorChanges,
            color,
            brandSubmissions,
            optionalSubmission,
            optionalSubmitCount,
            requiredColor,
            requiredSubmission,
            requiredSubmitCount,
            firstColor,
            secondColor,
            multiSubmission,
            multiSubmitCount,
            showRemovingPicker,
            removingSubmission,
            removingSubmitCount,
            repeatedColor,
            repeatedChanges,
            repeatedSubmissions,
            repeatedSubmitter,
            showRefPicker,
            refEventsText,
            objectRefStatus,
        },
        handler: {
            handleBrandSubmit,
            handleColorChange,
            handleOptionalSubmit,
            handleRequiredSubmit,
            handleMultipleSubmit,
            handleRemovingSubmit,
            handleRepeatedSubmit,
            handleRepeatedColorChange,
        },
        setter: {
            setAcceptColorChanges,
            setRequiredColor,
            setFirstColor,
            setSecondColor,
            setShowRemovingPicker,
            setRefMode,
            setShowRefPicker,
        },
        refs: { triggerRef },
    }
}
