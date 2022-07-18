<script>
    import Big from '~/assets/big.js';
    import {TX_TYPE} from 'minterjs-util/src/tx-types.js';
    import {getTimeDistance, pretty, shortFilter, txTypeFilter} from '~/assets/utils';
    import PoolLink from '~/components/common/PoolLink.vue';

    export default {
        components: {
            PoolLink,
        },
        filters: {
            pretty,
            addressHash: (value) => shortFilter(value, 7),
            txHash: (value) => shortFilter(value, 13),
            txType: (value) => txTypeFilter(value).replace(/ coin$/, ''),
        },
        props: {
            /** @type Array<Transaction>*/
            txList: {
                type: [Array, null],
                required: true,
            },
        },
        computed: {
            txListFormatted() {
                return this.txList ? this.txList.map((tx) => {
                    return {
                        ...tx,
                        timeDistance: getTimeDistance(tx.timestamp),
                    };
                }) : [];
            },
        },
        methods: {
            getAmount(tx) {
                return tx.data.value
                    || this.getConvertValue(tx)
                    || tx.data.stake
                    || tx.data.initialAmount
                    || tx.data.check?.value
                    || this.getMultisendValue(tx);
            },
            hasAmount(tx) {
                return typeof this.getAmount(tx) !== 'undefined';
            },
            getAmountWithCoin(tx) {
                if (this.isMultisend(tx) && this.isMultisendMultipleCoin(tx)) {
                    return 'Multiple coins';
                } else {
                    return pretty(this.getAmount(tx) || 0) + ' ' + (getCoinSymbol(tx.data.coin) || tx.data.symbol || this.getConvertCoinSymbol(tx) || getCoinSymbol(tx.data.check?.coin) || this.getMultisendCoin(tx));
                }
            },
            isEditPool(tx) {
                return this.isTxType(tx, TX_TYPE.CREATE_SWAP_POOL) || this.isTxType(tx, TX_TYPE.ADD_LIQUIDITY) || this.isTxType(tx, TX_TYPE.REMOVE_LIQUIDITY);
            },
            getConvertCoinSymbol(tx) {
                if (this.isSell(tx)) {
                    return getCoinSymbol(tx.data.coinToSell);
                }
                if (this.isBuy(tx)) {
                    return getCoinSymbol(tx.data.coinToBuy);
                }
                if (this.isSellPool(tx)) {
                    return getCoinSymbol(tx.data.coins[0]);
                }
                if (this.isBuyPool(tx)) {
                    return getCoinSymbol(tx.data.coins[tx.data.coins.length - 1]);
                }
            },
            getSwapOppositeCoinSymbol(tx) {
                if (this.isSell(tx)) {
                    return getCoinSymbol(tx.data.coinToBuy);
                }
                if (this.isBuy(tx)) {
                    return getCoinSymbol(tx.data.coinToSell);
                }
                if (this.isSellPool(tx)) {
                    return getCoinSymbol(tx.data.coins[tx.data.coins.length - 1]);
                }
                if (this.isBuyPool(tx)) {
                    return getCoinSymbol(tx.data.coins[0]);
                }
            },
            getConvertValue(tx) {
                if (this.isSell(tx) || this.isSellPool(tx)) {
                    return tx.data.valueToSell;
                }
                if (this.isBuy(tx) || this.isBuyPool(tx)) {
                    return tx.data.valueToBuy;
                }
            },
            isSell(tx) {
                return this.isTxType(tx, TX_TYPE.SELL) || this.isTxType(tx, TX_TYPE.SELL_ALL);
            },
            isSellPool(tx) {
                return this.isTxType(tx, TX_TYPE.SELL_SWAP_POOL) || this.isTxType(tx, TX_TYPE.SELL_ALL_SWAP_POOL);
            },
            isBuy(tx) {
                return this.isTxType(tx, TX_TYPE.BUY);
            },
            isBuyPool(tx) {
                return this.isTxType(tx, TX_TYPE.BUY_SWAP_POOL);
            },
            isAddOrder(tx) {
                return this.isTxType(tx, TX_TYPE.ADD_LIMIT_ORDER);
            },
            isMultisend(tx) {
                return this.isTxType(tx, TX_TYPE.MULTISEND);
            },
            isTxType(tx, txType) {
                return Number(tx.type) === Number(txType);
            },
            getMultisendDeliveryList(tx) {
                return tx.data.list || [];
            },
            isMultisendMultipleCoin(tx) {
                if (!this.isMultisend(tx)) {
                    return;
                }
                const currentUserDeliveryList = this.getMultisendDeliveryList(tx);
                return currentUserDeliveryList.some((delivery) => {
                    return getCoinId(delivery.coin) !== getCoinId(currentUserDeliveryList[0].coin);
                });
            },
            getMultisendCoin(tx) {
                if (!this.isMultisend(tx)) {
                    return;
                }
                if (!this.isMultisendMultipleCoin(tx)) {
                    return getCoinSymbol(this.getMultisendDeliveryList(tx)[0].coin);
                }
            },
            getMultisendValue(tx) {
                if (!this.isMultisend(tx)) {
                    return;
                }
                const currentUserDeliveryList = this.getMultisendDeliveryList(tx);
                if (this.isMultisendMultipleCoin(tx)) {
                    return '...';
                } else {
                    return currentUserDeliveryList.reduce((accumulator, delivery) => accumulator.plus(new Big(delivery.value)), new Big(0)).toString();
                }
            },
        },
    };

    /**
     * Accept coin object from explorer or coin string from txParams
     * @param {Coin|string} coin
     * @return {string}
     */
    function getCoinSymbol(coin) {
        return coin?.symbol || coin;
    }
    /**
     * Accept coin object from explorer or coin string from txParams
     * @param {Coin|number|string} coin
     * @return {number|string}
     */
    function getCoinId(coin) {
        return coin?.id || coin;
    }
