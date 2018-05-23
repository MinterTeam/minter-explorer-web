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
            //@TODO tmp
            response.data = [response.data, response.data];
            if (!response.data[0] || !response.data[1]) {
                throw new Error('Not valid response from api');
            }

            let lastData = response.data.length > 14 ? response.data.slice(response.data.length - 14 - 1) : response.data;

            // format data for line chart.js
            return lastData.reduce((accum, item) => {
                accum.data.push(Math.round(item.amount / 1000)); // tx count in thousands
                accum.labels.push(item.date); // timestamp in milliseconds
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
            //@TODO temp
            response.data.data = response.data.data.map(fixBlockTmp);

            return response.data;
        });
}

export function getBlock(height) {
    return axios.get('block/' + height)
        .then((response) => fixBlockTmp(response.data.data));
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
        .then((response) => response.data.data);
}

export function getAddress(address) {
    return axios.get('address/' + address)
        .then((response) => response.data);
}

//@TODO tmp
function fixBlockTmp(block) {
    block.validators = [{
        id: 1,
        name: 'testValidator',
        address: 'asd',
        publicKey: 'asd',
    }];
    block.reward = parseFloat(block.reward);
    return block;
}

