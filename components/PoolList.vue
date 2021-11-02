<script>
import {getApy, pretty} from '~/assets/utils.js';

    export default {
        props: {
            /** @type Array<Pool> */
            poolList: {
                type: Array,
                required: true,
            },
            coin0: {
                type: String,
                default: '',
            },
        },
        computed: {
            poolListFormatted() {
                return this.poolList.map((pool) => {
                    const apy = getApy(pool.tradeVolumeBip1D, pool.liquidityBip);

                    const reversed = this.coin0 && this.coin0 === pool.coin1.symbol ? {
                        coin0: pool.coin1,
                        coin1: pool.coin0,
                        amount0: pool.amount1,
                        amount1: pool.amount0,
                    } : {};

                    return {
                        ...pool,
                        ...reversed,
                        liquidityUsd: pool.liquidityBip * this.$store.getters['explorer/bipPriceUsd'],
                        volumeUsd: pool.tradeVolumeBip1D * this.$store.getters['explorer/bipPriceUsd'],
                        apy,
                        apy30d: getApy((pool.tradeVolumeBip30D || 0) / 30, pool.liquidityBip),
                    };
                });
            },
        },
        methods: {
            pretty,
            getCoinIconUrl(coin) {
                return this.$store.getters['explorer/getCoinIcon'](coin);
            },
        },
    };
</script>

<template>
    <div class="table-wrap">
        <table class="u-text-nowrap">
            <thead>
            <tr>
                <th>Pair</th>
<!--                <th>Pool token</th>-->
                <th colspan="2">Amount</th>
                <th>Liquidity</th>
                <th>Volume (1d)</th>
                <th title="Based on 24hr volume annualized">APY</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="pool in poolListFormatted" :key="pool.token.symbol">
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
<!--                <td>{{ pool.token.symbol }}</td>-->
                <td>{{ pool.coin0.symbol }} <span class="u-fw-500">{{ pretty(pool.amount0) }}</span></td>
                <td>{{ pool.coin1.symbol }} <span class="u-fw-500">{{ pretty(pool.amount1) }}</span></td>
                <td>${{ pretty(pool.liquidityUsd) }}</td>
                <td>${{ pretty(pool.volumeUsd) }}</td>
                <td><span v-if="pool.liquidityUsd > 100">{{ pretty(pool.apy) }}%</span></td>
                <td class="u-hidden" data-apy30>{{ pretty(pool.apy30d) }}</td>
            </tr>
            </tbody>
        </table>
    </div>
</template>
