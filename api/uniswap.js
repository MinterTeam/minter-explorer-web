import axios from 'axios';
import {getApy} from '~/assets/utils.js';

const subgraphApiUrl = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2';
const farmingPairContractAddress = '0xb1700c93ddc26ce1d59441c24daef1035444d7b7';
const bipxContractAddress = '0xcafe34bae6f1b23a6b575303edcc0578d2188131';
const usdtContractAddress = '0xdac17f958d2ee523a2206206994597c13d831ec7';

/**
 * @typedef {{reserveUSD,dailyVolumeUSD,dailyVolumeToken0,dailyVolumeToken1,dailyTxns, stakingApy}} UniswapPairDailyData
 */

/**
 * @param {string} pairContractAddress
 * @param {number} [timeId]
 * @return {Promise<UniswapPairDailyData>}
 */
export function getPairDailyData(pairContractAddress, timeId) {
    timeId = timeId || Math.floor(Date.now() / 86400000);
    const query = `{
    pairDayData(id: "${pairContractAddress}-${timeId}"){
        reserveUSD
        dailyVolumeUSD
        dailyVolumeToken0
        dailyVolumeToken1
        dailyTxns
    }
}`;

    return axios.post(subgraphApiUrl, {query})
        .then((response) => {
            const pairDayData = response.data.data.pairDayData;
            // retry request for previous day
            if (!pairDayData) {
                return getPairDailyData(pairContractAddress, timeId - 1);
            }
            return pairDayData;
        });
}

export function getFarmingPair() {
    return getPairDailyData(farmingPairContractAddress)
        .then((pairDayData) => {
            if (!(pairDayData.dailyVolumeUSD > 0)) {
                pairDayData.dailyVolumeUSD = pairDayData.dailyVolumeToken1 * 2;
            }
            pairDayData.stakingApy = getApy(pairDayData.dailyVolumeUSD, pairDayData.reserveUSD, 0.003);
            return pairDayData;
        });
}


// import { Token, Fetcher } from '@uniswap/sdk';
// import {CloudflareProvider, JsonRpcProvider} from '@ethersproject/providers';
// import {NETWORK, MAINNET, ETHEREUM_CHAIN_ID} from '~/assets/variables.js';
//
// export function getPair({coin0Contract, coin0Decimals, coin1Contract, coin1Decimals}) {
//     const token0 = new Token(ETHEREUM_CHAIN_ID, coin0Contract, coin0Decimals || 18);
//     const token1 = new Token(ETHEREUM_CHAIN_ID, coin1Contract, coin1Decimals || 18);
//     const provider = NETWORK === MAINNET ? new CloudflareProvider('homestead') : new JsonRpcProvider('https://ropsten.dl-dev.ru/', 'ropsten');
//
//     return Fetcher.fetchPairData(token0, token1, provider);
// }

// export function getFarmingPair() {
//     return getPair({
//         coin0Contract: bipxContractAddress,
//         coin0Decimals: 18,
//         coin1Contract: usdtContractAddress,
//         coin1Decimals: 6,
//     });
// }
