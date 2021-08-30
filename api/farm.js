import axios from 'axios';
import {cacheAdapterEnhancer, Cache} from 'axios-extensions';
import {FARM_API_URL} from "~/assets/variables.js";
import addToCamelInterceptor from '~/assets/to-camel.js';
import {getPoolList, getPoolByToken} from '@/api/explorer.js';

const instance = axios.create({
    baseURL: FARM_API_URL,
    adapter: cacheAdapterEnhancer(axios.defaults.adapter, { enabledByDefault: false}),
});
addToCamelInterceptor(instance);


// 1 min cache
const farmCache = new Cache({maxAge: 1 * 60 * 1000});

/**
 * @return {Promise<Array<FarmItem>>}
 */
export function getFarmList() {
    return Promise.all([
            _getFarmList('Mxcb272d7efc6c4a3122d705100fa0032703446e3e'),
            _getFarmList('Mxe9fd1e557a4851fe1ba76def2967da15defa4e4d'),
        ])
        .then((lists) => [].concat(...lists))
        .then((farmList) => {
            let farmMap = {};
            farmList.forEach((farmItem) => {
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

            return Object.values(farmMap);
        });
}

/**
 * @return {Promise<Array<FarmItem>>}
 */
function _getFarmList(address) {
    return instance.get(`rewarding?owner=${address}`, {
            cache: farmCache,
        })
        .then((response) => {
            const list = response.data.data || [];
            return list.map((farmItem) => {
                farmItem.tokenSymbol = `LP-${farmItem.poolId}`;

                return farmItem;
            });
        });
}

/**
 * Fill with pool data and aggregate identical pools
 * @param {Promise<Array<FarmItem>>} farmPromise
 * @param {boolean} [skipLowLiquidity]
 * @return {Promise<Array<FarmItem>>}
 */
export function fillFarmWithPoolData(farmPromise, {skipLowLiquidity} = {}) {
    // get default pool list to share request with index pool list, anyway first 50 pools should be enough
    const poolListPromise = getPoolList(/*{limit: 1000}*/);

    return Promise.all([farmPromise, poolListPromise])
        .then(([farmList, poolListInfo]) => {
            // make hashmap
            const poolMap = poolListToMap(poolListInfo.data);
            // fill farm if pool exist, otherwise save absent token
            let absentPoolTokenList = [];
            farmList = farmList.map((farmItem) => {
                if (poolMap[farmItem.tokenSymbol]) {
                    farmItem = addPoolFields(farmItem, poolMap[farmItem.tokenSymbol]);
                } else if (!skipLowLiquidity) {
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
            if (!absentPoolList.length) {
                return farmList;
            } else {
                const absentPoolMap = poolListToMap(absentPoolList);

                return farmList.map((farmItem) => {
                    return addPoolFields(farmItem, absentPoolMap[farmItem.tokenSymbol]);
                });
            }
        });
}


function poolListToMap(poolList) {
    // make hashmap
    let poolMap = {};
    poolList.forEach((pool) => {
        poolMap[pool.token.symbol] = pool;
    });

    return poolMap;
}

function addPoolFields(farmProgram, pool) {
    if (pool) {
        farmProgram.liquidityBip = pool.liquidityBip;
        farmProgram.tradeVolumeBip1D = pool.tradeVolumeBip1D;
    }

    return farmProgram;
}

/**
 * @typedef {{id:number, address:string, pair:string, poolId:number, tokenSymbol: string, percent:number, rewardCoinList:Coin[], ,coin0: Coin, coin1: Coin, period:number, startAt: string, finishAt: string}} FarmItem
 */


