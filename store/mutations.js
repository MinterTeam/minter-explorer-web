export default {
    PUSH_HISTORY: (state, historyItem) => {
        // pushstate, clear detached chain
        state.history.push(historyItem);
        state.detachedHistory = [];
    },
    POP_HISTORY: (state, {isForward} = {}) => {
        if (isForward) {
            // popstate forward
            const detachedItem = state.detachedHistory.shift();
            if (detachedItem) {
                state.history.push(detachedItem);
            }
        } else {
            // popstate back
            const historyItem = state.history.pop();
            if (historyItem) {
                state.detachedHistory.unshift(historyItem);
            }
        }
    },
};
