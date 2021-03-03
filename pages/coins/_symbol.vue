<script>
import {getCoinBySymbol, getPoolByToken, getPoolList, getStatus} from "~/api/index.js";
import {pretty, prettyPrecise, prettyExact} from "~/assets/utils.js";
import getTitle from '~/assets/get-title.js';
import {getErrorText} from '~/assets/server-error.js';
import BackButton from '~/components/BackButton.vue';
import Pagination from "~/components/Pagination.vue";
import PoolList from '~/components/PoolList.vue';

export default {
    components: {
        BackButton,
        Pagination,
        PoolList,
    },
    asyncData({ params, error }) {
        if (!params.symbol || params.symbol.length < 3) {
            return error({
                statusCode: 404,
                message: 'Invalid coin symbol',
            });
        }

        return getCoinBySymbol(params.symbol)
            .then((coinInfo) => {
                return {
                    coinInfo,
                };
            })
            .catch((e) => {
                console.log({e});
                let statusCode = e.request && e.request.status;
                error({
                    statusCode,
                    message: statusCode === 404 ? 'Coin not found' : getErrorText(e),
                });
            });
    },
    fetch() {
        let poolTokenPromise;
        if (this.isPoolToken) {
            poolTokenPromise = getPoolByToken(this.$route.params.symbol)
                .then((pool) => {
                    this.pool = pool;
                });
        }
        const poolListPromise = getPoolList({...this.$route.query, coin: this.$route.params.symbol})
            .then((poolListInfo) => {
                this.paginationInfo = poolListInfo.meta;
                this.poolList = poolListInfo.data || [];
            });
        const statusPromise = getStatus()
            .then((statusData) => {
                this.bipPriceUsd = statusData.bipPriceUsd;
            });

        return Promise.all([poolListPromise, statusPromise, poolTokenPromise]);
    },
    head() {
        const title = getTitle('Coin ' + this.$route.params.symbol);

        return {
            title: title,
            meta: [
                { hid: 'og-title', name: 'og:title', content: title },
            ],
        };
    },
    data() {
        return {
            /** @type CoinInfo */
            coinInfo: {},
            /** @type Pool|null */
            pool: null,
            paginationInfo: {},
            /** @type Array<Pool> */
            poolList: [],
            bipPriceUsd: 0,
        };
    },
    watch: {
        '$route.query.page': {
            handler() {
                this.$fetch();
            },
        },
    },
    computed: {
        isPoolToken() {
            return this.$route.params.symbol.indexOf('P-') === 0;
        },
    },
    methods: {
        pretty,
        prettyExact,
        prettyPrecise,
    },
};
</script>

<template>
    <div>
        <section class="panel u-section">
            <div class="panel__section panel__header">
                <h1 class="panel__header-title panel__title">
                    <BackButton/>
                    Coin information
                </h1>
            </div>
            <dl>
                <dt>ID</dt>
                <dd>{{ coinInfo.id }}</dd>

                <dt>Name</dt>
                <dd :class="{'u-text-muted': !coinInfo.name }">{{ coinInfo.name || 'Blank' }}</dd>

                <dt>Symbol</dt>
                <dd>{{ coinInfo.symbol }}</dd>

                <dt>CRR</dt>
                <dd>{{ coinInfo.crr }} %</dd>

                <dt>Volume</dt>
                <dd :title="prettyPrecise(coinInfo.volume)">{{ pretty(coinInfo.volume) }}</dd>

                <dt>Reserve</dt>
                <dd :title="prettyPrecise(coinInfo.reserveBalance)">{{ pretty(coinInfo.reserveBalance) }} {{ $store.getters.COIN_NAME }}</dd>

                <dt>Max supply</dt>
                <dd :title="prettyPrecise(coinInfo.maxSupply)">{{ pretty(coinInfo.maxSupply) }}</dd>

                <dt>Owner address</dt>
                <dd>
                    <nuxt-link class="link--default" :to="'/address/' + coinInfo.ownerAddress" v-if="coinInfo.ownerAddress">
                        {{ coinInfo.ownerAddress }}
                    </nuxt-link>
                    <span class="u-text-muted" v-else>Blank</span>

                </dd>

                <dt v-if="pool">Pool</dt>
                <dd v-if="pool">
                    <nuxt-link class="link--default" :to="'/pools/' + pool.coin0.symbol + '/' + pool.coin1.symbol">
                        {{ pool.coin0.symbol }} / {{ pool.coin1.symbol }}
                    </nuxt-link>
                </dd>
            </dl>
        </section>

        <section class="panel u-section" v-if="poolList.length">
            <div class="panel__section panel__header">
                <h2 class="panel__header-title panel__title">
                    <img class="panel__header-title-icon" src="/img/icon-pool.svg" width="40" height="40" alt="" role="presentation">
                    Liquidity pools with {{ $route.params.symbol }}
                </h2>
            </div>
            <PoolList v-if="!$fetchState.pending" :pool-list="poolList" :bip-price-usd="bipPriceUsd"/>
            <div class="panel__section" v-else>Loading…</div>
        </section>
        <Pagination :pagination-info="paginationInfo"/>
    </div>
</template>
