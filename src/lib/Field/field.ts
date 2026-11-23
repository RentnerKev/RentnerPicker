import type { ResolvedFieldError } from './Types/field.types.ts'
export type { ResolvedFieldError } from './Types/field.types.ts'
export function resolveFieldError(
    internalError: string | null,
    externalError: string | null | undefined,
    isTouched: boolean,
): ResolvedFieldError {
    const error = externalError !== undefined ? externalError : internalError

    return {
        error,
        hasError: Boolean(error) && (externalError !== undefined || isTouched),
    }
}

const WHITESPACE_PATTERN = /\s/
const WHITESPACE_SPLIT_PATTERN = /\s+/

export function mergeAriaIds(
    ...ids: Array<string | undefined>
): string | undefined {
    let first: string | undefined
    let result: string[] | undefined
    let seen: Set<string> | undefined

    for (let index = 0; index < ids.length; index++) {
        const raw = ids[index]
        if (!raw) continue
        if (!WHITESPACE_PATTERN.test(raw)) {
            if (first === undefined) {
                first = raw
            } else if (!result) {
                if (raw !== first) result = [first, raw]
            } else if (seen) {
                if (!seen.has(raw)) {
                    seen.add(raw)
                    result.push(raw)
                }
            } else if (!result.includes(raw)) {
                result.push(raw)
                if (result.length > 4) seen = new Set(result)
            }
            continue
        }
        const parts = raw.split(WHITESPACE_SPLIT_PATTERN)
        for (let partIndex = 0; partIndex < parts.length; partIndex++) {
            const token = parts[partIndex]
            if (!token) continue
            if (first === undefined) {
                first = token
            } else if (!result) {
                if (token !== first) result = [first, token]
            } else if (seen) {
                if (!seen.has(token)) {
                    seen.add(token)
                    result.push(token)
                }
            } else if (!result.includes(token)) {
                result.push(token)
                if (result.length > 4) seen = new Set(result)
            }
        }
    }

    return result ? result.join(' ') : first
}
