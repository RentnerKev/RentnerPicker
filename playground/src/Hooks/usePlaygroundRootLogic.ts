export function usePlaygroundRootLogic() {
    return {
        state: {
            readOnly:
                new URLSearchParams(window.location.search).get('fixture') ===
                'read-only',
        },
    }
}
