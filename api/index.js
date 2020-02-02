import explorer from '~/api/explorer';
import {padZero} from '~/assets/utils';
import {REWARD_CHART_TYPES, COIN_NAME, TX_STATUS} from '~/assets/variables';


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
    return explorer.get('status')
        .then((response) => response.data.data);
}

/**
 * @typedef {Object} BlockListInfo
 * @property {Array<Block>} data
 * @property {Object} meta - pagination
 */

/**
 * @param {Object} [params]
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @return {Promise<BlockListInfo>}
 */
export function getBlockList(params) {
    return explorer.get('blocks', {
            params,
        })
        .then((response) => response.data);
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
    return explorer.get(`blocks/${height}`)
        .then((response) => response.data.data);
}

/**
 * @param {number} height
 * @param {Object} [params]
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @return {Promise<TransactionListInfo>}
 */
export function getBlockTransactionList(height, params) {
    return explorer.get(`blocks/${height}/transactions`, {params})
        .then((response) => response.data);
}




/**
 * @typedef {Object} TransactionListInfo
 * @property {Array<Transaction>} data
 * @property {Object} meta - pagination
 */

/**
 * @param {Object} [params]
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @return {Promise<TransactionListInfo>}
 */
export function getTransactionList(params) {
    return explorer.get('transactions', {params})
        .then((response) => response.data);
}

/**
 * @param {string} hash
 * @return {Promise<Transaction>}
 */
export function getTransaction(hash) {
    return explorer.get('transactions/' + hash)
        .then((response) => {
            const tx = response.data.data;
            if (!tx.data) {
                tx.data = {};
            }
            if (response.status === 200) {
                tx.status = TX_STATUS.SUCCESS;
            }
            if (response.status === 206) {
                tx.status = TX_STATUS.FAILURE;
            }
            return tx;
        });
}

export function getTransactionChart() {
    return explorer.get('statistics/transactions')
        .then((response) => {
            let chartData = response.data.data;
            if (!Array.isArray(chartData)) {
                throw new Error('Not valid response from api');
                //chartData = [];
            }

            const COUNT_DISPLAY_DAYS = 15;

            let lastData = chartData.length > COUNT_DISPLAY_DAYS ? chartData.slice(0, COUNT_DISPLAY_DAYS - 1) : chartData;

            // prepend empty days if they are not present in the API response
            let daysToAdd = new Array(COUNT_DISPLAY_DAYS - lastData.length);
            if (daysToAdd.length) {
                const DAY_MS = 24 * 60 * 60 * 1000;
                const dataDate = lastData.length ? new Date(lastData[0].date) : new Date();
                const firstDate = dataDate - daysToAdd.length * DAY_MS;
                for (let i = 0; i < daysToAdd.length; i++) {
                    const iterationDate = new Date(firstDate + i * DAY_MS);
                    daysToAdd[i] = {
                        date: iterationDate.getUTCFullYear() + '-' + padZero(iterationDate.getUTCMonth() + 1) + '-' + padZero(iterationDate.getUTCDate()),
                        txCount: 0,
                    };
                }
                lastData = daysToAdd.concat(lastData);
            }


            // format data for line chart.js
            return lastData.reduce((accum, item) => {
                accum.data.push(item.txCount);
                accum.labels.push(item.date);
                return accum;
            }, {data: [], labels: []});
        });
}


/**
 *
 * @param {string} address
 * @return {Promise<Array<CoinItem>>}
 */
export function getBalance(address) {
    return explorer.get(`addresses/${address}`)
        .then((response) => response.data.data.balances.sort((a, b) => {
            // set base coin first
            if (a.coin === COIN_NAME) {
                return -1;
            } else if (b.coin === COIN_NAME) {
                return 1;
            } else {
                return 0;
            }
        }));
}

/**
 *
 * @param {string} address
 * @param {Object} [params]
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @return {Promise<TransactionListInfo>}
 */
export function getAddressTransactionList(address, params) {
    return explorer.get(`addresses/${address}/transactions`, {params})
        .then((response) => response.data);
}

