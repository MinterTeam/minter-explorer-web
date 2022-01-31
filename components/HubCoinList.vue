<script>
import {pretty, getEvmAddressUrl, shortHashFilter} from '~/assets/utils.js';
import {HUB_CHAIN_ID, HUB_CHAIN_DATA, BSC_CHAIN_ID, ETHEREUM_CHAIN_ID} from '~/assets/variables.js';

export default {
    HUB_CHAIN_ID,
    HUB_CHAIN_DATA,
    props: {
        isLoading: {
            type: Boolean,
            default: false,
        },
        /**
         * @type Array<HubCoinItem>
         */
        coinList: {
            type: Array,
            required: true,
        },
        /**
         * @type Array<{name: string, value: string}>
         */
        priceList: {
            type: Array,
            required: true,
        },
    },
    data() {
        return {
        };
    },
    computed: {
        coinListMapped() {
            return this.coinList
                .map((coin) => coin.universalSymbol)
                // keep unique symbols
                .filter((symbol, index, self) => self.indexOf(symbol) === index)
                // group by universalSymbol
                .map((symbol) => {
                    return {
                        universalSymbol: symbol,
                        [HUB_CHAIN_ID.ETHEREUM]: getPair(this.coinList, symbol, HUB_CHAIN_ID.ETHEREUM),
                        [HUB_CHAIN_ID.BSC]: getPair(this.coinList, symbol, HUB_CHAIN_ID.BSC),
                    };
                })
                .map((item) => {
                    const pair = item[HUB_CHAIN_ID.ETHEREUM] || item[HUB_CHAIN_ID.BSC];
                    return {
                        ...item,
                        price: getPriceFromList(this.priceList, pair.minter.denom),
                        commission: pair.minter.commission,
                        iconSymbol: pair.minter.symbol,
                    };
                });

            function getPair(hubCoinList, universalSymbol, networkId) {
                const coin = hubCoinList.find((item) => item.universalSymbol === universalSymbol && item[networkId]);
                if (coin) {
                    return {
                        minter: pruneMinterToken(coin),
                        external: coin[networkId],
                    };
                } else {
                    return undefined;
                }
            }
            function pruneMinterToken(minterToken) {
                const cleanCoin = {...minterToken};
                delete cleanCoin[HUB_CHAIN_ID.BSC];
                delete cleanCoin[HUB_CHAIN_ID.ETHEREUM];
                return cleanCoin;
            }
        },
    },
    methods: {
        $td(val) {
            return val;
        },
        pretty,
        shortHash: (value) => shortHashFilter(value, 4),
        getEthereumAddressUrl(address) {
            return getEvmAddressUrl(ETHEREUM_CHAIN_ID, address);
        },
        getBscAddressUrl(address) {
            return getEvmAddressUrl(BSC_CHAIN_ID, address);
        },
    },
};

/**
 *
 * @param {Array<HubPriceItem>} list
 * @param {string} name
 * @return {string|number}
 */
function getPriceFromList(list, name) {
    const priceItem = list.find((item) => item.name === name);
    return priceItem ? priceItem.value : '0';
}
</script>

<template>
    <section class="panel">
        <template v-if="!isLoading">
            <div class="table-wrap" v-if="coinList.length">
                <table>
                    <thead>
                        <tr class="u-text-nowrap">
                            <th>
                                <span class="u-hidden-small-down">{{ $td('Available tokens', 'hub.coin-table-name') }}</span>
                                <span class="u-hidden-small-up">{{ $td('Tokens', 'hub.coin-table-name-mobile') }}</span>
                            </th>
                            <th>
                                {{ $options.HUB_CHAIN_DATA[$options.HUB_CHAIN_ID.ETHEREUM].shortName }}
                                {{ $td('bridge', 'hub.coin-table-contract') }}
                            </th>
                            <th>
                                {{ $options.HUB_CHAIN_DATA[$options.HUB_CHAIN_ID.BSC].shortName }}
                                {{ $td('bridge', 'hub.coin-table-contract') }}
                            </th>
                            <th>{{ $td('Price', 'hub.coin-table-price') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="u-text-nowrap" :key="group.universalSymbol" v-for="group in coinListMapped">
                            <td>
                                <img
                                    class="u-icon--coin-table"
                                    width="20" height="20" alt="" role="presentation"
                                    :src="$store.getters['explorer/getCoinIcon'](group.iconSymbol)"
                                >
                                {{ group.universalSymbol }}
                            </td>
                            <td>
                                <template v-if="group.ethereum">
                                    <nuxt-link class="link--default" :to="'/coins/' + group.ethereum.minter.symbol" target="_blank">
                                        <img class="u-icon--coin-small" src="/img/minter-logo-circle.svg" alt="Minter">
                                        {{ group.ethereum.minter.symbol }}
                                    </nuxt-link>

                                    <span class="u-icon--left-right-arrow">⟷</span>

                                    <a class="link--default" :href="getEthereumAddressUrl(group.ethereum.external.externalTokenId)" target="_blank">
                                        <img class="u-icon--coin-small" src="/img/icon-network-ethereum.svg" alt="Ethereum">
                                        {{ shortHash(group.ethereum.external.externalTokenId) }}
                                    </a>
                                </template>
                            </td>
                            <td>
                                <template v-if="group.bsc">
                                    <nuxt-link class="link--default" :to="'/coins/' + group.bsc.minter.symbol" target="_blank">
                                        <img class="u-icon--coin-small" src="/img/minter-logo-circle.svg" alt="Minter">
                                        {{ group.bsc.minter.symbol }}
                                    </nuxt-link>

                                    <span class="u-icon--left-right-arrow">⟷</span>

                                    <a class="link--default" :href="getBscAddressUrl(group.bsc.external.externalTokenId)" target="_blank">
                                        <img class="u-icon--coin-small" src="/img/icon-network-bsc.svg" alt="BSC">
                                        {{ shortHash(group.bsc.external.externalTokenId) }}
                                    </a>
                                </template>
                            </td>
                            <!-- price -->
                            <td>
                                ${{ pretty(group.price) }}
                            </td>
                            <!-- fee -->
<!--                            <td>-->
<!--                                {{ pretty(group.commission * 100) }}%-->
<!--                            </td>-->
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="panel__content panel__section u-text-center" v-else>No Coins</div>
        </template>
        <div class="panel__content panel__section u-text-center" v-else>
            <svg class="loader" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28">
                <circle class="loader__path" cx="14" cy="14" r="12"></circle>
            </svg>
        </div>
    </section>
</template>

