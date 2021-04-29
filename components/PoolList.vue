<script>
    import {pretty} from '~/assets/utils.js';

    export default {
        props: {
            /** @type Array<Pool> */
            poolList: {
                type: Array,
                required: true,
            },
            bipPriceUsd: {
                type: Number,
                default: 0,
            },
        },
        computed: {
            poolListFormatted() {
                return this.poolList.map((pool) => {
                    return {
                        ...pool,
                        liquidityUsd: pool.liquidityBip * this.bipPriceUsd,
                        volumeUsd: pool.tradeVolumeBip30D * this.bipPriceUsd,
                    };
                });
            },
        },
        methods: {
            pretty,
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
                <th>Volume (30d)</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="pool in poolListFormatted" :key="pool.token.symbol">
                <td>
                    <nuxt-link class="link--default" :to="`/pools/${pool.coin0.symbol}/${pool.coin1.symbol}`">
                        {{ pool.coin0.symbol }} / {{ pool.coin1.symbol }}
                    </nuxt-link>
                </td>
<!--                <td>{{ pool.token.symbol }}</td>-->
                <td>{{ pool.coin0.symbol }} <span class="u-fw-500">{{ pretty(pool.amount0) }}</span></td>
                <td>{{ pool.coin1.symbol }} <span class="u-fw-500">{{ pretty(pool.amount1) }}</span></td>
                <td>${{ pretty(pool.liquidityUsd) }}</td>
                <td>${{ pretty(pool.volumeUsd) }}</td>
            </tr>
            </tbody>
        </table>
    </div>
</template>
