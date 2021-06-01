import axios from 'axios';
import {cacheAdapterEnhancer, Cache} from 'axios-extensions';
import stripZeros from 'pretty-num/src/strip-zeros';
import {_getOracleCoinList} from '~/api/hub.js';
import {EXPLORER_API_URL, REWARD_CHART_TYPES, BASE_COIN, TX_STATUS} from "~/assets/variables.js";
import addToCamelInterceptor from '~/assets/to-camel.js';
import {addTimeInterceptor} from '~/assets/time-offset.js';
import {padZero} from '~/assets/utils.js';

const instance = axios.create({
    baseURL: EXPLORER_API_URL,
    adapter: cacheAdapterEnhancer(axios.defaults.adapter, { enabledByDefault: false}),
});
addToCamelInterceptor(instance);
addTimeInterceptor(instance);

const explorer = instance;


/**
 * @typedef {Object} Status
 * @property {number} marketCap - in $
 * @property {number} bipPriceUsd
 * @property {number} bipPriceChange - in %
 * @property {number} latestBlockHeight - block count
 * @property {number} avgBlockTime - in seconds
 * @property {number} totalTransactions - tx count
 * @property {number} transactionsPerSecond - tps
 */

const statusCache = new Cache({maxAge: 5 * 1000});
/**
 * @return {Promise<Status>}
 */
export function getStatus() {
    return explorer.get('status', {
            cache: statusCache,
        })
        .then((response) => response.data.data);
}

/**
 * @typedef {Object} BlockListInfo
 * @property {Array<Block>} data
 * @property {PaginationMeta} meta
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
 * @property {PaginationMeta} meta
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
 * @typedef {Object} BlockTimeInfo
 * @property {boolean} isFutureBlock
 * @property {number|string} timestamp
 */

/**
 * @param {number|string} height
 * @return {Promise<BlockTimeInfo>}
 */
export async function checkBlockTime(height) {
    const pastOrCurrentBlock = await getPastOrCurrentBlockInfo(height);
    const isFutureBlock = height > pastOrCurrentBlock.height;

    let timestamp;
    if (!isFutureBlock) {
        timestamp = pastOrCurrentBlock.timestamp;
    } else {
        timestamp = (height - pastOrCurrentBlock.height) * 5000 + Date.now();
    }

    return {isFutureBlock, timestamp};
}

function getPastOrCurrentBlockInfo(height) {
    return getBlock(height)
        .catch((e) => {
            if (e.request.status === 404) {
                return getBlockList().then((blockList) => blockList.data[0]);
            } else {
                throw e;
            }
        });
}


/**
 * @typedef {Object} TransactionListInfo
 * @property {Array<Transaction>} data
 * @property {PaginationMeta} meta
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
                        transactionCount: 0,
                    };
                }
                lastData = daysToAdd.concat(lastData);
            }


            // format data for line chart.js
            return lastData.reduce((accum, item) => {
                accum.data.push(item.transactionCount);
                accum.labels.push(item.date);
                return accum;
            }, {data: [], labels: []});
        });
}


/**
 *
 * @param {string} address
 * @return {Promise<BalanceData>}
 */
export async function getBalance(address) {
    const response = await explorer.get(`addresses/${address}?with_sum=true`);
    const data = response.data.data;
    data.balances = await prepareBalance(data.balances);
    return data;
}

export async function prepareBalance(balanceList) {
    balanceList = await markVerified(Promise.resolve(balanceList), 'balance');

    return balanceList.sort((a, b) => {
            // base coin goes first
            if (a.coin.symbol === BASE_COIN) {
                return -1;
            } else if (b.coin.symbol === BASE_COIN) {
                return 1;
            }

            // verified coins go second
            if (a.coin.verified && !b.coin.verified) {
                return -1;
            } else if (b.coin.verified && !a.coin.verified) {
                return 1;
            }

            return 0;

            // sort coins by name, instead of reserve
            // return a.coin.symbol.localeCompare(b.coin.symbol);
        })
        .map((coinItem) => {
            return {
                ...coinItem,
                amount: stripZeros(coinItem.amount),
            };
        });
}

/**
 *
 * @param {Promise} coinListPromise
 * @param {('coin','balance')} itemType
 * @return {Promise<Array<CoinItem>|Array<BalanceItem>>}
 */
