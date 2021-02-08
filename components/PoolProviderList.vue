<script>
import debounce from 'lodash-es/debounce.js';
import {pretty} from '~/assets/utils.js';
import TableLink from '@/components/TableLink.vue';

let resizeHandler;

export default {
    components: {
        TableLink,
    },
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
    data() {
        return {
            shouldShorten: this.getShouldShorten(),
        };
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
    mounted() {
        if (process.client) {
            resizeHandler = debounce(() => {
                this.shouldShorten = this.getShouldShorten();
            });
            window.addEventListener('resize', resizeHandler, 100);
        }
    },
    destroyed() {
        if (resizeHandler) {
            window.removeEventListener('resize', resizeHandler);
        }
    },
    methods: {
        pretty,
        getShouldShorten() {
            return process.client && window.innerWidth < 960;
        },
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
                    <th>Provider</th>
                    <th colspan="2">Amount</th>
                    <th>Liquidity</th>
                    <th>Liquidity price</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="provider in providerListFormatted" :key="provider.address">
                    <td>
                        <TableLink :link-text="provider.address"
                                   :link-path="'/address/' + provider.address"
                                   :should-not-shorten="!shouldShorten"
                        />
                    </td>
                    <td>{{ provider.coin0.symbol }} {{ pretty(provider.amount0) }}</td>
                    <td>{{ provider.coin1.symbol }} {{ pretty(provider.amount1) }}</td>
                    <td>{{ pretty(provider.liquidity) }}</td>
                    <td>
                        {{ pretty(provider.liquidityBip) }} {{ $store.getters.BASE_COIN }}
                        (${{ pretty(provider.liquidityUsd) }})
                    </td>
                </tr>
                </tbody>
            </table>
        </div>
    </section>
</template>