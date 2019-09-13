export default {
    SET_VALIDATOR_LIST(state, validatorList) {
        state.validatorList = validatorList;
    },
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
    /**
     * Show snackbar if it is inactive
     */
    SET_SNACKBAR_ACTIVE(state) {
        state.isSnackbarActive = true;
    },
    /**
     * Set snackbar inactive so it can react to next SET_SNACKBAR_ACTIVE call
     */
    SET_SNACKBAR_INACTIVE(state) {
        state.isSnackbarActive = false;
    },
};
