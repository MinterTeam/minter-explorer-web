<script>
import {getPoolOrderList} from '@/api/explorer.js';
import {pretty} from '~/assets/utils.js';
import PoolOrderList from '@/components/PoolOrderList.vue';

const TYPE_SELL = 'sell';
const TYPE_BUY = 'buy';

export default {
    components: {
    },
    fetch() {
        return this.fetchOrderBook(1);
    },
    props: {
        pool: {
            type: Object,
            required: true,
        },
    },
    data() {
        return {
            sellList: [],
            buyList: [],
            currentPage: 0,
            lastPage: 0,
            isLoading: false,
        };
    },
    methods: {
        pretty,
        getCoinIconUrl(coin) {
            return this.$store.getters['explorer/getCoinIcon'](coin);
        },
        fetchOrderBook(page) {
            this.isLoading = false;
            return Promise.all([this.getOrderList(TYPE_SELL), this.getOrderList(TYPE_BUY)])
                .then(() => {
                    this.isLoading = false;
                    this.currentPage = page;
                })
                .finally(() => {
                    this.isLoading = false;
                });
        },
        getOrderList(type, page = 1) {
            if (page === 1) {
                page = undefined;
            }
            return getPoolOrderList(this.pool.coin0.symbol, this.pool.coin1.symbol, {type, page, status: 'active'})
                .then((poolListInfo) => {
                    const orderList = poolListInfo.data.map((order) => sortOrder(order, this.pool.coin0.symbol));
                    if (type === TYPE_SELL) {
                        this.sellList = Object.freeze([].concat(this.sellList, orderList));
                    }
                    if (type === TYPE_BUY) {
                        this.buyList = Object.freeze([].concat(this.buyList, orderList));
                    }
                });
        },
        reverse(list) {
            return list.slice().reverse();
        },
        loadMore() {
            if (this.isLoading) {
                return;
            }
            if (this.currentPage >= this.lastPage) {
                return;
            }

            this.fetchOrderBook(this.currentPage + 1);
        },
        switchCoins() {
            const {name, query, params} = this.$route;
            this.$router.replace({
                name,
                query,
                params: {
                    coin0: params.coin1,
                    coin1: params.coin0,
                },
            });
        },
    },
};

/**
 * @param {LimitOrder} order
 * @param {string} baseSymbol
 * @return {{amount1: (string|number), coin1, amount0: (string|number), coin0, coin0Price: (string|number), coin1Price: (string|number)}}
 */
function sortOrder(order, baseSymbol) {
    if (order.coinToSell.symbol === baseSymbol) {
        return {
            id: order.id,
            coin0: order.coinToSell,
            coin1: order.coinToBuy,
            coin0Price: order.coinToSellPrice,
            coin1Price: order.coinToBuyPrice,
            amount0: order.coinToSellVolume,
            amount1: order.coinToBuyVolume,
        };
    } else {
        return {
            id: order.id,
            coin0: order.coinToBuy,
            coin1: order.coinToSell,
            coin0Price: order.coinToBuyPrice,
            coin1Price: order.coinToSellPrice,
            amount0: order.coinToBuyVolume,
            amount1: order.coinToSellVolume,
        };
    }
}
</script>

<template>
    <section class="panel u-section" v-if="!$fetchState.error && (buyList.length || sellList.length || isLoading)">
        <div class="panel__section panel__header">
            <h2 class="panel__header-title panel__title">
                <img class="panel__header-title-icon" src="/img/icon-limit-order.svg" width="40" height="40" alt="" role="presentation">
                Order book
            </h2>
            <button class="pool-pair__button u-semantic-button link--opacity" @click="switchCoins()">
                <img class="" src="/img/icon-reverse.svg" width="24" height="24" alt="" role="presentation">
            </button>
<!--            <nuxt-link class="button button&#45;&#45;ghost-main button&#45;&#45;small" to="/farming">View all</nuxt-link>-->
        </div>
        <div class="panel__section panel__content u-text-center" v-if="isLoading">
            <svg class="loader" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28">
                <circle class="loader__path" cx="14" cy="14" r="12"></circle>
            </svg>
        </div>
        <div class="panel__section panel__content order-book" v-else>
            <div class="order-book__item order-book__item--head">
                <div class="order-book__cell">Price ({{ pool.coin1.symbol }})</div>
                <div class="order-book__cell">Amount ({{ pool.coin0.symbol }})</div>
            </div>

            <div class="order-book__item" v-for="item in reverse(sellList)" :key="item.id">
                <div class="order-book__cell u-text-fail">{{ pretty(item.coin0Price) }}</div>
                <div class="order-book__cell">{{ pretty(item.amount0) }}</div>
            </div>

            <div class="order-book__item">
                <div class="order-book__cell order-book__price">{{ pretty(pool.amount1 / pool.amount0) }}</div>
                <div class="order-book__cell" v-if="currentPage < lastPage">
                    <button class="u-semantic-button link--main link--hover" @click="loadMore()">Load more</button>
                </div>
            </div>

            <div class="order-book__item" v-for="item in buyList" :key="item.id">
                <div class="order-book__cell u-text-success">{{ pretty(item.coin0Price) }}</div>
                <div class="order-book__cell">{{ pretty(item.amount0) }}</div>
            </div>
        </div>
    </section>
</template>
