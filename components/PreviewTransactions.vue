<script>
    import * as TX_TYPES from 'minterjs-tx/src/tx-types';
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
                    || tx.data.initial_amount
                    || (tx.data.check && tx.data.check.value);
            },
            hasAmount(tx) {
                return typeof this.getAmount(tx) !== 'undefined';
            },
            getConvertCoinSymbol(tx) {
                if (tx.type === Number(TX_TYPES.TX_TYPE_SELL) || tx.type === Number(TX_TYPES.TX_TYPE_SELL_ALL)) {
                    return tx.data.coin_to_sell;
                }
                if (tx.type === Number(TX_TYPES.TX_TYPE_BUY)) {
                    return tx.data.coin_to_buy;
                }
            },
            getConvertValue(tx) {
                if (tx.type === Number(TX_TYPES.TX_TYPE_SELL) || tx.type === Number(TX_TYPES.TX_TYPE_SELL_ALL)) {
                    return tx.data.value_to_sell;
                }
                if (tx.type === Number(TX_TYPES.TX_TYPE_BUY)) {
                    return tx.data.value_to_buy;
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
                        TX# <nuxt-link class="link--main link--hover" :to="'/transactions/' + tx.hash">{{ tx.hash | txHash }}</nuxt-link>
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
                                {{ getAmount(tx) || 0 | pretty }}
                                {{ tx.data.coin || tx.data.symbol || getConvertCoinSymbol(tx) || (tx.data.check && tx.data.check.coin) }}
                            </span>
                        </div>
                        <div>{{ tx.timeDistance }} ago</div>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>
