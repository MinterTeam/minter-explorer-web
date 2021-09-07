<script>
import Big from 'big.js';
import {getPoolTransactionList, getPool, getPoolProviderList, getPoolOrderList} from "@/api/explorer.js";
import {getApy, pretty, prettyExact} from "~/assets/utils.js";
import getTitle from '~/assets/get-title.js';
import {getErrorText} from '~/assets/server-error.js';
import {TAB_TYPES} from '~/assets/variables.js';
import Amount from '@/components/common/Amount.vue';
import TransactionListTable from '~/components/TransactionListTable';
import PoolOrderList from '@/components/PoolOrderList.vue';
import PoolProviderList from '@/components/PoolProviderList.vue';
import BackButton from '@/components/BackButton.vue';
import Pagination from "@/components/Pagination.vue";

const DEFAULT_TAB = TAB_TYPES.TX;

function ensureTab(val) {
    return Object.values(TAB_TYPES).indexOf(val) !== -1 ? val : DEFAULT_TAB;
}
function ensurePage(val) {
    return val > 0 ? val : 1;
}

export default {
    TAB_TYPES,
    components: {
        Amount,
        TransactionListTable,
        PoolOrderList,
        PoolProviderList,
        BackButton,
        Pagination,
    },
    asyncData({ params, error }) {
        if (!params.coin0 || !params.coin1 || params.coin0 === params.coin1) {
            return error({
                statusCode: 404,
                message: 'Pool not found',
            });
        }

        const poolPromise = getPool(params.coin0, params.coin1);

        return Promise.all([poolPromise])
            .then(([pool]) => {
                return {
                    pool: pool,
                };
            })
            .catch((requestError) => {
                console.log(requestError);
                let statusCode = requestError.request && requestError.request.status;
                error({
                    statusCode,
                    message: statusCode === 404 ? 'Pool not found' : getErrorText(requestError),
                });
            });
    },
    fetch() {
        this.fetchTab(this.$route.query);
    },
    head() {
        const title = getTitle(`Pool ${this.pool.coin0.symbol}-${this.pool.coin1.symbol}`);

        return {
            title: title,
            meta: [
                { hid: 'og-title', name: 'og:title', content: title },
            ],
        };
    },
    data() {
        return {
            /** @type Pool */
            pool: {},
            storedTabPages: {},
            // pool providers
            providerList: [],
            providerPaginationInfo: {},
            isProviderListLoading: false,
            isProviderListLoaded: false,
            // txs
            txList: [],
            txPaginationInfo: {},
            isTxListLoading: false,
            isTxListLoaded: false,
            // limit orders
            orderList: [],
            orderPaginationInfo: {},
            isOrderListLoading: false,
            isOrderListLoaded: false,
        };
    },
    watch: {
        //@TODO handle multiple page change
        // update data on page change
        '$route.query': {
            handler(newVal, oldVal) {
                this.fetchTab(newVal, oldVal);
            },
        },
    },
    computed: {
        coin0Price() {
            return calculateTradeRate(this.pool.amount0, this.pool.amount1);
        },
        coin1Price() {
            return calculateTradeRate(this.pool.amount1, this.pool.amount0);
        },
        tradeFee() {
            return this.pool.tradeVolumeBip1D * 0.002;
        },
        apy() {
            return getApy(this.pool.tradeVolumeBip1D, this.pool.liquidityBip);
        },
        activeTab() {
            return ensureTab(this.$route.query.active_tab);
        },
        activePaginationInfo() {
            if (this.activeTab === TAB_TYPES.TX) {
                return this.txPaginationInfo;
            }
            if (this.activeTab === TAB_TYPES.ORDER) {
                return this.orderPaginationInfo;
            }
            if (this.activeTab === TAB_TYPES.PROVIDER) {
                return this.providerPaginationInfo;
            }
            return false;
        },
    },
    methods: {
        pretty,
        prettyExact,
        getCoinIconUrl(coin) {
            return this.$store.getters['explorer/getCoinIcon'](coin);
        },
        fetchProviderList() {
            this.isProviderListLoading = true;
            getPoolProviderList(this.$route.params.coin0, this.$route.params.coin1, this.$route.query)
                .then((providerListInfo) => {
                    this.providerList = providerListInfo.data;
                    this.providerPaginationInfo = providerListInfo.meta;
                    this.isProviderListLoading = false;
                    this.isProviderListLoaded = true;
                })
                .catch(() => {
                    this.isProviderListLoading = false;
                });
        },
        fetchTxs() {
            this.isTxListLoading = true;
            getPoolTransactionList(this.$route.params.coin0, this.$route.params.coin1, this.$route.query)
                .then((txListInfo) => {
                    this.txList = txListInfo.data;
                    this.txPaginationInfo = txListInfo.meta;
                    this.isTxListLoading = false;
                    this.isTxListLoaded = true;
                })
                .catch(() => {
                    this.isTxListLoading = false;
                });
        },
        fetchLimitOrderList() {
            this.isOrderListLoading = true;
            getPoolOrderList(this.$route.params.coin0, this.$route.params.coin1, this.$route.query)
                .then((orderListInfo) => {
                    this.orderList = orderListInfo.data;
                    this.orderPaginationInfo = orderListInfo.meta;
                    this.isOrderListLoading = false;
                    this.isOrderListLoaded = true;
                })
                .catch(() => {
                    this.isOrderListLoading = false;
                });
        },
        switchTab(newTab) {
            // save previous page
            if (this.$route.query.active_tab) {
                this.storedTabPages[this.$route.query.active_tab] = this.$route.query.page;
            }
            // restore saved page
            let newTabPage;
            if (this.storedTabPages[newTab]) {
                newTabPage = this.storedTabPages[newTab];
            }

            let newQuery = {
                page: newTabPage,
                active_tab: undefined, // fix: uncaught exception: Object
            };
            if (newTab !== DEFAULT_TAB) {
                newQuery.active_tab = newTab;
            }

            // update route
            this.$router.replace({
                // path: this.$route.path,
                query: newQuery,
            });

            // wait for rewards chart to disappear
            this.$nextTick(this.checkPanelPosition);
        },
        checkPanelPosition() {
            const panelEl = document.querySelector('[data-tab-panel]');
            if (panelEl && window.pageYOffset > panelEl.offsetTop) {
                window.scrollTo(0, panelEl.offsetTop - 15);
            }
        },
        fetchTab(newQuery, oldQuery) {
            const oldTab = oldQuery ? ensureTab(oldQuery.active_tab) : undefined;
            const newTab = ensureTab(newQuery.active_tab);
            const oldPage = oldQuery ? ensurePage(oldQuery.page) : undefined;
            const newPage = ensurePage(newQuery.page);

            // new tab
            if (newTab !== oldTab) {
                if (this.activeTab === TAB_TYPES.TX && !this.isTxListLoaded) {
                    this.fetchTxs();
                }
                if (this.activeTab === TAB_TYPES.ORDER && !this.isOrderListLoaded) {
                    this.fetchLimitOrderList();
                }
                if (this.activeTab === TAB_TYPES.PROVIDER && !this.isProviderListLoaded) {
                    this.fetchProviderList();
                }

                this.checkPanelPosition();

                // same tab, new page
            } else if (newTab === oldTab && newPage !== oldPage) {
                if (this.activeTab === TAB_TYPES.TX) {
                    this.fetchTxs();
                }
                if (this.activeTab === TAB_TYPES.ORDER) {
                    this.fetchLimitOrderList();
                }
                if (this.activeTab === TAB_TYPES.PROVIDER) {
                    this.fetchProviderList();
                }

                this.checkPanelPosition();
            }
        },
    },
};

