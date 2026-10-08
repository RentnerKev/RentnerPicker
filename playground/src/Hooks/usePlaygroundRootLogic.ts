import type { PlaygroundRootLogicResult } from '../Types/playground.types.ts'

export function usePlaygroundRootLogic(): PlaygroundRootLogicResult {
    return {
        state: {
            readOnly:
                new URLSearchParams(window.location.search).get('fixture') ===
                'read-only',
        },
    }
}
