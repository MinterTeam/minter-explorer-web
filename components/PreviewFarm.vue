<script>
import {getFarmList, fillFarmWithPoolData} from '@/api/farm.js';
import {pretty, getDateHuman} from '~/assets/utils.js';

export default {
    fetch() {
        const farmListPromise = getFarmList()
            .then((farmList) => {
                return selectRandomItems(farmList, 3);
            });

        return fillFarmWithPoolData(farmListPromise)
            .then((farmList) => {
                this.farmList = farmList;
            });

    },
    data() {
        return {
            /** @type Array<FarmItem> */
            farmList: [],
        };
    },
    computed: {
        farmListFormatted() {
            return this.farmList.map((pool) => {
                const apr = pool.percent * 365;

                const tradeFee = pool.tradeVolumeBip1D * 0.002;
                const stakingApr = tradeFee / pool.liquidityBip * 365;
                const stakingApy = ((1 + stakingApr / 365) ** 365 - 1) * 100;

                return {
                    ...pool,
                    liquidityUsd: pool.liquidityBip * this.$store.getters['explorer/bipPriceUsd'],
                    // volumeUsd: pool.tradeVolumeBip1D * this.$store.getters['explorer/bipPriceUsd'],
                    apr,
                    stakingApy,
                };
            });
        },
    },
    methods: {
        pretty,
        getDateHuman,
        getCoinIconUrl(coin) {
            return this.$store.getters['explorer/getCoinIcon'](coin);
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
                </tr>
                </thead>
                <tbody>
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
                    <td>{{ pool.rewardCoin.symbol }}</td>
                    <td>
                        <div class="farm__plus-wrap">
                            <div>{{ pretty(pool.apr) }}%</div>
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
