<script>
import {pretty} from '~/assets/utils.js';

export default {
    props: {
        /** @type Array<PoolProvider> */
        providerList: {
            type: Array,
            required: true,
        },
        bipPriceUsd: {
            type: Number,
            default: 0,
        },
    },
    computed: {
        providerListFormatted() {
            return this.providerList.map((provider) => {
                return {
                    ...provider,
                    liquidityUsd: provider.liquidityBip * this.bipPriceUsd,
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
    <section class="panel u-section">
        <div class="panel__section panel__header">
            <h1 class="panel__title panel__header-title">
                <img class="panel__header-title-icon" src="/img/icon-pool.svg" width="40" height="40" alt="" role="presentation">
                Providers
            </h1>
        </div>
        <div class="table-wrap">
            <table class="u-text-nowrap">
                <thead>
                <tr>
                    <th>Amount {{ providerList[0].coin0.symbol }}</th>
                    <th>Amount {{ providerList[0].coin1.symbol }}</th>
                    <th>Liquidity</th>
                    <th>Liquidity {{ $store.getters.BASE_COIN }}</th>
                    <th>Liquidity USD</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="provider in providerListFormatted" :key="provider.poolToken">
                    <td>{{ pretty(provider.amount0) }}</td>
                    <td>{{ pretty(provider.amount1) }}</td>
                    <td>{{ pretty(provider.liquidity) }}</td>
                    <td>{{ pretty(provider.liquidityBip) }} {{ $store.getters.BASE_COIN }}</td>
                    <td>{{ pretty(provider.liquidityUsd) }} $</td>
                </tr>
                </tbody>
            </table>
        </div>
    </section>
</template>
