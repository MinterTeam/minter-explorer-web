<script>
import {pretty} from '~/assets/utils.js';
import TableLink from '@/components/TableLink.vue';

const ITEM_TYPE = {
    PROVIDER: 'provider',
    PROVIDER_POOL: 'pool',
};

export default {
    ITEM_TYPE,
    components: {
        TableLink,
    },
    props: {
        /** @type Array<PoolProvider> */
        providerList: {
            type: Array,
            required: true,
        },
        itemType: {
            type: String,
            default: ITEM_TYPE.PROVIDER,
        },
        isLoading: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
        };
    },
    computed: {
        providerListFormatted() {
            return this.providerList.map((provider) => {
                let apy;
                if (this.itemType === ITEM_TYPE.PROVIDER_POOL && provider.tradeVolumeBip1D > 0 && provider.totalLiquidityBip > 0) {
                    const tradeFee = provider.tradeVolumeBip1D * 0.002;
                    const apr = tradeFee / provider.totalLiquidityBip * 365;
                    apy = ((1 + apr / 365) ** 365 - 1) * 100;
                }

                return {
                    ...provider,
                    liquidityUsd: provider.liquidityBip * this.$store.getters.bipPriceUsd,
                    apy,
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
        <div class="panel__content panel__section u-text-center" v-if="isLoading">
            <svg class="loader" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28">
                <circle class="loader__path" cx="14" cy="14" r="12"></circle>
            </svg>
        </div>
        <table class="u-text-nowrap" v-else-if="providerList.length">
            <thead>
            <tr>
                <th>
                    <template v-if="itemType === $options.ITEM_TYPE.PROVIDER">Provider</template>
                    <template v-else>Pool</template>
                </th>
                <th colspan="2">Amount</th>
                <th>{{ providerList[0].token.symbol }} amount</th>
                <th>Liquidity</th>
                <th>Share</th>
                <th v-if="itemType === $options.ITEM_TYPE.PROVIDER_POOL">APY</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="provider in providerListFormatted" :key="provider.address">
                <td>
                    <TableLink :link-text="provider.address"
                               :link-path="'/address/' + provider.address"
                               :should-not-shorten="false"
                               v-if="itemType === $options.ITEM_TYPE.PROVIDER"
                    />
                    <TableLink
                        v-else
                        :link-text="provider.coin0.symbol + ' / ' + provider.coin1.symbol"
                        :link-path="`/pools/${provider.coin0.symbol}/${provider.coin1.symbol}`"
                        :should-not-shorten="true"
                    />
                </td>
                <td>{{ provider.coin0.symbol }} <span class="u-fw-500">{{ pretty(provider.amount0) }}</span></td>
                <td>{{ provider.coin1.symbol }} <span class="u-fw-500">{{ pretty(provider.amount1) }}</span></td>
                <td>{{ pretty(provider.liquidity) }}</td>
                <td>
                    ${{ pretty(provider.liquidityUsd) }}
                </td>
                <td>
                    {{ pretty(provider.liquidityShare) }}%
                </td>
                <td v-if="itemType === $options.ITEM_TYPE.PROVIDER_POOL">
                    {{ pretty(provider.apy || 0) }}%
                </td>
            </tr>
            </tbody>
        </table>
        <div class="panel__content panel__section u-text-center" v-else>
            <template v-if="itemType === $options.ITEM_TYPE.PROVIDER">No providers</template>
            <template v-else>No pools</template>
        </div>
    </div>
</template>