/**
 * @param {string} address
 * @return {Promise<Array<StakeItem>>}
 */
export function getAddressStakeList(address) {
    return explorer.get(`addresses/${address}/delegations`, {params: {limit: 999}})
        .then((response) => response.data.data);
}

/**
 * @typedef {Object} RewardListInfo
 * @property {Array<Reward>} data
 * @property {Object} meta - pagination
 */

/**
 * @param {string} address
 * @param {Object} [params]
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @return {Promise<RewardListInfo>}
 */
export function getAddressRewardList(address, params = {}) {
    params.limit = 20; // set per_page
    return explorer.get(`addresses/${address}/events/rewards`, {params})
        .then((response) => response.data);
}


/**
 * @param {string} address
 * @param {Object} [params]
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @return {Promise<RewardListInfo>}
 */
export function getAddressRewardAggregatedList(address, params = {}) {
    params.limit = 20; // set per_page
    return explorer.get(`addresses/${address}/events/rewards/aggregated`, {params})
        .then((response) => {
            response.data.data.map((item) => {
                item.timestamp = item.time_id;
                return item;
            });
            return response.data;
        });
}

/**
 * @typedef {Object} SlashListInfo
 * @property {Array<Slash>} data
 * @property {Object} meta - pagination
 */

/**
 * @param {string} address
 * @param {Object} [params]
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @return {Promise<SlashListInfo>}
 */
export function getAddressSlashList(address, params = {}) {
    params.limit = 20; // set per_page
    return explorer.get(`addresses/${address}/events/slashes`, {params})
        .then((response) => response.data);
}

/**
 * @param {string} address
 * @param {string} type
 * @return {Promise<Array>}
 */
export function getAddressRewardChart(address, type = REWARD_CHART_TYPES.MONTH) {
    let params;
    if (type === REWARD_CHART_TYPES.MONTH) {
        params = {scale: 'day'};
    } else if (type === REWARD_CHART_TYPES.WEEK) {
        params = {
            scale: 'day',
            startTime: (new Date(Date.now() - 6 * 24 * 60 * 60 *  1000)).toISOString(),
        };
    } else {
        params = {
            scale: 'hour',
            startTime: (new Date(Date.now() - 23 * 60 * 60 * 1000)).toISOString(),
        };
    }
    return explorer.get(`addresses/${address}/statistics/rewards`, {params})
        .then((response) => {
            let chartData = response.data.data;
            if (!Array.isArray(chartData)) {
                throw new Error('Not valid response from api');
            }

            // format date string to browsers can parse it
            chartData.forEach((item) => {
                item.time = item.time.replace(' ', 'T').replace(/(\+\d\d)$/, '$1:00');
            });

            // only 1 item, prepend it with empty one to chart can be constructed
            if (chartData.length === 1) {
                const firstDate = new Date(chartData[0].time);
                const prevDate = type === REWARD_CHART_TYPES.MONTH || type === REWARD_CHART_TYPES.WEEK
                    ? firstDate.setDate(firstDate.getDate() - 1)
                    : firstDate.setHours(firstDate.getHours() - 1);
                chartData.unshift({time: prevDate, amount: 0});

            }

            // format data for line chart.js
            return chartData.reduce((accum, item) => {
                accum.data.push(item.amount);
                accum.labels.push(item.time);
                return accum;
            }, {data: [], labels: []});
        });
}





/**
 * @param {string} pubKey
 * @return {Promise<Validator>}
 */
export function getValidator(pubKey) {
    return explorer.get(`validators/${pubKey}`)
        .then((response) => response.data.data);
}

/**
 * @return {Promise<Array<Validator>>}
 */
export function getValidatorList() {
    return explorer.get(`validators`)
        .then((response) => response.data.data);
}

/**
 * @param {string} pubKey
 * @param {Object} [params]
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @return {Promise<TransactionListInfo>}
 */
export function getValidatorTransactionList(pubKey, params) {
    return explorer.get(`validators/${pubKey}/transactions`, {params})
        .then((response) => response.data);
}

