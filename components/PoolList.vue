<script>
    import {prettyRound} from '~/assets/utils.js';

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
                    };
                });
            },
        },
        methods: {
            prettyRound,
        },
    };
</script>

<template>
    <div class="table-wrap">
        <table class="u-text-nowrap">
            <thead>
            <tr>
                <th>Pool token</th>
                <th>Pair</th>
                <th colspan="2">Amount</th>
                <th>Liquidity</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="pool in poolListFormatted" :key="pool.token.symbol">
                <td><nuxt-link class="link--default" :to="'/coins/' + pool.token.symbol">{{ pool.token.symbol }}</nuxt-link></td>
                <td>
                    <nuxt-link class="link--default" :to="`/pools/${pool.coin0.symbol}/${pool.coin1.symbol}`">
                        {{ pool.coin0.symbol }}-{{ pool.coin1.symbol }}
                    </nuxt-link>
                </td>
                <td>{{ prettyRound(pool.amount0) }} {{ pool.coin0.symbol }}</td>
                <td>{{ prettyRound(pool.amount1) }} {{ pool.coin1.symbol }}</td>
                <td>{{ prettyRound(pool.liquidityUsd) }} $</td>
            </tr>
            </tbody>
        </table>
    </div>
</template>
