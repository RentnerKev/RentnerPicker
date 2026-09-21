export interface ResolvedFieldError {
    error: string | null
    hasError: boolean
}

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

export function mergeAriaIds(
    ...ids: Array<string | undefined>
): string | undefined {
    const mergedIds = ids
        .flatMap((id) => id?.split(/\s+/) ?? [])
        .filter(Boolean)

    return mergedIds.length > 0 ? [...new Set(mergedIds)].join(' ') : undefined
}