function markVerified(coinListPromise, itemType = 'coin') {
    const hubCoinListPromise = _getOracleCoinList()
        .catch((error) => {
            console.log(error);
            return [];
        });

    return Promise.all([coinListPromise, hubCoinListPromise])
        .then(([coinList, hubCoinList]) => {
            let verifiedMap = {};
            hubCoinList.forEach((item) => {
                verifiedMap[Number(item.minterId)] = true;
            });

            return coinList.map((coinItem) => {
                const coinItemData = itemType === 'coin' ? coinItem : coinItem.coin;
                let verified = false;
                if (verifiedMap[coinItemData.id]) {
                    verified = true;
                }
                if (coinItemData.symbol === BASE_COIN || coinItemData.symbol === 'MUSD') {
                    verified = true;
                }
                coinItemData.verified = verified;
                return coinItem;
            });
        });
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
 * @property {PaginationMeta} meta
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
                item.timestamp = item.timeId;
                return item;
            });
            return response.data;
        });
}

/**
 * @typedef {Object} PenaltyListInfo
 * @property {Array<Penalty>} data
 * @property {PaginationMeta} meta
 */

/**
 * @param {string} address
 * @param {Object} [params]
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @return {Promise<PenaltyListInfo>}
 */
export function getAddressPenaltyList(address, params = {}) {
    params.limit = params.limit || 20;

    return Promise.all([
            explorer.get(`addresses/${address}/events/slashes`, {params}),
            explorer.get(`addresses/${address}/events/bans`, {params}),
        ])
        .then(mergePenaltyList);
}