// export function getWebSocketConnectData() {
//     return explorer.get('settings/get-ws-data')
//         .then((response) => response.data.data);
// }

/**
 * @typedef {Object} Block
 * @property {number} height
 * @property {string} timestamp
 * @property {number} txCount - tx count in the block
 * @property {number} size
 * @property {string} hash
 * @property {number} reward
 * @property {number} blockTime
 * @property {string} timestamp
 * @property {Array<ValidatorListItem>} validators
 */

/**
 * @typedef {Object} CoinItem
 * @property {string|number} amount
 * @property {string} coin
 */

/**
 * @typedef {Object} StakeItem
 * @property {string} [pub_key]
 * @property {ValidatorMeta} [validator_meta]
 * @property {string} [address]
 * @property {string|number} value
 * @property {string|number} bip_value
 * @property {string} coin
 */

/**
 * @typedef {Object} ValidatorListItem
 * @property {string} publicKey
 * @property {ValidatorMeta} validator_meta
 * @property {boolean} signed
 */

/**
 * @typedef {Object} Validator
 * @property {string} [public_key]
 * @property {ValidatorMeta} meta
 * @property {number} status
 * @property {string|number} stake
 * @property {string|number} part
 * @property {number} delegator_count
 * @property {Array<{coin: string, value: string, address: string}>} delegator_list
 */

/**
 * @typedef {Object} ValidatorMeta
 * @property {string} name
 * @property {string} description
 * @property {string} icon_url
 * @property {string} site_url
 */

/**
 * @typedef {Object} Transaction
 * @property {number} txn
 * @property {string} hash
 * @property {string} status
 * @property {number} nonce
 * @property {number} block
 * @property {string} from
 * @property {string} timestamp
 * @property {number} fee
 * @property {number} type
 * @property {Object} data
 * -- type: TX_TYPE_SEND
 * @property {string} [data.to]
 * @property {string} [data.coin]
 * @property {number} [data.amount]
 * -- type: TX_TYPE_CONVERT
 * @property {string} [data.coin_to_sell]
 * @property {string} [data.coin_to_buy]
 * @property {number} [data.value_to_sell]
 * @property {number} [data.value_to_buy]
 * -- type: TX_TYPE_CREATE_COIN
 * @property {string} [data.name]
 * @property {string} [data.symbol]
 * @property {number} [data.initial_amount]
 * @property {number} [data.initial_reserve]
 * @property {number} [data.constant_reserve_ratio]
 * -- type: TX_TYPE_DECLARE_CANDIDACY
 * @property {string} [data.address]
 * @property {string} [data.pub_key]
 * @property {number} [data.commission]
 * @property {string} [data.coin]
 * @property {number} [data.stake]
 * -- type: TX_TYPE_EDIT_CANDIDATE
 * @property {string} [data.pub_key]
 * @property {string} [data.reward_address]
 * @property {string} [data.owner_address]
 * -- type: TX_TYPE_DELEGATE, TX_TYPE_UNBOND
 * @property {string} [data.pub_key]
 * @property {string} [data.coin]
 * @property {number} [data.value]
 * -- type: TX_TYPE_REDEEM_CHECK
 * @property {string} [data.raw_check]
 * @property {string} [data.proof]
 * @property {Object} [data.check]
 * @property {string} [data.check.sender]
 * @property {number} [data.check.nonce]
 * @property {number|string} [data.check.value]
 * @property {string} [data.check.coin]
 * @property {number} [data.check.due_block]
 * - type: TX_TYPE_SET_CANDIDATE_ONLINE, TX_TYPE_SET_CANDIDATE_OFFLINE
 * @property {string} [data.pub_key]
 */


/**
 * @typedef {Object} Reward
 * @property {number} [block]
 * @property {string} timestamp
 * @property {string} role
 * @property {string} address
 * @property {string} validator
 * @property {number} amount
 */

/**
 * @typedef {Object} Slash
 * @property {number} block
 * @property {string} timestamp
 * @property {string} address
 * @property {string} validator
 * @property {number} amount
 * @property {string} coin
 */

