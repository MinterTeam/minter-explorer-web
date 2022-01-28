<script>
import {getApy, pretty} from '~/assets/utils.js';
import Amount from '~/components/common/Amount.vue';
import TableLink from '@/components/TableLink.vue';

const ITEM_TYPE = {
    PROVIDER: 'provider',
    PROVIDER_POOL: 'pool',
};

export default {
    ITEM_TYPE,
    components: {
        Amount,
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
                    apy = getApy(provider.tradeVolumeBip1D, provider.totalLiquidityBip);
                }

                return {
                    ...provider,
                    liquidityUsd: provider.liquidityBip * this.$store.getters['explorer/bipPriceUsd'],
                    apy,
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
                <th>
                    <template v-if="itemType === $options.ITEM_TYPE.PROVIDER">
                        {{ providerList[0].token.symbol }}
                    </template>
                    <template v-else>LP</template>
                     amount
                </th>
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
                    <div class="pool-pair" v-else>
                        <div class="pool-pair__figure">
                            <img class="pool-pair__icon" :src="getCoinIconUrl(provider.coin0.symbol)" width="24" height="24" alt="" role="presentation">
                            <img class="pool-pair__icon pool-pair__icon1" :src="getCoinIconUrl(provider.coin1.symbol)" width="24" height="24" alt="" role="presentation">
                        </div>
                        <TableLink
                            :link-text="provider.coin0.symbol + ' / ' + provider.coin1.symbol"
                            :link-path="`/pools/${provider.coin0.symbol}/${provider.coin1.symbol}`"
                            :should-not-shorten="true"
                        />
                    </div>
                </td>
                <td>
                    <Amount :amount="provider.amount0" :coin="provider.coin0.symbol" :price-usd="false" :coin-first="itemType === $options.ITEM_TYPE.PROVIDER"/>
                </td>
                <td>
                    <Amount :amount="provider.amount1" :coin="provider.coin1.symbol" :price-usd="false" :coin-first="itemType === $options.ITEM_TYPE.PROVIDER"/>
                </td>
                <td>
                    <span class="u-fw-500">{{ pretty(provider.liquidity) }}</span>
                    <template v-if="itemType === $options.ITEM_TYPE.PROVIDER_POOL">{{ provider.token.symbol }}</template>
                </td>
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