export function getAddressUnbondList(address) {
    return explorer.get(`addresses/${address}/events/unbonds`)
        .then((response) => {
            response.data.data = response.data.data.map((item) => {
                item.height = item.blockId;
                item.amount = item.value;
                return item;
            });
            return response.data.data;
        });
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
 * @param {string} publicKey
 * @return {Promise<ValidatorFull>}
 */
export function getValidator(publicKey) {
    return explorer.get(`validators/${publicKey}`)
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
 * @param {string} publicKey
 * @param {Object} [params]
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @return {Promise<StakeListInfo>}
 */
export function getValidatorStakeList(publicKey, params = {}) {
    params = {
        ...params,
        limit: params.limit || 100,
    };
    return explorer.get(`validators/${publicKey}/stakes`, {params})
        .then((response) => response.data);
}

/**
 * @param {string} publicKey
 * @param {Object} [params]
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @return {Promise<PenaltyListInfo>}
 */
export function getValidatorPenaltyList(publicKey, params = {}) {
    params.limit = params.limit || 100;
    return Promise.all([
            explorer.get(`validators/${publicKey}/events/slashes`, {params}),
            explorer.get(`validators/${publicKey}/events/bans`, {params}),
        ])
        .then(mergePenaltyList);
}

function mergePenaltyList([slashResponse, banResponse]) {
    const slashInfo = slashResponse.data;
    const banInfo = banResponse.data;

    const meta = slashInfo.meta.total >= banInfo.meta.total ? slashInfo.meta : banInfo.meta;
    slashInfo.data.forEach((item) => {
        item.type = 'slash';
    });
    banInfo.data.forEach((item) => {
        item.type = 'ban';
    });
    const data = [].concat(slashInfo.data, banInfo.data).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return {data, meta};
}

/**
 * @param {string} publicKey
 * @param {Object} [params]
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @return {Promise<TransactionListInfo>}
 */
export function getValidatorTransactionList(publicKey, params) {
    return explorer.get(`validators/${publicKey}/transactions`, {params})
        .then((response) => response.data);
}

/**
 * @return {Promise<Array<CoinInfo>>}
 */
export function getCoinList() {
    return explorer.get('coins')
        .then((response) => response.data.data);
    // don't sort, coins already sorted by reserve
    // .then((response) => response.data.data.sort((a, b) => {
    //     if (a.symbol === BASE_COIN) {
    //         return -1;
    //     } else if (b.symbol === BASE_COIN) {
    //         return 1;
    //     } else {
    //         return a.symbol.localeCompare(b.symbol);
    //     }
    // }));
}

/**
 * @typedef {Object} PoolListInfo
 * @property {Array<Pool>} data
 * @property {PaginationMeta} meta
 */

/**
 * @typedef {Object} Pool
 * @property {Coin} coin0
 * @property {Coin} coin1
 * @property {number|string} amount0
 * @property {number|string} amount1
 * @property {number|string} liquidity
 * @property {number|string} liquidityBip
 * @property {string} token
 * @property {number|string} tradeVolumeBip1D
 */

/**
 * @typedef {Object} PoolProvider
 * @property {string} address
 * @property {Coin} coin0
 * @property {Coin} coin1
 * @property {number|string} amount0
 * @property {number|string} amount1
 * @property {number|string} liquidity
 * @property {number|string} liquidityBip
 * @property {number|string} liquidityShare
 * @property {string} token
 */

/**
 * @typedef {Object} PoolProviderListInfo
 * @property {Array<PoolProvider>} data
 * @property {PaginationMeta} meta
 */

/**
 * @typedef {Object} ProviderPoolListInfo
 * @property {Array<PoolProvider>} data
 * @property {PaginationMeta} meta
 */


/**
 * @param {Object} [params]
 * @param {string|number} [params.coin]
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @return {Promise<PoolListInfo>}
 */
export function getPoolList(params) {
    return explorer.get('pools', {
            params,
        })
        .then((response) => response.data);
}

/**
 * @param {string} coin0
 * @param {string} coin1
 * @return {Promise<Pool>}
 */
export function getPool(coin0, coin1) {
    return explorer.get(`pools/coins/${coin0}/${coin1}`)
        .then((response) => response.data.data);
}

/**
 * @param {string} symbol
 * @return {Promise<Pool>}
 */
export function getPoolByToken(symbol) {
    return explorer.get(`pools/token/${symbol}`)
        .then((response) => response.data.data);
}

/**
 *
 * @param {string} coin0
 * @param {string} coin1
 * @param {Object} [params]
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @return {Promise<TransactionListInfo>}
 */
export function getPoolTransactionList(coin0, coin1, params) {
    return explorer.get(`pools/coins/${coin0}/${coin1}/transactions`, {params})
        .then((response) => response.data);
}

/**
 * @param {string} coin0
 * @param {string} coin1
 * @param {Object} [params]
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @return {Promise<PoolProviderListInfo>}
 */
export function getPoolProviderList(coin0, coin1, params) {
    return explorer.get(`pools/coins/${coin0}/${coin1}/providers`, {
            params,
        })
        .then((response) => response.data);
}

/**
 * @param {string} coin0
 * @param {string} coin1
 * @param {string} address
 * @return {Promise<PoolProvider>}
 */
export function getPoolProvider(coin0, coin1, address) {
    return explorer.get(`pools/coins/${coin0}/${coin1}/providers/${address}`)
        .then((response) => response.data.data);
}

/**
 * @param {string} address
 * @param {Object} [params]
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @return {Promise<ProviderPoolListInfo>}
 */
export function getProviderPoolList(address, params) {
    return explorer.get(`pools/providers/${address}`, {
            params,
        })
        .then((response) => response.data);
}


/**
 * @param {number|string} id
 * @return {Promise<CoinInfo>}
 */
export function getCoinById(id) {
    return explorer.get(`coins/id/${id}`)
        .then((response) => {
            return response.data.data;
        });
}

/**
 * @param {string} symbol
 * @return {Promise<CoinInfo>}
 */
export function getCoinBySymbol(symbol) {
    symbol = symbol.toUpperCase();
    return explorer.get(`coins/symbol/${symbol}`)
        .then((response) => {
            return response.data.data;
        });
}

// export function getWebSocketConnectData() {
//     return explorer.get('settings/get-ws-data')
//         .then((response) => response.data.data);
// }

/**
 * @typedef {Object} Block
 * @property {number} height
 * @property {string} timestamp
 * @property {number} transactionCount - tx count in the block
 * @property {number} size
 * @property {string} hash
 * @property {number} reward
 * @property {number} blockTime
 * @property {string} timestamp
 * @property {number} validatorsCount
 * @property {Array<ValidatorListItem>} [validators]
 */

/**
 * @typedef {Object} BalanceData
 * @property {string} totalBalanceSum
 * @property {string} totalBalanceSumUsd
 * @property {Array<BalanceItem>} balances
 */

/**
 * @typedef {Object} BalanceItem
 * @property {string|number} amount
 * @property {Coin} coin
 */

/**
 * @typedef {Object} StakeListInfo
 * @property {Array<StakeItem>} data
 * @property {PaginationMeta} meta
 */

/**
 * @typedef {Object} StakeItem
 * @property {Coin} coin
 * @property {string|number} value
 * @property {string|number} bipValue
 * @property {Validator} [validator] - in address stakes
 * @property {string} [address] - in validator stakes
 * @property {boolean} isWaitlisted
 */

/**
 * @typedef {Object} ValidatorListItem
 * @property {Validator} validator
 * @property {boolean} signed
 */

/**
 * @typedef {Object} Validator
 * @property {string} publicKey
 * @property {number} status
 * @property {string} name - meta name
 * @property {string} description - meta desc
 * @property {string} iconUrl - meta icon
 * @property {string} siteUrl - meta url
 */

/**
 * @typedef {Validator} ValidatorFull
 * @property {string|number} stake
 * @property {string|number} minStake
 * @property {string|number} part
 * @property {number} commission
 * @property {number} delegatorCount

 * @property {Array<{coin: Coin, value: string, address: string}>} delegatorList
 */




/**
 * @typedef {Object} Transaction
 * @property {number} txn
 * @property {string} hash
 * @property {string} status
 * @property {number} nonce
 * @property {number} height
 * @property {string} from
 * @property {string} timestamp
 * @property {Coin} gasCoin
 * @property {number} commissionInBaseCoin
 * @property {number} commissionInGasCoin
 * @property {number} commissionPrice
 * @property {Coin} commissionPriceCoin
 * @property {number} type
 * @property {Object} data
 * -- type: TX_TYPE.SEND
 * @property {string} [data.to]
 * @property {Coin} [data.coin]
 * @property {number} [data.amount]
 * -- type: TX_TYPE.CONVERT
 * @property {Coin} [data.coinToSell]
 * @property {Coin} [data.coinToBuy]
 * @property {Array<Coin>} [data.coins]
 * @property {number} [data.valueToSell]
 * @property {number} [data.minimumValueToBuy]
 * @property {number} [data.valueToBuy]
 * @property {number} [data.maximumValueToSell]
 * -- type: TX_TYPE.CREATE_COIN
 * @property {number} [data.createdCoinId]
 * @property {string} [data.name]
 * @property {string} [data.symbol]
 * @property {number} [data.initialAmount]
 * @property {number} [data.initialReserve]
 * @property {number} [data.constantReserveRatio]
 * @property {number} [data.maxSupply]
 * -- type: TX_TYPE.DECLARE_CANDIDACY
 * @property {string} [data.address]
 * @property {string} [data.pubKey]
 * @property {number} [data.commission]
 * @property {Coin} [data.coin]
 * @property {number} [data.stake]
 * -- type: TX_TYPE.EDIT_CANDIDATE
 * @property {string} [data.pubKey]
 * @property {string} [data.rewardAddress]
 * @property {string} [data.ownerAddress]
 * @property {string} [data.controlAddress]
 * -- type: TX_TYPE.EDIT_CANDIDATE_PUBLIC_KEY
 * @property {string} [data.pubKey]
 * @property {string} [data.newPubKey]
 * -- type: TX_TYPE.DELEGATE, TX_TYPE.UNBOND
 * @property {string} [data.pubKey]
 * @property {Coin} [data.coin]
 * @property {number} [data.value]
 * -- type: TX_TYPE.REDEEM_CHECK
 * @property {string} [data.rawCheck]
 * @property {string} [data.proof]
 * @property {Object} [data.check]
 * @property {string} [data.check.sender]
 * @property {number} [data.check.nonce]
 * @property {number|string} [data.check.value]
 * @property {Coin} [data.check.coin]
 * @property {number} [data.check.dueBlock]
 * - type: TX_TYPE.SET_CANDIDATE_ON, TX_TYPE.SET_CANDIDATE_OFF
 * @property {string} [data.pubKey]
 * -- type: TX_TYPE.MULTISEND
 * @property {Array<{to: string, coin: Coin}>} [data.list]
 * -- type: TX_TYPE.CREATE_MULTISIG
 * @property {string|number} [data.multisigAddress]
 * @property {Array<string>} [data.addresses]
 * @property {Array<string|number>} [data.weights]
 * @property {string|number} [data.threshold]
 */


/**
 * @typedef {Object} Reward
 * @property {number} [height]
 * @property {string} timestamp
 * @property {string} role
 * @property {string} address
 * @property {Validator} validator
 * @property {number} amount
 */

/**
 * @typedef {Object} Slash
 * @property {number} height
 * @property {string} timestamp
 * @property {string} [address]
 * @property {Validator} [validator]
 * @property {number} amount
 * @property {Coin} coin
 */

/**
 * @typedef {Object} Ban
 * @property {number} height
 * @property {string} timestamp
 * @property {Validator} [validator]
 */

/**
 * @typedef {Slash|Ban} Penalty
 */

/**
 * @typedef {Object} Unbond
 * @property {number} height
 * @property {string} timestamp
 * @property {string} validator
 * @property {number} amount
 * @property {Coin} coin
 */

/**
 * @typedef {Object} Coin
 * @property {number} id
 * @property {string} symbol
 */

/**
 * @typedef {Object} CoinInfo
 * @property {number} id
 * @property {number} crr
 * @property {number|string} volume
 * @property {number|string} reserveBalance
 * @property {string} name
 * @property {string} symbol
 * @property {number|string} maxSupply
 * @property {string|null} ownerAddress
 */

/**
 * @typedef {Object} PaginationMeta
 * @property {number} currentPage
 * @property {number} lastPage
 * @property {number} perPage
 * @property {number} total
 * @property {string} path
 */


