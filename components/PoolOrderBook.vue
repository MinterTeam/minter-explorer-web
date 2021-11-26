<script>
import Big from '~/assets/big.js';
import {getPoolOrderList} from '@/api/explorer.js';
import {pretty, decreasePrecisionSignificant} from '~/assets/utils.js';

const TYPE_SELL = 'sell';
const TYPE_BUY = 'buy';
const BOOK_LENGTH = 15;
const MAX_POWER = 'max';

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
            /** @type {Array<LimitOrderSorted>} */
            sellOrderList: [],
            /** @type {Array<LimitOrderSorted>} */
            buyOrderList: [],
            seenOrderMap: {},
            currentPage: 0,
            sellLastPage: undefined,
            buyLastPage: undefined,
            isLoading: false,
            loadTimestamp: 0,
            selectedPriceGroupIndex: 4,
        };
    },
    computed: {
        whatAffectBook(){
            return {
                sellBook: this.sellBook,
                buyBook: this.buyBook,
                isLoading: this.isLoading,
                selectedPriceGroupIndex: this.selectedPriceGroupIndex,
            };
        },
        lastPage() {
            return Math.max(this.sellLastPage, this.buyLastPage);
        },
        midPrice() {
            return this.pool.amount1 / this.pool.amount0;
        },
        priceGroupPowerList() {
            const midPricePower = getExponent(this.midPrice);
            let groupPowers = [MAX_POWER];
            for (let i = 0; i < 4; i++) {
                groupPowers.push(midPricePower - i);
            }
            return groupPowers;
        },
        priceGroupOptions() {
            return this.priceGroupPowerList.map((power) => power === MAX_POWER ? 'Max' : new Big(10).pow(power).toString());
        },
        sellBook() {
            const selectedPower = this.priceGroupPowerList[this.selectedPriceGroupIndex];
            let groupBase;
            if (selectedPower === MAX_POWER) {
                groupBase = (this.midPrice * 5 - this.midPrice) / BOOK_LENGTH;
                groupBase = roundGroupBase(groupBase);
            } else {
                groupBase = 10 ** selectedPower;
            }
            return groupOrdersByPrice(this.sellOrderList, groupBase).reverse();
        },
        buyBook() {
            const selectedPower = this.priceGroupPowerList[this.selectedPriceGroupIndex];
            let groupBase;
            if (selectedPower === MAX_POWER) {
                groupBase = (this.midPrice - this.midPrice / 5) / BOOK_LENGTH;
                groupBase = roundGroupBase(groupBase);
            } else {
                groupBase = 10 ** selectedPower;
            }
            return groupOrdersByPrice(this.buyOrderList, groupBase);
        },
        sellBookMaxAmount() {
            return this.sellBook.reduce((limit, item) => Math.max(limit, item.amount), 0);
        },
        buyBookMaxAmount() {
            return this.buyBook.reduce((limit, item) => Math.max(limit, item.amount), 0);
        },
    },
    watch: {
        whatAffectBook() {
            if (this.isLoading) {
                return;
            }
            const shouldLoadSell = this.currentPage < this.sellLastPage && this.sellBook.length < BOOK_LENGTH;
            const shouldLoadBuy = this.currentPage < this.buyLastPage && this.buyBook.length < BOOK_LENGTH;

            if (shouldLoadSell || shouldLoadBuy) {
                this.fetchOrderBook(this.currentPage + 1);
            }
        },
    },
    methods: {
        pretty,
        decreasePrecisionSignificant,
        fetchOrderBook(page) {
            this.isLoading = true;

            // throttle to 4 rps (2 requests per 500ms)
            const waitPromise = (Date.now() - this.loadTimestamp) < 500 ? wait(500) : Promise.resolve();
            return waitPromise
                .then(() => {
                    return Promise.all([
                        this.getOrderList(TYPE_SELL, page),
                        this.getOrderList(TYPE_BUY, page),
                    ]);
                })
                .then(() => {
                    this.currentPage = page;
                })
                .finally(() => {
                    this.loadTimestamp = Date.now();
                    this.isLoading = false;
                });
        },
        getOrderList(type, page = 1) {
            if ((type === TYPE_SELL && page > this.sellLastPage) || (type === TYPE_BUY && page > this.buyLastPage)) {
                return;
            }
            if (page === 1) {
                page = undefined;
            }
            return getPoolOrderList(this.pool.coin0.symbol, this.pool.coin1.symbol, {type, page, limit: 150, status: 'active'})
                .then((poolListInfo) => {
                    const orderList = poolListInfo.data
                        // filter out seen orders (coz pagination may change order position among pages over time)
                        .filter((order) => !this.seenOrderMap[order.id])
                        .map((order) => sortOrderFields(order, this.pool.coin0.symbol));

                    if (type === TYPE_SELL) {
                        this.sellOrderList = Object.freeze([].concat(this.sellOrderList, orderList));
                        this.sellLastPage = poolListInfo.meta.lastPage;
                    }
                    if (type === TYPE_BUY) {
                        this.buyOrderList = Object.freeze([].concat(this.buyOrderList, orderList));
                        this.buyLastPage = poolListInfo.meta.lastPage;
                    }

                    // fill seenMap
                    const newSeenEntries = orderList.map((order) => [order.id, true]);
                    this.seenOrderMap = Object.freeze({
                        ...this.seenOrderMap,
                        ...Object.fromEntries(newSeenEntries),
                    });
                });
        },
/*
        loadMore() {
            if (this.isLoading) {
                return;
            }
            if (this.currentPage >= this.lastPage) {
                return;
            }

            this.fetchOrderBook(this.currentPage + 1);
        },
*/
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
 * Get power of a number
 * @param {number} value
 * @return {number}
 */
function getExponent(value) {
    return Number(value.toExponential().split('e')[1]);
}

/**
 * @param {number} groupBase
 * @return {string} - number in exponential notation
 */
function roundGroupBase(groupBase) {
    let [mantissa, exponent] = groupBase.toExponential().split('e');
    // ceil
    mantissa = Math.ceil(Number(mantissa));
    // transform unwanted steps
    if (mantissa === 4) {
        mantissa = 5;
    }
    if (mantissa > 5) {
        mantissa = 10;
    }
    return [mantissa, exponent].join('e');
}

/**
 * @param {number|string} value
 * @param {string} base - number in exponential notation
 * @return {number}
 */
function round(value, base) {
    let [mantissa, exponent] = base.split('e');
    return Math.floor(value / base) * mantissa / `1e${-1 * exponent}`;
}

/**
 *
 * @param {Array<LimitOrderSorted>} orderList
 * @param {number|string} groupBase
 * @return {{amount: number|string, price: number}[]}
 */
function groupOrdersByPrice(orderList, groupBase) {
    groupBase = Number(groupBase).toExponential();
    let amountMap = new Map();
    orderList.forEach((order) => {
        const price = round(order.coin0Price, groupBase);
        const storedAmount = amountMap.get(price) || 0;
        amountMap.set(price, storedAmount + Number(order.amount0));
    });
    return Array.from(amountMap, ([price, amount]) => {
            return {price, amount};
        })
        .slice(0, BOOK_LENGTH);
}

/**
 * @typedef {{amount1: (string|number), coin1, amount0: (string|number), coin0, id, coin0Price: (string|number), coin1Price: (string|number)}} LimitOrderSorted
 */

/**
 * @param {LimitOrder} order
 * @param {string} baseSymbol
 * @return {LimitOrderSorted}
 */
function sortOrderFields(order, baseSymbol) {
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

function wait(time) {
    return new Promise((resolve) => {
        setTimeout(resolve, time);
    });
}
</script>

<template>
    <section class="panel u-section">
<!-- v-if="!$fetchState.error && (buyOrderList.length || sellOrderList.length || isLoading)" -->
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
        <div class="panel__section panel__content order-book" v-if="sellOrderList.length || buyOrderList.length">
            <div class="order-book__item order-book__item--head">
                <div class="order-book__cell">Price ({{ pool.coin1.symbol }})</div>
                <div class="order-book__cell">Amount ({{ pool.coin0.symbol }})</div>
            </div>

            <div class="order-book__item order-book__item--sell"
                 v-for="item in sellBook" :key="`sell-${item.price}`"
                 :style="`--order-book-item-amount-bar: ${item.amount / sellBookMaxAmount * 100}%`"
            >
                <div class="order-book__cell u-text-fail">{{ item.price >= midPrice ? item.price : pretty(midPrice) }}</div>
                <div class="order-book__cell">{{ pretty(item.amount) }}</div>
            </div>

            <div class="order-book__item" :key="`mid-price-${midPrice}`">
                <div class="order-book__cell order-book__price">{{ decreasePrecisionSignificant(midPrice) }}</div>

                <div class="order-book__cell">
                    <select v-model="selectedPriceGroupIndex">
                        <option :value="index" v-for="(priceOption, index) in priceGroupOptions" :key="index">{{ priceOption }}</option>
                    </select>
                </div>
                <!--
                <div class="order-book__cell" v-if="currentPage < lastPage">
                    <button class="u-semantic-button link&#45;&#45;main link&#45;&#45;hover" @click="loadMore()">Load more</button>
                </div>
                -->
            </div>

            <div class="order-book__item order-book__item--buy"
                 v-for="item in buyBook" :key="`buy-${item.price}`"
                 :style="`--order-book-item-amount-bar: ${item.amount / buyBookMaxAmount * 100}%`"
            >
                <div class="order-book__cell u-text-success">{{ item.price > 0 ? item.price : pretty(buyOrderList[buyOrderList.length - 1].coin0Price) }}</div>
                <div class="order-book__cell">{{ pretty(item.amount) }}</div>
            </div>
        </div>
        <div class="panel__section panel__content u-text-center" v-else>
            <svg class="loader" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" v-if="isLoading">
                <circle class="loader__path" cx="14" cy="14" r="12"></circle>
            </svg>
            <template v-else>No active orders</template>
        </div>
    </section>
</template>
