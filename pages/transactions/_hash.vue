<script>
    import {getTransaction} from "~/api";
    import {getTimeDistance, getTimeUTC, roundMoney} from "~/assets/utils";
    import getTitle from '~/assets/get-title';
    import BackButton from '~/components/BackButton';

    export default {
        components: {
            BackButton,
        },
        filters: {
            money: (value) => roundMoney(value),
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
        head() {
            const title = getTitle('Transaction');

            return {
                title: title,
                meta: [
                    { hid: 'og-title', name: 'og:title', content: title },
                ],
            }
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

                <dt v-if="tx.data.from">From</dt>
                <dd v-if="tx.data.from"><nuxt-link class="link--default" :to="'/address/' + tx.data.from">{{ tx.data.from }}</nuxt-link></dd>

                <dt v-if="tx.data.to">To</dt>
                <dd v-if="tx.data.to"><nuxt-link class="link--default" :to="'/address/' + tx.data.to">{{ tx.data.to }}</nuxt-link></dd>

                <dt v-if="tx.data.amount">Amount</dt>
                <dd v-if="tx.data.amount">{{ tx.data.amount | money }} {{ tx.data.coin }}</dd>

                <dt>Fee</dt>
                <dd>{{ tx.fee | money }} {{ $store.state.COIN_NAME }}</dd>

                <dt>Nonce</dt>
                <dd>{{ tx.nonce }}</dd>

                <dt>Message</dt>
                <dd :class="{'u-text-muted': !tx.payload }">{{ tx.payload ? tx.payload : 'Blank' }}</dd>
            </dl>
        </section>
        <div class="u-section navigation">
            <nuxt-link class="button button--ghost-main" :class="{'u-visually-hidden': !navigation.prevTxHash}" :to="'/transactions/' + navigation.prevTxHash">Prev Tx</nuxt-link>
            <nuxt-link class="button button--ghost-main" :class="{'u-visually-hidden': !navigation.prevTxHash}" :to="'/transactions/' + navigation.nextTxHash">Next Tx</nuxt-link>
        </div>
    </div>
</template>
