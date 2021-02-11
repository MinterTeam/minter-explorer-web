<script>
import Big from 'big.js';
import {getPool, getPoolProviderList, getStatus} from "@/api/index.js";
import {pretty, prettyExact} from "~/assets/utils.js";
import getTitle from '~/assets/get-title.js';
import {getErrorText} from '~/assets/server-error.js';
import PoolProviderList from '@/components/PoolProviderList.vue';
import BackButton from '@/components/BackButton.vue';
import Pagination from "@/components/Pagination.vue";

export default {
    components: {
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
        this.fetchProviderList();
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
            isProviderListLoading: false,
            providerList: [],
            providerPaginationInfo: {},
        };
    },
    watch: {
        //@TODO handle multiple page change
        // update data on page change
        '$route.query': {
            handler(newVal, oldVal) {
                if (newVal.page !== oldVal.page) {
                    this.fetchProviderList();

                    this.checkPanelPosition();
                }
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
                })
                .catch(() => {
                    this.isProviderListLoading = false;
                });
        },
        checkPanelPosition() {
            const providerPanelEl = document.querySelector('[data-provider-panel]');
            if (window.pageYOffset > providerPanelEl.offsetTop) {
                window.scrollTo(0, providerPanelEl.offsetTop - 15);
            }
        },
    },
};

function calculateTradeReturn(amountIn, amountOut) {
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
                    {{ pool.coin0.symbol }}-{{ pool.coin1.symbol }} pool
                </h1>
            </div>
            <dl>
                <dt>Pool token</dt>
                <dd><nuxt-link class="link--default" :to="'/coins/' + pool.token.symbol">{{ pool.token.symbol }}</nuxt-link></dd>

                <dt>Pair</dt>
                <dd>{{ pool.coin0.symbol }} / {{ pool.coin1.symbol }}</dd>

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
        <PoolProviderList data-provider-panel
                          v-if="providerList.length"
                         :provider-list="providerList"
                         :is-loading="isProviderListLoading"
        />
        <Pagination :pagination-info="providerPaginationInfo"/>
    </div>
</template>
