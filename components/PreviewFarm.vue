<script>
import {getFarmList, fillFarmWithPoolData} from '@/api/farm.js';
// import {getFarmingPair} from '@/api/uniswap.js';
import {pretty, getDateHuman, getApy} from '~/assets/utils.js';

export default {
    fetch() {
        // const uniswapFarmPromise = getFarmingPair()
        //     .then((pairDayData) => {
        //         this.uniswapPair = pairDayData;
        //     });

        const farmListPromise = getFarmList({onlyTrusted: true})
            .then((farmList) => {
                return fillFarmWithPoolData(selectRandomItems(farmList, 5), {trySharePoolsRequest: true});
            })
            .then((farmList) => {
                // farmList = farmList
                //     .filter((item) => item.liquidityBip > 100000);
                this.farmList = farmList;
            });

        return Promise.all([/*uniswapFarmPromise, */farmListPromise]);
    },
    data() {
        return {
            /** @type UniswapPairDailyData */
            uniswapPair: {},
            /** @type Array<FarmItem> */
            farmList: [],
        };
    },
    computed: {
        farmListFormatted() {
            return this.farmList.map((pool) => {
                const apr = pool.percent * 365;

                const stakingApy = getApy(pool.tradeVolumeBip1D, pool.liquidityBip);

                return {
                    ...pool,
                    liquidityUsd: pool.liquidityBip * this.$store.getters['explorer/bipPriceUsd'],
                    // volumeUsd: pool.tradeVolumeBip1D * this.$store.getters['explorer/bipPriceUsd'],
                    apr,
                    stakingApy,
                };
            })
                .sort((a, b) => {
                    // first sort by apr
                    if (b.apr - a.apr !== 0) {
                        return b.apr - a.apr;
                    }

                    // then sort by liquidity
                    return b.liquidityBip - a.liquidityBip;
                });
        },
    },
    methods: {
        pretty,
        getDateHuman,
        getCoinIconUrl(coin) {
            return this.$store.getters['explorer/getCoinIcon'](coin);
        },
        getRewardCoin(pool) {
            return pool.rewardCoinList.map((coin) => coin.symbol).join(' + ');
        },
    },
};


/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * @param {Array} arr
 * @param {number} count
 * @return {Array}
 */
function selectRandomItems(arr, count) {
    if (count >= arr.length) {
        return arr;
    }
    let result = [];
    // Object.keys to filter out empty slots
    while (Object.keys(result).length < count) {
        const index = getRandomInt(0, arr.length - 1);
        result[index] = arr[index];
    }

    return result.filter((item) => !!item);
}
</script>

<template>
    <section class="panel u-section" v-if="!$fetchState.error && (farmListFormatted.length || $fetchState.pending)">
        <div class="panel__section panel__header">
            <h2 class="panel__header-title panel__title">
                <img class="panel__header-title-icon" src="/img/icon-farm.svg" width="40" height="40" alt="" role="presentation">
                Yield farm programs
            </h2>
            <nuxt-link class="button button--ghost-main button--small" to="/farming">View all</nuxt-link>
        </div>
        <div class="table-wrap">
            <div class="panel__content panel__section u-text-center" v-if="$fetchState.pending">
                <svg class="loader" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28">
                    <circle class="loader__path" cx="14" cy="14" r="12"></circle>
                </svg>
            </div>
            <table class="u-text-nowrap" v-else>
                <thead>
                <tr>
                    <th>Pair</th>
                    <th>End date</th>
                    <th title="Total value locked">TVL</th>
                    <th>Reward type</th>
                    <th title="Based on 24hr rate annualized">Farming APR</th>
                    <th title="Based on 24hr volume annualized">Staking APY</th>
<!--                    <th class="farm__uniswap-cell">&lt;!&ndash; placeholder &ndash;&gt;</th>-->
                </tr>
                </thead>
                <tbody>
                <!--
                <tr class="farm__uniswap-row-bg">
                    <td>
                        <div class="pool-pair">
                            <div class="pool-pair__figure">
                                <img class="pool-pair__icon" :src="getCoinIconUrl('USDTE')" width="24" height="24" alt="" role="presentation">
                                <img class="pool-pair__icon pool-pair__icon1" src="/img/icon-coin-bipx.svg" width="24" height="24" alt="" role="presentation">
                            </div>
                            <a class="link--hover u-fw-700" href="https://v2.info.uniswap.org/pair/0xb1700c93ddc26ce1d59441c24daef1035444d7b7" target="_blank">
                                USDT / BIPx
                            </a>
                        </div>
                    </td>
                    <td>15 August 2021</td>
                    <td>${{ pretty(uniswapPair.reserveUSD) }}</td>
                    <td>BIPx + USDT</td>
                    <td>
                        <div class="farm__plus-wrap">
                            <div class="farm__plus-value">73%</div>
                            <div class="farm__plus-icon">+</div>
                        </div>
                    </td>
                    <td>{{ pretty(uniswapPair.stakingApy) }}%</td>
                    <td class="farm__uniswap-cell">
                        <a class="link--hover" href="https://v2.info.uniswap.org/pair/0xb1700c93ddc26ce1d59441c24daef1035444d7b7" target="_blank">
                            <img src="/img/icon-uniswap.png" srcset="/img/icon-uniswap@2x.png 2x, /img/icon-uniswap@3x.png 3x" alt="Uniswap" width="40" height="40">
                        </a>
                    </td>
                </tr>
                -->
                <tr v-for="pool in farmListFormatted" :key="pool.poolId">
                    <td>
                        <div class="pool-pair">
                            <div class="pool-pair__figure">
                                <img class="pool-pair__icon" :src="getCoinIconUrl(pool.coin0.symbol)" width="24" height="24" alt="" role="presentation">
                                <img class="pool-pair__icon pool-pair__icon1" :src="getCoinIconUrl(pool.coin1.symbol)" width="24" height="24" alt="" role="presentation">
                            </div>
                            <nuxt-link class="link--default" :to="`/pools/${pool.coin0.symbol}/${pool.coin1.symbol}`">
                                {{ pool.coin0.symbol }} / {{ pool.coin1.symbol }}
                            </nuxt-link>
                        </div>
                    </td>
                    <td>{{ getDateHuman(pool.finishAt) }}</td>
                    <td>${{ pretty(pool.liquidityUsd) }}</td>
                    <td>{{ getRewardCoin(pool) }}</td>
                    <td>
                        <div class="farm__plus-wrap">
                            <div class="farm__plus-value">{{ pretty(pool.apr) }}%</div>
                            <div class="farm__plus-icon">+</div>
                        </div>
                    </td>
                    <td>{{ pretty(pool.stakingApy) }}%</td>
                </tr>
                </tbody>
            </table>
        </div>
    </section>
</template>
