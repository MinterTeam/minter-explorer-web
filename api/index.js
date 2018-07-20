/**
 * @typedef {Object} Block
 * @property {number} height
 * @property {string} timestamp
 * @property {number} txCount
 * @property {number} size
 * @property {string} hash
 * @property {number} reward
 * @property {number} blockTime
 * @property {string} timestamp
 * @property {Array<Validator>} validators
 */

/**
 * @typedef {Object} Validator
 * @property {number} id
 * @property {string} name
 * @property {string} address
 * @property {string} publicKey
 */

/**
 * @typedef {Object} Transaction
 * @property {number} txn
 * @property {string} hash
 * @property {string} status
 * @property {number} nonce
 * @property {number} block
 * @property {string} timestamp
 * @property {number} fee
 * @property {number} type
 * @property {Object} data
 * @property {string} data.from
 * -- type: TX_TYPES.SEND
 * @property {string} [data.to]
 * @property {string} [data.coin]
 * @property {number} [data.amount]
 * -- type: TX_TYPES.CONVERT
 * @property {string} [data.coin_to_sell]
 * @property {string} [data.coin_to_buy]
 * @property {number} [data.value]
 * -- type: TX_TYPES.CREATE_COIN
 * @property {string} [data.name]
 * @property {string} [data.symbol]
 * @property {number} [data.initial_amount]
 * @property {number} [data.initial_reserve]
 * @property {number} [data.constant_reserve_ratio]
 * -- type: TX_TYPES.DECLARE_CANDIDACY
 * @property {string} [data.address]
 * @property {string} [data.pub_key]
 * @property {number} [data.commission]
 * @property {string} [data.coin]
 * @property {number} [data.stake]
 * -- type: TX_TYPES.DELEGATE
 * @property {string} [data.pub_key]
 * @property {string} [data.coin]
 * @property {number} [data.stake]
 * -- type: TX_TYPES.UNBOUND
 * @property {string} [data.pub_key]
 * @property {string} [data.coin]
 * @property {number} [data.value]
 * -- type: TX_TYPES.REDEEM_CHECK
 * @property {string} [data.raw_check]
 * @property {string} [data.proof]
 * - type: TX_TYPES.SET_CANDIDATE_ONLINE, TX_TYPES.SET_CANDIDATE_OFFLINE
 * @property {string} [data.pub_key]
 */

import axios from '~/api/axios';



/**
 * @typedef {Object} Status
 * @property {number} marketCap - in $
 * @property {number} bipPriceUsd
 * @property {number} bipPriceBtc
 * @property {number} bipPriceChange - in %
 * @property {number} latestBlockHeight - block count
 * @property {number} averageBlockTime - in seconds
 * @property {number} totalTransactions - tx count
 * @property {number} transactionsPerSecond - tps
 */

/**
 * @return {Promise<Status>}
 */
export function getStatus() {
    return axios.get('status')
        .then((response) => response.data)
}

export function getTxChartData() {
    return axios.get('txCountChartData')
        .then((response) => {
            let chartData = response.data.data;
            if (!Array.isArray(chartData)) {
                throw new Error('Not valid response from api');
                //chartData = [];
            }

            let lastData = chartData.length > 14 ? chartData.slice(0, 14 - 1) : chartData;

            // format data for line chart.js
            return lastData.reduce((accum, item) => {
                accum.data.push(item.txCount);
                accum.labels.push(item.date);
                return accum;
            }, {data: [], labels: []});
        });
}

/**
 * @typedef {Object} BlockListInfo
 * @property {Array<Block>} data
 * @property {Object} meta - pagination
 */

/**
 * @param {Object} [params]
 * @param {number} params.page
 * @return {Promise<BlockListInfo>}
 */
export function getBlockList(params) {
    return axios.get('blocks', {
            params,
        })
        .then((response) => {
            return response.data;
        });
}

/**
 * @typedef {Object} BlockInfo
 * @property {Block} data
 * @property {Object} meta
 * @property {number} meta.latestBlockHeight
 */

/**
 * @param {number} height
 * @return {Promise<Block>}
 */
export function getBlock(height) {
    return axios.get('block/' + height)
        .then((response) => response.data.data);
}

/**
 * @typedef {Object} TransactionListInfo
 * @property {Array<Transaction>} data
 * @property {Object} meta - pagination
 */

/**
 * @param {Object} [params]
 * @param {number} [params.block]
 * @param {number} [params.address]
 * @param {number} [params.page]
 * @return {Promise<TransactionListInfo>}
 */
export function getTransactionList(params) {
    return axios.get('transactions', {
            params,
        })
        .then((response) => {
            return {
                ...response.data,
                data: response.data.data.map((tx) => {
                    if (tx.data.coin) {
                        tx.data.coin = tx.data.coin.toUpperCase();
                    }
                    return tx;
                }),
            }
        });
}

/**
 * @typedef {Object} TransactionInfo
 * @property {Transaction} data
 * @property {Object} meta
 * @property {string} meta.prevTxHash
 * @property {string} meta.nextTxHash
 */

/**
 * @param {string} hash
 * @return {Promise<TransactionInfo>}
 */
export function getTransaction(hash) {
    return axios.get('transaction/' + hash)
        .then((response) => {
            if (!response.data.data || !response.data.data.hash) {
                throw new Error('Not valid response from api');
            }
            let tx = response.data.data;
            if (tx.data.coin) {
                tx.data.coin = tx.data.coin.toUpperCase();
            }
            return {
                ...response.data,
                data: tx,
            }
        });
}

export function getAddress(address) {
    return axios.get('address/' + address)
        .then((response) => {
            const addressData = response.data.data;
            addressData.bipTotal = 0;
            addressData.usdTotal = 0;
            if (addressData.coins) {
                addressData.coins.forEach((coin) => {
                    addressData.bipTotal += coin.baseCoinAmount;
                    addressData.usdTotal += coin.usdAmount;
                })
            }
            return addressData;
        });
}
