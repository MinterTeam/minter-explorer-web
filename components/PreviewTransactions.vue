<script>
    import Big from 'big.js';
    import {TX_TYPE} from 'minterjs-tx/src/tx-types';
    import {getTimeDistance, pretty, shortFilter, txTypeFilter} from '~/assets/utils';

    export default {
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
                    || (tx.data.check && tx.data.check.value)
                    || this.getMultisendValue(tx);
            },
            hasAmount(tx) {
                return typeof this.getAmount(tx) !== 'undefined';
            },
            getAmountWithCoin(tx) {
                if (this.isMultisend(tx) && this.isMultisendMultipleCoin(tx)) {
                    return 'Multiple coins';
                } else {
                    return pretty(this.getAmount(tx) || 0) + ' ' + (tx.data.coin?.symbol || tx.data.symbol || this.getConvertCoinSymbol(tx) || tx.data.check?.coin?.symbol || this.getMultisendCoin(tx));
                }
            },
            isEditPool(tx) {
                return this.isTxType(tx, TX_TYPE.CREATE_SWAP_POOL) || this.isTxType(tx, TX_TYPE.ADD_LIQUIDITY) || this.isTxType(tx, TX_TYPE.REMOVE_LIQUIDITY);
            },
            getPoolCoins(tx) {
                let symbol0, symbol1;
                if (tx.data.coin0.id < tx.data.coin1.id) {
                    symbol0 = tx.data.coin0.symbol;
                    symbol1 = tx.data.coin1.symbol;
                } else {
                    symbol0 = tx.data.coin1.symbol;
                    symbol1 = tx.data.coin0.symbol;
                }

                return `${symbol0} / ${symbol1}`;
            },
            getConvertCoinSymbol(tx) {
                if (this.isSell(tx)) {
                    return tx.data.coinToSell.symbol;
                }
                if (this.isBuy(tx)) {
                    return tx.data.coinToBuy.symbol;
                }
                if (this.isSellPool(tx)) {
                    return tx.data.coins[0].symbol;
                }
                if (this.isBuyPool(tx)) {
                    return tx.data.coins[tx.data.coins.length - 1].symbol;
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
            isMultisend(tx) {
                return this.isTxType(tx, TX_TYPE.MULTISEND);
            },
            isTxType(tx, txType) {
                return tx.type === Number(txType);
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
                    return delivery.coin.id !== currentUserDeliveryList[0].coin.id;
                });
            },
            getMultisendCoin(tx) {
                if (!this.isMultisend(tx)) {
                    return;
                }
                if (!this.isMultisendMultipleCoin(tx)) {
                    return this.getMultisendDeliveryList(tx)[0].coin.symbol;
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
                    return currentUserDeliveryList.reduce((accumulator, delivery) => accumulator.plus(new Big(delivery.value)), new Big(0)).toFixed();
                }
            },
        },
    };
</script>

<template>
    <div class="panel preview">
        <div class="preview__header panel__section panel__header">
            <h2 class="panel__header-title panel__title">
                <img class="panel__header-title-icon" src="/img/icon-transaction.svg" width="40" height="40" alt="" role="presentation">
                Transactions
            </h2>
            <nuxt-link class="button button--ghost-main button--small" to="/transactions">View All</nuxt-link>
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
                            <span v-if="hasAmount(tx)">
                                {{ getAmountWithCoin(tx) }}
                            </span>
                            <span v-else-if="isEditPool(tx)">
                                {{ getPoolCoins(tx) }}
                            </span>
                        </div>
                        <div>{{ tx.timeDistance }} ago</div>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>
