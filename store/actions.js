import {getValidatorList, getStatus} from '~/api/index.js';

export default {
    FETCH_VALIDATOR_LIST({ commit }) {
        return getValidatorList()
            .then((validatorList) => {
                commit('SET_VALIDATOR_LIST', validatorList);
                return validatorList;
            });
    },
    FETCH_STATUS({ commit }) {
        return getStatus()
            .then((statusData) => {
                commit('SET_STATUS', statusData);
                return statusData;
            });
    },
};
