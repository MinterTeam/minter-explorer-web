import axios, {AxiosError} from 'axios';
// import {cacheAdapterEnhancer, Cache} from 'axios-extensions';
import {SMART_WALLET_RELAY_API_URL} from "~/assets/variables.js";
import addToCamelInterceptor from '~/assets/axios-to-camel.js';

const instance = axios.create({
    baseURL: SMART_WALLET_RELAY_API_URL,
    // adapter: cacheAdapterEnhancer(axios.defaults.adapter, { enabledByDefault: false}),
});
addToCamelInterceptor(instance);

// const fastCache = new Cache({maxAge: 5 * 1000});


/**
 * @param {string} inputTxHash
 * @return {Promise<SmartWalletRelayTxStatus>}
 */
export function getRelayTxStatus(inputTxHash) {
    return instance.get(`tx_status/${inputTxHash}`, {
            // cache: fastCache,
        })
        .then((response) => {
            return response.data;
        });
}

/**
 * @enum {string}
 */
export const SMART_WALLET_RELAY_TX_STATUS = {
    NOT_FOUND: 'not_found',
    EXECUTED: 'executed',
    FAILED: 'failed',
};



/**
 * @typedef {object} SmartWalletRelayTxStatus
 * @property {SMART_WALLET_RELAY_TX_STATUS} status
 * @property {string} [reason] - if failed
 * @property {string} [txHash] - out tx hash if executed
 */

