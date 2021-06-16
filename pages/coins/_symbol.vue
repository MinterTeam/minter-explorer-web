<script>
import {getCoinBySymbol, getPoolByToken, getPoolList} from '~/api/explorer.js';
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
    asyncData({ params, error, redirect }) {
        if (!params.symbol || params.symbol.length < 3) {
            return error({
                statusCode: 404,
                message: 'Invalid coin symbol',
            });
        }

        if (params.symbol !== params.symbol.toUpperCase()) {
            return redirect('/coins/' + params.symbol.toUpperCase());
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

        return Promise.all([poolListPromise, poolTokenPromise]);
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
        isToken() {
            return this.coinInfo.type === 'token' || this.coinInfo.type === 'pool_token';
        },
        isPoolToken() {
            return this.$route.params.symbol.indexOf('LP-') === 0;
        },
    },
    methods: {
        pretty,
        prettyExact,
        prettyPrecise,
        getCoinIconUrl(coin) {
            return this.$store.getters['explorer/getCoinIcon'](coin);
        },
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
                <dd class="dd" :class="{'u-text-muted': !coinInfo.name }">{{ coinInfo.name || 'Blank' }}</dd>

                <dt>Symbol</dt>
                <dd>
                    <div class="u-icon-wrap">
                        <img class="u-icon--coin" :src="getCoinIconUrl(coinInfo.symbol)" width="20" height="20" alt="" role="presentation">
                        {{ coinInfo.symbol }}
                        <img class="u-icon--verified" src="/img/icon-verified.svg" width="12" height="12" alt="" role="presentation" v-if="coinInfo.verified">
                    </div>
                </dd>

                <dt v-if="!isToken">CRR</dt>
                <dd v-if="!isToken">{{ coinInfo.crr }} %</dd>

                <dt>Volume</dt>
                <dd :title="prettyPrecise(coinInfo.volume)">{{ pretty(coinInfo.volume) }}</dd>

                <dt v-if="!isToken">Reserve</dt>
                <dd v-if="!isToken" :title="prettyPrecise(coinInfo.reserveBalance)">{{ pretty(coinInfo.reserveBalance) }} {{ $store.getters.COIN_NAME }}</dd>

                <dt>Max supply</dt>
                <dd :title="prettyPrecise(coinInfo.maxSupply)">{{ pretty(coinInfo.maxSupply) }}</dd>

                <dt v-if="!isPoolToken">Owner address</dt>
                <dd v-if="!isPoolToken">
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
                <dt v-if="pool">First coin</dt>
                <dd v-if="pool">
                    {{ pretty(pool.amount0) }}
                    <nuxt-link class="link--default" :to="'/coins/' + pool.coin0.symbol">{{ pool.coin0.symbol }}</nuxt-link>
                </dd>
                <dt v-if="pool">Second coin</dt>
                <dd v-if="pool">
                    {{ pretty(pool.amount1) }}
                    <nuxt-link class="link--default" :to="'/coins/' + pool.coin1.symbol">{{ pool.coin1.symbol }}</nuxt-link>
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
            <PoolList v-if="!$fetchState.pending" :pool-list="poolList"/>
            <div class="panel__section" v-else>Loading…</div>
        </section>
        <Pagination :pagination-info="paginationInfo"/>
    </div>
</template>
