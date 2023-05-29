import axios, {AxiosError} from 'axios';
// import {cacheAdapterEnhancer, Cache} from 'axios-extensions';
import {HUB_CHAIN_BY_ID, SMART_WALLET_RELAY_API_URL} from "~/assets/variables.js";
import addToCamelInterceptor from '~/assets/axios-to-camel.js';

const instance = axios.create({
    baseURL: SMART_WALLET_RELAY_API_URL,
    // adapter: cacheAdapterEnhancer(axios.defaults.adapter, { enabledByDefault: false}),
});
addToCamelInterceptor(instance);

// const fastCache = new Cache({maxAge: 5 * 1000});


/**
 * @param {ChainId} chainId
 * @param {string} inputTxHash
 * @return {Promise<SmartWalletRelayTxStatus>}
 */
export function getRelayTxStatus(chainId, inputTxHash) {
    const hubNetworkSlug = HUB_CHAIN_BY_ID[chainId].hubNetworkSlug;
    return instance.get(`${hubNetworkSlug}/tx_status/${inputTxHash}`, {
            // cache: fastCache,
        })
        .then((response) => {
            // if (response.data.status === SMART_WALLET_RELAY_TX_STATUS.NOT_FOUND) {
            //     throw new Error(`${hubNetworkSlug} tx not found`);
            // }
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

