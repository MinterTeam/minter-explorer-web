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
    return instance.get('rewarding?owner=Mxcb272d7efc6c4a3122d705100fa0032703446e3e', {
            cache: farmCache,
        })
        .then((response) => {
            return response.data.data.map((farmItem) => {
                farmItem.tokenSymbol = `LP-${farmItem.poolId}`;

                return farmItem;
            });
        });
}

export function fillFarmWithPoolData(farmPromise) {
    const poolListPromise = getPoolList({limit: 1000});

    return Promise.all([farmPromise, poolListPromise])
        .then(([farmList, poolListInfo]) => {
            // make hashmap
            let poolMap = {};
            poolListInfo.data.forEach((pool) => {
                poolMap[pool.token.symbol] = pool;
            });
            // fill farm if pool exist, otherwise save absent token
            let absentPoolTokenList = [];
            farmList = farmList.map((farmItem) => {
                const pool = poolMap[farmItem.tokenSymbol];
                if (pool) {
                    farmItem.liquidityBip = pool.liquidityBip;
                    farmItem.tradeVolumeBip1D = pool.tradeVolumeBip1D;
                } else {
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
                let absentPoolMap;
                absentPoolList.forEach((pool) => {
                    absentPoolMap[pool.token.symbol] = pool;
                });

                return farmList.map((farmItem) => {
                    const pool = absentPoolMap[farmItem.tokenSymbol];
                    if (pool) {
                        farmItem.liquidityBip = pool.liquidityBip;
                        farmItem.tradeVolumeBip1D = pool.tradeVolumeBip1D;
                    }

                    return farmItem;
                });
            }
        });
}

/**
 * @typedef {{id:number, address:string, pair:string, poolId:number, percent:number, rewardCoin:Coin, ,coin0: Coin, coin1: Coin, period:number, startAt: string, finishAt: string}} FarmItem
 */


