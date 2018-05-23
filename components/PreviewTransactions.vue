<script>
    import {getTimeDistance} from '~/assets/utils';

    export default {
        props: {
            /** @type Array<Transaction>*/
            txList: {
                type: Array,
                required: true,
            },
        },
        computed: {
            txListFormatted() {
                return this.txList.map((tx) => {
                    return {
                        ...tx,
                        timeDistance: getTimeDistance(tx.timestamp),
                    }
                })
            }
        }
    }
</script>

<template>
    <div class="panel">
        <div class="preview__header panel__section panel__header">
            <h2 class="panel__header-title panel__title">
                <img class="panel__header-title-icon" src="/img/icon-transaction.svg" alt="" role="presentation">
                Transactions
            </h2>
            <nuxt-link class="button button--ghost-main button--small" to="/transactions">View All</nuxt-link>
        </div>
        <div class="preview__content">
            <div class="preview__transaction panel__section" v-for="tx in txListFormatted" :key="tx.hash">
                <div class="preview__transaction-row u-text-overflow">
                    TX# <nuxt-link class="link--main link--hover" :to="'/transactions/' + tx.hash">{{ tx.hash }}</nuxt-link>
                </div>
                <div class="preview__transaction-row u-grid">
                    <div class="u-cell u-cell--small--1-2 u-text-overflow">
                        From <nuxt-link class="link--main link--hover" :to="'/address/' + tx.data.from">{{ tx.data.from }}</nuxt-link>
                    </div>
                    <div class="u-cell u-cell--small--1-2 u-text-overflow">
                        To <nuxt-link class="link--main link--hover" :to="'/address/' + tx.data.to">{{ tx.data.to }}</nuxt-link>
                    </div>
                </div>
                <div class="preview__transaction-row preview__transaction-meta">
                    <div>Amount {{ tx.data.amount }} BIP</div>
                    <div>> {{ tx.timeDistance }} ago</div>
                </div>
            </div>
        </div>
    </div>
</template>