</script>

<template>
    <div class="panel preview">
        <div class="preview__header panel__section panel__header">
            <h2 class="panel__header-title panel__title">
                <img class="panel__header-title-icon" src="/img/icon-transaction.svg" width="40" height="40" alt="" role="presentation">
                Transactions
            </h2>
            <nuxt-link class="button button--ghost-main button--small" to="/transactions">View all</nuxt-link>
        </div>
        <transition name="v-transition-fade">
            <div class="preview__content" v-if="txListFormatted.length">
                <!-- fixed duplicated txn key, can be removed later-->
                <div class="preview__transaction panel__section" v-for="tx in txListFormatted" :key="tx.txn + tx.hash">
                    <div class="preview__transaction-row u-text-overflow">
                        TX <nuxt-link class="link--main link--hover" :to="'/transactions/' + tx.hash">{{ tx.hash | txHash }}</nuxt-link>
                    </div>
                    <div class="preview__transaction-row u-grid">
                        <div class="u-cell u-cell--large--1-2">
                            From <nuxt-link class="link--main link--hover" :to="'/address/' + tx.from">{{ tx.from | addressHash }}</nuxt-link>
                        </div>
                        <div class="u-cell u-cell--large--1-2" v-if="tx.data.to">
                            To <nuxt-link class="link--main link--hover" :to="'/address/' + tx.data.to">{{ tx.data.to | addressHash }}</nuxt-link>
                        </div>
                    </div>
                    <div class="preview__transaction-row preview__transaction-meta">
                        <div>
                            {{ tx.type | txType }}
                            <template v-if="hasAmount(tx)">
                                {{ getAmountWithCoin(tx) }}
                            </template>
                            <template v-if="getSwapOppositeCoinSymbol(tx)">
                                for {{ getSwapOppositeCoinSymbol(tx) }}
                            </template>
                            <PoolLink class="u-fw-400" v-else-if="isEditPool(tx)" :pool="tx.data"/>
                            <PoolLink class="u-fw-400" v-else-if="isAddOrder(tx)" :pool="{coin0: tx.data.coinToSell, coin1: tx.data.coinToBuy}"/>
                        </div>
                        <div>{{ tx.timeDistance }} ago</div>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>
