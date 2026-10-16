import type { PlaygroundRootLogicResult } from '../Types/playground.types.ts'

export function usePlaygroundRootLogic(): PlaygroundRootLogicResult {
    return {
        state: {
            shadowPortal:
                new URLSearchParams(window.location.search).get('fixture') ===
                'shadow-portal',
            readOnly:
                new URLSearchParams(window.location.search).get('fixture') ===
                'read-only',
        },
    }
}