function calculateTradeRate(amountIn, amountOut) {
    if (Number(amountIn) === 0 || Number.isNaN(Number(amountIn))) {
        return 0;
    }
    return new Big(amountOut).div(amountIn).toFixed(18);
}
// function calculateTradeReturn(amountIn, amountOut) {
//     return amountOut - (amountIn * amountOut / (amountIn + 1));
// }
</script>

<template>
    <div>
        <section class="panel u-section">
            <div class="panel__section panel__header">
                <h1 class="panel__header-title panel__title">
                    <BackButton/>
                    {{ pool.coin0.symbol }} / {{ pool.coin1.symbol }} pool
                </h1>
            </div>
            <dl>
                <dt>Pair</dt>
                <dd>
                    <div class="pool-pair">
                        <div class="pool-pair__figure">
                            <img class="pool-pair__icon" :src="getCoinIconUrl(pool.coin0.symbol)" width="24" height="24" alt="" role="presentation">
                            <img class="pool-pair__icon pool-pair__icon1" :src="getCoinIconUrl(pool.coin1.symbol)" width="24" height="24" alt="" role="presentation">
                        </div>
                        <div>
                            <nuxt-link class="link--default" :to="'/coins/' + pool.coin0.symbol">{{ pool.coin0.symbol }}</nuxt-link>
                            /
                            <nuxt-link class="link--default" :to="'/coins/' + pool.coin1.symbol">{{ pool.coin1.symbol }}</nuxt-link>
                        </div>
                    </div>
                </dd>

                <dt>Pool token</dt>
                <dd>
                    <span class="u-fw-500">{{ prettyExact(pool.liquidity) }}</span>
                    <nuxt-link class="link--default" :to="'/coins/' + pool.token.symbol">{{ pool.token.symbol }}</nuxt-link>
                </dd>


                <dt>Amount</dt>
                <Amount :amount="pool.amount0" :coin="pool.coin0.symbol" :exact="true" tag="dd"/>

                <dt>Amount </dt>
                <Amount :amount="pool.amount1" :coin="pool.coin1.symbol" :exact="true" tag="dd"/>

                <dt>Price {{ pool.coin0.symbol }}</dt>
                <Amount :amount="coin0Price" :coin="pool.coin1.symbol" :exact="false" tag="dd"/>

                <dt>Price {{ pool.coin1.symbol }}</dt>
                <Amount :amount="coin1Price" :coin="pool.coin0.symbol" :exact="false" tag="dd"/>



                <dt>Liquidity</dt>
                <Amount :amount="pool.liquidityBip" :coin="$store.getters.BASE_COIN" :exact="false" tag="dd"/>

                <dt>Volume (1d)</dt>
                <Amount :amount="pool.tradeVolumeBip1D" :coin="$store.getters.BASE_COIN" :exact="false" tag="dd"/>

                <dt>Fees (1d)</dt>
                <Amount :amount="tradeFee" :coin="$store.getters.BASE_COIN" :exact="false" tag="dd"/>

                <dt>APY</dt>
                <dd><span title="Based on 24hr volume annualized">{{ pretty(apy) }}%</span></dd>
            </dl>
        </section>

        <section class="panel u-section" data-tab-panel>
            <div class="panel__switcher">
                <button class="panel__switcher-item panel__switcher-item--small panel__title panel__header-title u-semantic-button"
                        :class="{'is-active': activeTab === $options.TAB_TYPES.TX}"
                        @click="switchTab($options.TAB_TYPES.TX)"
                >
                    <img class="panel__header-title-icon u-hidden-large-down" src="/img/icon-transaction.svg" width="40" height="40" alt="" role="presentation">
                    <span class="u-hidden-medium-down">Transactions</span>
                    <span class="u-hidden-medium-up">Txs</span>
                </button>
                <button class="panel__switcher-item panel__switcher-item--small panel__title panel__header-title u-semantic-button"
                        :class="{'is-active': activeTab === $options.TAB_TYPES.ORDER}"
                        @click="switchTab($options.TAB_TYPES.ORDER)"
                >
                    <img class="panel__header-title-icon u-hidden-large-down" src="/img/icon-transaction.svg" width="40" height="40" alt="" role="presentation">
                    <span class="u-hidden-medium-down">Limit orders</span>
                    <span class="u-hidden-medium-up">Orders</span>
                </button>
                <button class="panel__switcher-item panel__switcher-item--small panel__title panel__header-title u-semantic-button"
                        :class="{'is-active': activeTab === $options.TAB_TYPES.PROVIDER}"
                        @click="switchTab($options.TAB_TYPES.PROVIDER)"
                >
                    <img class="panel__header-title-icon u-hidden-large-down" src="/img/icon-pool.svg" width="40" height="40" alt="" role="presentation">
                    Providers
                </button>
            </div>
            <!-- Transactions -->
            <TransactionListTable
                v-if="activeTab === $options.TAB_TYPES.TX"
                :tx-list="txList"
                :current-address="$route.params.address"
                :is-loading="isTxListLoading"
            />
            <!-- Limit orders -->
            <PoolOrderList
                v-if="activeTab === $options.TAB_TYPES.ORDER"
                :order-list="orderList"
                item-type="address"
                :is-loading="isOrderListLoading"
            />
            <!-- Providers -->
            <PoolProviderList
                v-if="activeTab === $options.TAB_TYPES.PROVIDER"
                :provider-list="providerList"
                :is-loading="isProviderListLoading"
            />
        </section>
        <Pagination :pagination-info="activePaginationInfo" :active-tab="activeTab" v-if="activePaginationInfo"/>
    </div>
</template>
