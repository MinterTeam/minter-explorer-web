<script>
import Big from 'big.js';
import {getPoolTransactionList, getPool, getPoolProviderList, getStatus} from "@/api/index.js";
import {pretty, prettyExact} from "~/assets/utils.js";
import getTitle from '~/assets/get-title.js';
import {getErrorText} from '~/assets/server-error.js';
import TransactionListTable from '~/components/TransactionListTable';
import PoolProviderList from '@/components/PoolProviderList.vue';
import BackButton from '@/components/BackButton.vue';
import Pagination from "@/components/Pagination.vue";
import {TAB_TYPES} from 'assets/variables.js';

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
        TransactionListTable,
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
        const statusPromise = getStatus();

        return Promise.all([poolPromise, statusPromise])
            .then(([pool, statusData]) => {
                return {
                    pool: pool,
                    bipPriceUsd: statusData.bipPriceUsd,
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
            bipPriceUsd: 0,
            storedTabPages: {},
            providerList: [],
            providerPaginationInfo: {},
            isProviderListLoading: false,
            isProviderListLoaded: false,
            txList: [],
            txPaginationInfo: {},
            isTxListLoading: false,
            isTxListLoaded: false,
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
        liquidityUsd() {
            return this.pool.liquidityBip * this.bipPriceUsd;
        },
        coin0Price() {
            return calculateTradeReturn(this.pool.amount0, this.pool.amount1);
        },
        coin1Price() {
            return calculateTradeReturn(this.pool.amount1, this.pool.amount0);
        },
        activeTab() {
            return ensureTab(this.$route.query.active_tab);
        },
        activePaginationInfo() {
            if (this.activeTab === TAB_TYPES.TX) {
                return this.txPaginationInfo;
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
                if (this.activeTab === TAB_TYPES.PROVIDER && !this.isProviderListLoaded) {
                    this.fetchProviderList();
                }

                this.checkPanelPosition();

                // same tab, new page
            } else if (newTab === oldTab && newPage !== oldPage) {
                if (this.activeTab === TAB_TYPES.TX) {
                    this.fetchTxs();
                }
                if (this.activeTab === TAB_TYPES.PROVIDER) {
                    this.fetchProviderList();
                }

                this.checkPanelPosition();
            }
        },
    },
};

function calculateTradeReturn(amountIn, amountOut) {
    if (Number(amountIn) === 0) {
        return 0;
    }
    return new Big(amountOut).div(amountIn);
    // return amountOut - (amountIn * amountOut / (amountIn + 1));
}
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
                <dt>Pool token</dt>
                <dd><nuxt-link class="link--default" :to="'/coins/' + pool.token.symbol">{{ pool.token.symbol }}</nuxt-link></dd>

                <dt>Pair</dt>
                <dd>
                    <nuxt-link class="link--default" :to="'/coins/' + pool.coin0.symbol">{{ pool.coin0.symbol }}</nuxt-link>
                    /
                    <nuxt-link class="link--default" :to="'/coins/' + pool.coin1.symbol">{{ pool.coin1.symbol }}</nuxt-link>
                </dd>

                <dt>Amount</dt>
                <dd><span class="u-fw-500">{{ prettyExact(pool.amount0) }}</span> {{ pool.coin0.symbol }}</dd>

                <dt>Amount </dt>
                <dd><span class="u-fw-500">{{ prettyExact(pool.amount1) }}</span> {{ pool.coin1.symbol }}</dd>

                <dt>Price {{ pool.coin0.symbol }}</dt>
                <dd><span class="u-fw-500">{{ pretty(coin0Price) }}</span> {{ pool.coin1.symbol }}</dd>

                <dt>Price {{ pool.coin1.symbol }}</dt>
                <dd><span class="u-fw-500">{{ pretty(coin1Price) }}</span> {{ pool.coin0.symbol }}</dd>

                <dt>Liquidity</dt>
                <dd>{{ prettyExact(pool.liquidity) }}</dd>

                <dt>Liquidity {{ $store.getters.BASE_COIN}}</dt>
                <dd>{{ pretty(pool.liquidityBip) }}</dd>

                <dt>Liquidity USD</dt>
                <dd>${{ pretty(liquidityUsd) }}</dd>
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
            <!-- Delegation -->
            <PoolProviderList
                v-if="activeTab === $options.TAB_TYPES.PROVIDER"
                :provider-list="providerList"
                :bip-price-usd="bipPriceUsd"
                :is-loading="isProviderListLoading"
            />
        </section>
        <Pagination :pagination-info="providerPaginationInfo"/>
    </div>
</template>
