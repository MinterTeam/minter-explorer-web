import axios from 'axios';
import {cacheAdapterEnhancer, Cache} from 'axios-extensions';
import coinBlockList from 'minter-coin-block-list';
import {FARM_API_URL, NETWORK, MAINNET} from "~/assets/variables.js";
import {arrayToMap} from '~/assets/utils/collection.js';
import addToCamelInterceptor from '~/assets/axios-to-camel.js';
import {getPoolList, getPoolByToken} from '~/api/explorer.js';


const coinBlockMap = Object.fromEntries(coinBlockList.map((symbol) => [symbol, true]));
function isBlocked(symbol) {
    return !!coinBlockMap[symbol.replace(/-\d+$/, '')];
}

const TRUSTED_FARM_OWNERS = [
    'Mxcb272d7efc6c4a3122d705100fa0032703446e3e',
    'Mxe9fd1e557a4851fe1ba76def2967da15defa4e4d',
    'Mx9ff587d747d6f1875c2729c6b0f351ed7af50c01',
    'Mxe9fd1e557a4851fe1ba76def2967da15defa4e4d', // HUB
    'Mx9ff587d747d6f1875c2729c6b0f351ed7af50c01', // MUSD
];
function isFarmTrusted(farmItem) {
    return TRUSTED_FARM_OWNERS.includes(farmItem.ownerAddress);
}


const instance = axios.create({
    baseURL: FARM_API_URL,
    adapter: cacheAdapterEnhancer(axios.defaults.adapter, { enabledByDefault: false}),
});
addToCamelInterceptor(instance);


// 1 min cache
const farmCache = new Cache({maxAge: 1 * 60 * 1000});

/**
 * @param {boolean} [onlyTrusted=false]
 * @return {Promise<Array<FarmItem>>}
 */
export function getFarmList({onlyTrusted = false} = {}) {
    if (NETWORK !== MAINNET) {
        return Promise.resolve([]);
    }
    return _getFarmList()
        .then((farmList) => {
            let farmMap = {};
            farmList
                .filter((farmItem) => {
                    // filter out blocked
                    if (isBlocked(farmItem.coin0.symbol) || isBlocked(farmItem.coin1.symbol)) {
                        return false;
                    }
                    // filter out untrusted
                    if (onlyTrusted && !farmItem.isTrusted) {
                        return false;
                    }
                    return true;
                })
                // group farms by pool
                .forEach((farmItem) => {
                    // ensure farm map item
                    if (!farmMap[farmItem.tokenSymbol]) {
                        const cleanFarmItem = {...farmItem};
                        delete cleanFarmItem.rewardCoin;
                        cleanFarmItem.rewardCoinList = [];
                        cleanFarmItem.percent = 0;
                        cleanFarmItem.finishDateList = [];
                        farmMap[farmItem.tokenSymbol] = cleanFarmItem;
                    }

                    farmMap[farmItem.tokenSymbol].percent += farmItem.percent;
                    farmMap[farmItem.tokenSymbol].rewardCoinList.push(farmItem.rewardCoin);

                    // check if finishDateList should be updated
                    const hasCurrentDate = farmMap[farmItem.tokenSymbol].finishDateList.find((item) => {
                        // less than 1 day difference
                        return Math.abs(new Date(item) - new Date(farmItem.finishAt)) <= 24 * 60 * 60 * 1000;
                    });
                    if (!hasCurrentDate) {
                        farmMap[farmItem.tokenSymbol].finishDateList.push(farmItem.finishAt);
                    }

                    const latestDate = farmMap[farmItem.tokenSymbol].finishDateList.reduce((previous, current) => {
                        const prevDate = new Date(previous);
                        const currentDate = new Date(current);
                        return currentDate > prevDate ? current : previous;
                    }, (new Date(0)).toISOString());
                    // rewrite with latest finishAt
                    farmMap[farmItem.tokenSymbol].finishAt = latestDate;
                });
            // console.log(farmMap);

            return Object.values(farmMap);
        });
}

