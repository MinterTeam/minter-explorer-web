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
 * @property {string} hash
 * @property {string} status
 * @property {number} nonce
 * @property {number} block
 * @property {string} timestamp
 * @property {number} fee
 * @property {number} type
 * @property {Object} data
 * @property {string} data.from
 * @property {string} data.too
 * @property {string} data.coin
 * @property {number} data.amount
 */


import axios from '~/api/axios';

export function getStatus() {
    return axios.get('status')
        .then((response) => response.data)
}

export function getTxChartData() {
    return axios.get('txCountChartData')
        .then((response) => {
            let chartData = response.data.data;
            if (!chartData[0] || !chartData[1]) {
                chartData = []
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
 * @param {Object} [params]
 * @param {number} params.page
 * @return {Promise}
 */
export function getBlockList(params) {
    return axios.get('blocks', {
            params,
        })
        .then((response) => {
            return response.data;
        });
}

export function getBlock(height) {
    return axios.get('block/' + height)
        .then((response) => response.data.data);
}

/**
 * @param {Object} [params]
 * @param {number} [params.block]
 * @param {number} [params.address]
 * @param {number} [params.page]
 * @return {Promise}
 */
export function getTransactionList(params) {
    return axios.get('transactions', {
            params,
        })
        .then((response) => response.data);
}

export function getTransaction(hash) {
    return axios.get('transaction/' + hash)
        .then((response) => response.data);
}

export function getAddress(address) {
    return axios.get('address/' + address)
        .then((response) => response.data);
}
