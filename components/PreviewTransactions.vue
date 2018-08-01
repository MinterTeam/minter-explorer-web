<script>
    import {getTimeDistance, prettyRound, shortFilter} from '~/assets/utils';

    export default {
        filters: {
            prettyRound,
            addressHash: (value) => shortFilter(value, 7),
            txHash: (value) => shortFilter(value, 13),
        },
        props: {
            /** @type Array<Transaction>*/
            txList: {
                type: Array|null,
                required: true,
            },
        },
        computed: {
            txListFormatted() {
                return this.txList ? this.txList.slice(0, 20).map((tx) => {
                    return {
                        ...tx,
                        timeDistance: getTimeDistance(tx.timestamp),
                    }
                }) : [];
            },
        },
        methods: {
            hasAmount(tx) {
                return typeof tx.data.amount !== 'undefined';
            }
        }

    }
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
                <div class="preview__transaction panel__section" v-for="tx in txListFormatted" :key="tx.txn">
                    <div class="preview__transaction-row u-text-overflow">
                        TX# <nuxt-link class="link--main link--hover" :to="'/transactions/' + tx.hash">{{ tx.hash | txHash }}</nuxt-link>
                    </div>
                    <div class="preview__transaction-row u-grid" v-if="tx.data.from || tx.data.to">
                        <div class="u-cell u-cell--large--1-2" v-if="tx.data.from">
                            From <nuxt-link class="link--main link--hover" :to="'/address/' + tx.data.from">{{ tx.data.from | addressHash }}</nuxt-link>
                        </div>
                        <div class="u-cell u-cell--large--1-2" v-if="tx.data.to">
                            To <nuxt-link class="link--main link--hover" :to="'/address/' + tx.data.to">{{ tx.data.to | addressHash }}</nuxt-link>
                        </div>
                    </div>
                    <div class="preview__transaction-row preview__transaction-meta">
                        <div>
                            <span v-if="hasAmount(tx)">
                                Amount {{ tx.data.amount | prettyRound }} {{ tx.data.coin }}
                            </span>
                        </div>
                        <div>{{ tx.timeDistance }} ago</div>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>