/**
 * @param {string} [ownerAddress]
 * @return {Promise<Array<FarmProgram>>}
 */
function _getFarmList(ownerAddress) {
    return instance.get('rewarding' + (ownerAddress ? `?owner=${ownerAddress}` : ''), {
            cache: farmCache,
        })
        .then((response) => {
            const list = response.data.data || [];
            return list
                // filter out unpaid for 3 days
                .filter((farmItem) => {
                    // isPaid or isTrusted
                    return farmItem.period * farmItem.unpaidTxCount < 24 * 3 || isFarmTrusted(farmItem);
                })
                .map((farmItem) => prepareFarmProgram(farmItem));
        });
}

/**
 * @param farmItem
 * @return {FarmProgram}
 */
function prepareFarmProgram(farmItem) {
    farmItem.tokenSymbol = `LP-${farmItem.poolId}`;
    farmItem.isTrusted = isFarmTrusted(farmItem);

    return farmItem;
}

/**
 * Fill with pool data and aggregate identical pools
 * @param {Promise<Array<FarmItem>>|Array<FarmItem>} farmPromise
 * @param {boolean} [trySharePoolsRequest] - will fetch default top 50 pools and additionally will fetch all trusted (other untrusted and not in top50 will be skipped)
 * @return {Promise<Array<FarmItemWithPoolData>>}
 */
export function fillFarmWithPoolData(farmPromise, {trySharePoolsRequest} = {}) {
    // get default pool list to share request with index pool list
    // 0 - get all, undefined - get default 50
    const poolListPromise = getPoolList({limit: trySharePoolsRequest ? undefined : 0});

    return Promise.all([farmPromise, poolListPromise])
        .then(([farmList, poolListInfo]) => {
            // make hashmap
            const poolMap = arrayToMap(poolListInfo.data, 'token.symbol');
            // fill farm if pool exist, otherwise save absent token
            let absentPoolTokenList = [];
            farmList = farmList.map((farmItem) => {
                if (poolMap[farmItem.tokenSymbol]) {
                    farmItem = addPoolFields(farmItem, poolMap[farmItem.tokenSymbol]);
                } else if (farmItem.isTrusted) {
                    absentPoolTokenList.push(farmItem.tokenSymbol);
                }

                return farmItem;
            });

            // fetch absent pools
            const absentPoolListPromise = absentPoolTokenList.map((tokenSymbol) => {
                return getPoolByToken(tokenSymbol);
            });
            return Promise.all([farmList, Promise.all(absentPoolListPromise)]);
        })
        .then(([farmList, absentPoolList]) => {
            if (absentPoolList.length) {
                const absentPoolMap = arrayToMap(absentPoolList, 'token.symbol');

                farmList = farmList.map((farmItem) => {
                    return addPoolFields(farmItem, absentPoolMap[farmItem.tokenSymbol]);
                });
            }

            return farmList.filter((item) => !!item.liquidityBip);
        });
}


/**
 * @param {FarmItem} farmProgram
 * @param {Pool} pool
 * @return {FarmItemWithPoolData}
 */
function addPoolFields(farmProgram, pool) {
    if (pool) {
        farmProgram.liquidityBip = pool.liquidityBip;
        farmProgram.tradeVolumeBip1D = pool.tradeVolumeBip1D;
    }

    return farmProgram;
}

/**
 * @typedef {{id:number, address:string, ownerAddress: string, pair:string, poolId:number, tokenSymbol: string, percent:number, rewardCoin:Coin, coin0: Coin, coin1: Coin, period:number, startAt: string, finishAt: string, unpaidTxCount: number, debt: number|string, isTrusted: boolean}} FarmProgram
 */

/**
 * @typedef {FarmProgram} FarmItem
 * @property {Coin[]} rewardCoinList
 * @property {Array<string>} finishDateList
 */

/**
 * @typedef {FarmItem} FarmItemWithPoolData
 * @property {number|string} liquidityBip
 * @property {number|string} tradeVolumeBip1D
 */


