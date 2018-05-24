<script>
    import {getTransaction} from "~/api";
    import {getTimeDistance, getTimeUTC} from "~/assets/utils";
    import TransactionList from '~/components/TransactionList';
    import BackButton from '~/components/BackButton';

    export default {
        components: {
            TransactionList,
            BackButton,
        },
        asyncData({ params, error }) {
            return getTransaction(params.hash)
                .then((txInfo) => {
                    return {
                        tx: {
                            ...txInfo.data,
                            timeDistance: getTimeDistance(txInfo.data.timestamp),
                            timeUTC: getTimeUTC(txInfo.data.timestamp),
                        },
                        navigation: {
                            ...txInfo.meta,
                        },
                    };
                })
                .catch((e) => {
                    error({ statusCode: 404, message: 'Transaction not found' });
                });
        },
        data() {
            return {
                navigation: {
                    prevTxHash: null,
                    nextTxHash: null,
                },
            }
        }
    }
</script>

<template>
    <div>
        <section class="panel u-section">
            <div class="panel__section panel__header">
                <h1 class="panel__header-title panel__title">
                    <BackButton/>
                    Transaction Information
                </h1>
            </div>
            <dl>
                <dt>Hash</dt>
                <dd>{{ tx.hash }}</dd>

                <dt>TimeStamp</dt>
                <dd>{{ tx.timeDistance }} ago ({{ tx.timeUTC }})</dd>

                <dt>Status</dt>
                <dd><strong :class="tx.status === 'success' ? 'tx__success' : 'tx__fail'">{{ tx.status }}</strong></dd>

                <dt>Block</dt>
                <dd><nuxt-link class="link--default" :to="'/blocks/' + tx.block">{{ tx.block }}</nuxt-link></dd>

                <dt>From</dt>
                <dd><nuxt-link class="link--default" :to="'/address/' + tx.data.from">{{ tx.data.from }}</nuxt-link></dd>

                <dt>To</dt>
                <dd><nuxt-link class="link--default" :to="'/address/' + tx.data.to">{{ tx.data.to }}</nuxt-link></dd>

                <dt>Amount</dt>
                <dd>{{ tx.data.amount }} {{ $store.state.COIN_NAME }}</dd>

                <dt>Fee</dt>
                <dd>{{ tx.fee }} {{ $store.state.COIN_NAME }}</dd>

                <dt>Nonce</dt>
                <dd>{{ tx.nonce }}</dd>
            </dl>
        </section>
        <div class="u-section navigation">
            <nuxt-link class="button button--ghost-main" :class="{'u-visually-hidden': !navigation.prevTxHash}" :to="'/transactions/' + navigation.prevTxHash">Prev Tx</nuxt-link>
            <nuxt-link class="button button--ghost-main" :class="{'u-visually-hidden': !navigation.prevTxHash}" :to="'/transactions/' + navigation.nextTxHash">Next Tx</nuxt-link>
        </div>
    </div>
</template>
