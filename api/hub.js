import axios from 'axios';
import {cacheAdapterEnhancer, Cache} from 'axios-extensions';
import {HUB_API_URL} from "~/assets/variables.js";
import addToCamelInterceptor from '~/assets/to-camel.js';

const instance = axios.create({
    baseURL: HUB_API_URL,
    adapter: cacheAdapterEnhancer(axios.defaults.adapter, { enabledByDefault: false}),
});
addToCamelInterceptor(instance);



/**
 * @return {Promise<Array<HubCoinItem>>}
 */
// export function getOracleCoinList() {
//     return Promise.all([_getOracleCoinList(), getCoinList()])
//         .then(([oracleCoinList, minterCoinList]) => {
//             oracleCoinList.forEach((oracleCoin) => {
//                 const minterCoin = minterCoinList.find((item) => item.id === Number(oracleCoin.minterId));
//                 oracleCoin.symbol = minterCoin?.symbol;
//             });
//             // filter out not existent coins
//             return oracleCoinList.filter((item) => item.symbol);
//         });
// }

// 1 min cache
const coinsCache = new Cache({maxAge: 1 * 60 * 1000});

/**
 * @return {Promise<Array<HubCoinItem>>}
 */
export function _getOracleCoinList() {
    return instance.get('oracle/coins', {
            cache: coinsCache,
        })
        .then((response) => {
            return response.data.result;
        });
}



function wait(time) {
    return new Promise((resolve) => {
        setTimeout(resolve, time);
    });
}

/**
 * @typedef {object} HubCoinItem
 * @property {string} symbol - minter symbol
 * @property {string} denom - eth symbol
 * @property {string} ethAddr
 * @property {string} minterId
 * @property {string} ethDecimals
 * @property {string|number} customCommission
 */
