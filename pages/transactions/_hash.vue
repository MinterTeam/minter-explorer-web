<script>
    import {getTransaction} from "~/api";
    import {getTimeDistance, getTimeUTC, prettyExact, txTypeFilter} from "~/assets/utils";
    import getTitle from '~/assets/get-title';
    import {TX_TYPES} from "~/assets/variables";
    import BackButton from '~/components/BackButton';

    export default {
        components: {
            BackButton,
        },
        filters: {
            prettyExact,
            txType: txTypeFilter,
        },
        asyncData({ params, error }) {
            return getTransaction(params.hash)
                .then((tx) => {
                    return {
                        tx: {
                            ...tx,
                            timeDistance: getTimeDistance(tx.timestamp),
                            timeUTC: getTimeUTC(tx.timestamp),
                        },
                    };
                })
                .catch((e) => {
                    if (e.response && e.response.status === 404) {
                        // do nothing, wait for tx to appear in the blockchain
                    } else {
                        error({
                            statusCode: e.response && e.response.status || e.request.status,
                            message: e.response && (e.response.data.error || e.response.statusText) || e.request.statusText,
                        });
                    }

                });
        },
        head() {
            const title = getTitle('Transaction');

            return {
                title: title,
                meta: [
                    { hid: 'og-title', name: 'og:title', content: title },
                ],
            };
        },
        data() {
            return {
                /** @type Transaction|null */
                tx: null,
            };
        },
        mounted() {
            if (!this.tx) {
                this.fetchTx();
            }
        },
        methods: {
            fetchTx() {
                getTransaction(this.$route.params.hash)
                    .then((tx) => {
                        this.tx = {
                            ...tx,
                            timeDistance: getTimeDistance(tx.timestamp),
                            timeUTC: getTimeUTC(tx.timestamp),
                        };
                    })
                    .catch((e) => {
                        setTimeout(() => {
                            this.fetchTx();
                        }, 2500);
                    });
            },
            isDefined(value) {
                return typeof value !== 'undefined';
            },
            isSell(tx) {
                return tx.type === TX_TYPES.SELL_COIN || tx.type === TX_TYPES.SELL_ALL_COIN;
            },
            isBuy(tx) {
                return tx.type === TX_TYPES.BUY_COIN;
            },
        },
    };
</script>

<template>
    <div>
        <section class="panel u-section" v-if="tx">
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
                <dd><nuxt-link class="link--default" :to="'/address/' + tx.from">{{ tx.from }}</nuxt-link></dd>

                <!-- SEND -->
                <dt v-if="tx.data.to">To</dt>
                <dd v-if="tx.data.to"><nuxt-link class="link--default" :to="'/address/' + tx.data.to">{{ tx.data.to }}</nuxt-link></dd>
                <dt v-if="isDefined(tx.data.amount)">Amount</dt>
                <dd v-if="isDefined(tx.data.amount)">{{ tx.data.amount | prettyExact }} {{ tx.data.coin }}</dd>

                <!-- SELL -->
                <dt v-if="isSell(tx)">Sell coins</dt>
                <dd v-if="isSell(tx)">{{ tx.data.value_to_sell | prettyExact }} {{ tx.data.coin_to_sell }}</dd>
                <dt v-if="isSell(tx)">Get coins</dt>
                <dd v-if="isSell(tx)">{{ tx.data.value_to_buy | prettyExact }} {{ tx.data.coin_to_buy }}</dd>
                <!-- BUY -->
                <dt v-if="isBuy(tx)">Buy coins</dt>
                <dd v-if="isBuy(tx)">{{ tx.data.value_to_buy | prettyExact }} {{ tx.data.coin_to_buy }}</dd>
                <dt v-if="isBuy(tx)">Spend coins</dt>
                <dd v-if="isBuy(tx)">{{ tx.data.value_to_sell | prettyExact }} {{ tx.data.coin_to_sell }}</dd>

                <!-- CREATE_COIN-->
                <dt v-if="tx.data.name">Name</dt>
                <dd v-if="tx.data.name">{{ tx.data.name }}</dd>
                <dt v-if="tx.data.symbol">Symbol</dt>
                <dd v-if="tx.data.symbol">{{ tx.data.symbol }}</dd>
                <dt v-if="tx.data.initial_amount">Initial Amount</dt>
                <dd v-if="tx.data.initial_amount">{{ tx.data.initial_amount | prettyExact }} {{ tx.data.symbol }}</dd>
                <dt v-if="tx.data.initial_reserve">Initial Reserve</dt>
                <dd v-if="tx.data.initial_reserve">{{ tx.data.initial_reserve | prettyExact }} {{ $store.state.COIN_NAME }}</dd>
                <dt v-if="tx.data.constant_reserve_ratio">CRR</dt>
                <dd v-if="tx.data.constant_reserve_ratio">{{ tx.data.constant_reserve_ratio }}&thinsp;%</dd>

                <!-- DELEGATE, UNBOND, DECLARE_CANDIDACY, SET_CANDIDATE_ONLINE, SET_CANDIDATE_OFFLINE -->
                <dt v-if="tx.data.pub_key">Public Key</dt>
                <dd v-if="tx.data.pub_key"><nuxt-link class="link--default" :to="'/validator/' + tx.data.pub_key">{{ tx.data.pub_key }}</nuxt-link></dd>
                <dt v-if="isDefined(tx.data.stake)">Stake</dt>
                <dd v-if="isDefined(tx.data.stake)">{{ tx.data.stake | prettyExact }} {{ tx.data.coin }}</dd>
                <dt v-if="isDefined(tx.data.commission)">Commission</dt>
                <dd v-if="isDefined(tx.data.commission)">{{ tx.data.commission }}&thinsp;%</dd>

                <!-- REDEEM_CHECK -->
                <dt v-if="tx.data.raw_check">Check</dt>
                <dd v-if="tx.data.raw_check" class="u-select-all">{{ tx.data.raw_check }}</dd>
                <dt v-if="tx.data.proof">Proof</dt>
                <dd v-if="tx.data.proof" class="u-select-all">{{ tx.data.proof }}</dd>

                <dt>Fee</dt>
                <dd>{{ tx.fee | prettyExact }} {{ $store.state.COIN_NAME }}</dd>

                <dt>Nonce</dt>
                <dd>{{ tx.nonce }}</dd>

                <dt>Message</dt>
                <dd :class="{'u-text-muted': !tx.payload }">{{ tx.payload ? tx.payload : 'Blank' }}</dd>
            </dl>
        </section>
        <h1 class="u-text-center" style="margin-top: 50px;" v-else>
            Transaction not found yet <br>
            <svg class="loader" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28"  style="margin-top: 20px;">
                <circle class="loader__path" cx="14" cy="14" r="12"></circle>
            </svg>
        </h1>
    </div>
</template>
