<script>
    import {getTransaction} from "~/api";
    import {getTimeDistance, getTimeUTC, stripZeros, txTypeFilter} from "~/assets/utils";
    import getTitle from '~/assets/get-title';
    import BackButton from '~/components/BackButton';

    export default {
        components: {
            BackButton,
        },
        filters: {
            money: stripZeros,
            txType: txTypeFilter,
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
        },
        methods: {
            isDefined(value) {
                return typeof value !== 'undefined';
            },
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
                <dd class="u-select-all">{{ tx.hash }}</dd>

                <dt>TimeStamp</dt>
                <dd>{{ tx.timeDistance }} ago ({{ tx.timeUTC }})</dd>

                <dt>Status</dt>
                <dd><strong :class="tx.status === 'success' ? 'tx__success' : 'tx__fail'">{{ tx.status }}</strong></dd>

                <dt>Block</dt>
                <dd><nuxt-link class="link--default" :to="'/blocks/' + tx.block">{{ tx.block }}</nuxt-link></dd>

                <dt>Type</dt>
                <dd>{{ tx.type | txType }}</dd>

                <dt>From</dt>
                <dd><nuxt-link class="link--default" :to="'/address/' + tx.data.from">{{ tx.data.from }}</nuxt-link></dd>

                <!-- SEND -->
                <dt v-if="tx.data.to">To</dt>
                <dd v-if="tx.data.to"><nuxt-link class="link--default" :to="'/address/' + tx.data.to">{{ tx.data.to }}</nuxt-link></dd>
                <dt v-if="isDefined(tx.data.amount)">Amount</dt>
                <dd v-if="isDefined(tx.data.amount)">{{ tx.data.amount | money }} {{ tx.data.coin }}</dd>

                <!-- CONVERT -->
                <dt v-if="tx.data.from_coin_symbol">From Coin</dt>
                <dd v-if="tx.data.from_coin_symbol">{{ tx.data.from_coin_symbol }}</dd>
                <dt v-if="tx.data.to_coin_symbol">To Coin</dt>
                <dd v-if="tx.data.to_coin_symbol">{{ tx.data.to_coin_symbol }}</dd>
                <dt v-if="isDefined(tx.data.value)">Value</dt>
                <dd v-if="isDefined(tx.data.value)">{{ tx.data.value | money }} {{ tx.data.coin }}</dd>

                <!-- CREATE_COIN-->
                <dt v-if="tx.data.name">Name</dt>
                <dd v-if="tx.data.name">{{ tx.data.name }}</dd>
                <dt v-if="tx.data.symbol">Symbol</dt>
                <dd v-if="tx.data.symbol">{{ tx.data.symbol }}</dd>
                <dt v-if="tx.data.initial_amount">Initial Amount</dt>
                <dd v-if="tx.data.initial_amount">{{ tx.data.initial_amount | money }} {{ tx.data.symbol }}</dd>
                <dt v-if="tx.data.initial_reserve">Initial Reserve</dt>
                <dd v-if="tx.data.initial_reserve">{{ tx.data.initial_reserve | money }} {{ $store.state.COIN_NAME }}</dd>
                <dt v-if="tx.data.constant_reserve_ratio">CRR</dt>
                <dd v-if="tx.data.constant_reserve_ratio">{{ tx.data.constant_reserve_ratio }} %</dd>

                <!-- DELEGATE, UNBOUND, DECLARE_CANDIDACY, SET_CANDIDATE_ONLINE, SET_CANDIDATE_OFFLINE -->
                <dt v-if="tx.data.pub_key">Public Key</dt>
                <dd v-if="tx.data.pub_key" class="u-select-all">{{ tx.data.pub_key }}</dd>
                <dt v-if="isDefined(tx.data.stake)">Stake</dt>
                <dd v-if="isDefined(tx.data.stake)">{{ tx.data.stake | money }} {{ tx.data.coin }}</dd>
                <dt v-if="isDefined(tx.data.commission)">Commission</dt>
                <dd v-if="isDefined(tx.data.commission)">{{ tx.data.commission }} %</dd>

                <!-- REDEEM_CHECK -->
                <dt v-if="tx.data.raw_check">Check</dt>
                <dd v-if="tx.data.raw_check" class="u-select-all">{{ tx.data.raw_check }}</dd>
                <dt v-if="tx.data.proof">Proof</dt>
                <dd v-if="tx.data.proof" class="u-select-all">{{ tx.data.proof }}</dd>

                <dt>Fee</dt>
                <dd>{{ tx.fee | money }} {{ $store.state.COIN_NAME }}</dd>

                <dt>Nonce</dt>
                <dd>{{ tx.nonce }}</dd>

                <dt>Message</dt>
                <dd :class="{'u-text-muted': !tx.payload }">{{ tx.payload ? tx.payload : 'Blank' }}</dd>
            </dl>
        </section>
        <!--
        // no navigation data from explorer
        <div class="u-section navigation">
            <nuxt-link class="button button&#45;&#45;ghost-main" :class="{'u-visually-hidden': !navigation.prevTxHash}" :to="'/transactions/' + navigation.prevTxHash">Prev Tx</nuxt-link>
            <nuxt-link class="button button&#45;&#45;ghost-main" :class="{'u-visually-hidden': !navigation.prevTxHash}" :to="'/transactions/' + navigation.nextTxHash">Next Tx</nuxt-link>
        </div>
        -->
    </div>
</template>
