export function createStore(initialState) {
    let state = initialState;
    const listeners = new Set();

    function setState(newState) {
        state = { ...state, ...newState };
        listeners.forEach(listener => listener(state));
    }

    function getState() {
        return state;
    }

    function subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
    }

    return { setState, getState, subscribe };
}

