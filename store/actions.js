import {getValidatorList} from '~/api';

export default {
    FETCH_VALIDATOR_LIST({ commit }) {
        return getValidatorList()
            .then((validatorList) => {
                commit('SET_VALIDATOR_LIST', validatorList);
                return validatorList;
            });
    },
};
