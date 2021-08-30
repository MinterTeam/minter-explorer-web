import {getValidatorMetaList} from '~/api/explorer.js';

export default {
    FETCH_VALIDATOR_META_LIST({ commit }) {
        return getValidatorMetaList()
            .then((validatorList) => {
                commit('SET_VALIDATOR_META_LIST', validatorList);
                return validatorList;
            });
    },
};
