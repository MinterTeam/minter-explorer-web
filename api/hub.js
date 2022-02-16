import axios from 'axios';
import {cacheAdapterEnhancer, Cache} from 'axios-extensions';
import stripZeros from 'pretty-num/src/strip-zeros.js';
import {getCoinList} from '@/api/explorer.js';
import Big from '~/assets/big.js';
import {HUB_API_URL, HUB_CHAIN_ID, NETWORK, MAINNET, BASE_COIN} from "~/assets/variables.js";
import addToCamelInterceptor from '~/assets/axios-to-camel.js';

const instance = axios.create({
    baseURL: HUB_API_URL,
    adapter: cacheAdapterEnhancer(axios.defaults.adapter, { enabledByDefault: false}),
});
addToCamelInterceptor(instance);

const fastCache = new Cache({maxAge: 5 * 1000});

/**
 * @param {HUB_CHAIN_ID} network
 * @return {Promise<{min: string, fast: string}>}
 */
export function getOracleFee(network) {
    return instance.get(`oracle/v1/${network}_fee`, {
            cache: fastCache,
        })
        .then((response) => {
            return response.data;
        });
}


/**
 * @return {Promise<Array<HubCoinItem>>}
 */
export function getOracleCoinList() {
    return Promise.all([_getOracleCoinListGroupedByMinter(), getCoinList({skipMeta: true})])
        .then(([oracleCoinList, minterCoinList]) => {
            oracleCoinList.forEach((oracleCoin) => {
                const minterCoin = minterCoinList.find((item) => item.id === Number(oracleCoin.minterId));

                if (minterCoin) {
                    oracleCoin.symbol = minterCoin.symbol;
                    oracleCoin.universalSymbol = getUniversalSymbol(oracleCoin);
                }
            });

            return oracleCoinList
                // filter out not existent coins
                .filter((item) => item.symbol)
                .sort((a, b) => {
                    // base coin goes first
                    if (a.symbol === BASE_COIN) {
                        return -1;
                    } else if (b.symbol === BASE_COIN) {
                        return 1;
                    }

                    // HUB goes second
                    if (a.symbol === 'HUB') {
                        return -1;
                    } else if (b.symbol === 'HUB') {
                        return 1;
                    }

                    return 0;
                });
        });
}

/**
 * @param {HubCoinItem} hubCoin
 * @return {string|*}
 */
function getUniversalSymbol(hubCoin) {
    if (hubCoin[HUB_CHAIN_ID.ETHEREUM]) {
        if (hubCoin[HUB_CHAIN_ID.ETHEREUM].denom === 'oneinch') {
            return '1INCH';
        }

        return hubCoin[HUB_CHAIN_ID.ETHEREUM].denom.toUpperCase();
    }

    if (hubCoin[HUB_CHAIN_ID.BSC]) {
        return hubCoin.symbol.replace(/BSC$/, '');
    }
}


// 1 min cache
const coinsCache = new Cache({maxAge: 1 * 60 * 1000});

/**
 * @return {Promise<TokenInfo.AsObject[]>}
 */
function _getOracleCoinList() {
    return instance.get('mhub2/v1/token_infos', {
            cache: coinsCache,
        })
        .then((response) => {
            return response.data.list.tokenInfos;
        });
}

/**
 * @return {Promise<Array<HubCoinItem>>}
 */
function _getOracleCoinListGroupedByMinter() {
    return _getOracleCoinList()
        .then((tokenList) => {
            tokenList = tokenList.map((item) => {
                if (typeof item.externalTokenId === 'string') {
                    item.externalTokenId = item.externalTokenId.toLowerCase();
                }
                return item;
            });
            const minterTokenList = tokenList.filter((token) => token.chainId === HUB_CHAIN_ID.MINTER);

            return minterTokenList
                .map((minterToken) => {
                    function findToken(denom, chainId) {
                        return tokenList.find((item) => item.denom === denom && item.chainId === chainId);
                    }

                    return {
                        minterId: Number(minterToken.externalTokenId),
                        ...minterToken,
                        ethereum: findToken(minterToken.denom, HUB_CHAIN_ID.ETHEREUM),
                        bsc: findToken(minterToken.denom, HUB_CHAIN_ID.BSC),
                    };
                });
        });
}

/**
 * @return {Promise<TokenInfo.AsObject[]>}
 */
export function getVerifiedMinterCoinList() {
    return _getOracleCoinList()
        .then((tokenList) => {
            return tokenList.filter((token) => token.chainId === HUB_CHAIN_ID.MINTER);
        });
}

/**
 * @return {Promise<Array<HubPriceItem>>}
 */
export function getOraclePriceList() {
    return instance.get('oracle/v1/prices', {
            cache: fastCache,
        })
        .then((response) => {
            return response.data.prices.list
                .map((item) => {
                    item.value = stripZeros(item.value);
                    return item;
                });
        });
}

/**
 * @param {string} inputTxHash
 * @return {Promise<HubTransferStatus>}
 */
export function getTransferStatus(inputTxHash) {
    return instance.get(`mhub2/v1/transaction_status/${inputTxHash}`, {
            cache: fastCache,
        })
        .then((response) => {
            return response.data.status;
        });
}


// 1 day
const persistentCache = new Cache({maxAge: 24 * 60 * 60 * 1000});

/**
 * @param {string} inputTxHash
 * @return {Promise<HubTransferFee>}
 */
export function getTransferFee(inputTxHash) {
    return instance.get(`mhub2/v1/transaction_fee_record/${inputTxHash}`, {
        cache: persistentCache,
    })
        .then((response) => {
            return {
                valCommission: new Big(response.data.record.valCommission).div(1e18).toString(),
                externalFee: new Big(response.data.record.externalFee).div(1e18).toString(),
            };
        });
}

/**
 * @param {Array<HubPriceItem>} priceList
 * @return {number}
 */
export function getGasPriceGwei(priceList) {
    //@TODO ETH/BNB
    const priceItem = priceList.find((item) => item.name === 'eth/gas');
    let gasPriceGwei;
    if (!priceItem) {
        gasPriceGwei = 100;
    } else {
        gasPriceGwei = priceItem.value / 10 ** 18;
    }

    return NETWORK === MAINNET ? gasPriceGwei : new Big(gasPriceGwei).times(10).toNumber();
}

function wait(time) {
    return new Promise((resolve) => {
        setTimeout(resolve, time);
    });
}

/**
 * @typedef {object} HubCoinItemMinterExtra
 * @property {string} symbol - minter symbol
 * @property {string} minterId
 */
/**
 * @typedef {TokenInfo.AsObject & HubCoinItemMinterExtra & {ethereum: TokenInfo.AsObject, bsc: TokenInfo.AsObject}} HubCoinItem
 */

/**
 * @typedef {object} HubPriceItem
 * @property {string} name
 * @property {number|string} value
 */

/**
 * @typedef {object} HubTransferStatus
 * @property {HUB_TRANSFER_STATUS} status
 * @property {string} inTxHash
 * @property {string} outTxHash
 */

/**
 * @typedef {object} HubTransferFee
 * @property {number|string} externalFee
 * @property {number|string} valCommission
 */
