import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type {
    EyeDropperWindow,
    UseEyeDropperOptions,
    EyeDropperResult,
} from '../Types/eyedropper.types.ts'

/** One abortable native selection per picker session, using committed callbacks. */
export function useEyeDropper(options: UseEyeDropperOptions): EyeDropperResult {
    const latestRef = useRef(options)
    const requestRef = useRef<AbortController | null>(null)
    const mountedRef = useRef(false)
    const [isPending, setIsPending] = useState(false)
    const cancel = useCallback(() => {
        const controller = requestRef.current
        requestRef.current = null
        controller?.abort()
        if (mountedRef.current) setIsPending(false)
    }, [])
    useLayoutEffect(() => {
        mountedRef.current = true
        return () => {
            mountedRef.current = false
            cancel()
        }
    }, [cancel])
    useLayoutEffect(() => {
        latestRef.current = options
        if (!options.enabled) cancel()
    }, [options, cancel])
    const select = useCallback(async () => {
        if (
            !mountedRef.current ||
            !latestRef.current.enabled ||
            requestRef.current
        )
            return
        const EyeDropper = (window as EyeDropperWindow).EyeDropper
        if (!EyeDropper) return
        const controller = new AbortController()
        requestRef.current = controller
        setIsPending(true)
        try {
            const result = await new EyeDropper().open({
                signal: controller.signal,
            })
            if (
                !mountedRef.current ||
                controller.signal.aborted ||
                requestRef.current !== controller ||
                !latestRef.current.enabled
            )
                return
            latestRef.current.onSelect(result.sRGBHex)
            // A consumer may synchronously unmount or close/reopen while accepting the color.
            if (
                mountedRef.current &&
                requestRef.current === controller &&
                !controller.signal.aborted &&
                latestRef.current.enabled
            )
                latestRef.current.onSuccess()
        } catch {
            // Native cancellation or failure leaves the current color untouched.
        } finally {
            if (requestRef.current === controller) {
                requestRef.current = null
                if (mountedRef.current) setIsPending(false)
            }
        }
    }, [])
    return { state: { isPending }, handler: { select, cancel } }
}
