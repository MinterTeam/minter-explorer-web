<script>
    import debounce from 'lodash-es/debounce';
    import * as TX_TYPES from 'minterjs-tx/src/tx-types';
    import {isValidTransaction} from 'minterjs-util/src/prefix';
    import {getTransaction} from "~/api";
    import {getTimeDistance, getTimeUTC, prettyExact, prettyRound, txTypeFilter, fromBase64} from "~/assets/utils";
    import getTitle from '~/assets/get-title';
    import {getErrorText} from '~/assets/server-error';
    import {UNBOND_PERIOD} from "~/assets/variables";
    import BackButton from '~/components/BackButton';
    import TableLink from '~/components/TableLink';

    let fetchTxTimer;
    let fetchTxDestroy;
    let resizeHandler;

    export default {
        UNBOND_PERIOD,
        components: {
            BackButton,
            TableLink,
        },
        filters: {
            prettyExact,
            prettyRound,
            txType: txTypeFilter,
        },
        asyncData({ params, error }) {
            if (!isValidTransaction(params.hash)) {
                return error({
                    statusCode: 404,
                    message: 'Invalid transaction hash',
                });
            }
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
                    console.log({e});
                    if (e.response && e.response.status === 404) {
                        // do nothing, wait for tx to appear in the blockchain
                    } else {
                        error({
                            statusCode: e.request && e.request.status,
                            message: getErrorText(e),
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
                shouldShortenAddress: this.getShouldShortenAddress(),
            };
        },
        mounted() {
            if (!this.tx) {
                this.fetchTx();
            }
            if (process.client) {
                resizeHandler = debounce(() => {
                    this.shouldShortenAddress = this.getShouldShortenAddress();
                });
                window.addEventListener('resize', resizeHandler, 100);
            }
        },
        destroyed() {
            if (fetchTxTimer) {
                clearTimeout(fetchTxTimer);
            }
            if (resizeHandler) {
                window.removeEventListener('resize', resizeHandler);
            }
            fetchTxDestroy = true;
        },
        methods: {
            fromBase64,
            fetchTx() {
                getTransaction(this.$route.params.hash)
                    .then((tx) => {
                        this.tx = {
                            ...tx,
                            timeDistance: getTimeDistance(tx.timestamp),
                            timeUTC: getTimeUTC(tx.timestamp),
                        };
                        fetchTxTimer = null;
                    })
                    .catch((e) => {
                        if (fetchTxDestroy) {
                            return;
                        }
                        fetchTxTimer = setTimeout(() => {
                            this.fetchTx();
                        }, 2500);
                    });
            },
            isDefined(value) {
                return typeof value !== 'undefined';
            },
            isSell(tx) {
                return tx.type === Number(TX_TYPES.TX_TYPE_SELL) || tx.type === Number(TX_TYPES.TX_TYPE_SELL_ALL);
            },
            isBuy(tx) {
                return tx.type === Number(TX_TYPES.TX_TYPE_BUY);
            },
            isUnbond(tx) {
                return tx.type === Number(TX_TYPES.TX_TYPE_UNBOND);
            },
            getShouldShortenAddress() {
                return process.client && window.innerWidth < 700;
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

                <dt>Timestamp</dt>
                <dd>{{ tx.timeDistance }} ago ({{ tx.timeUTC }})</dd>

                <dt>Status</dt>
                <dd><strong :class="tx.status === 'success' ? 'tx__success' : 'tx__fail'">{{ tx.status }}</strong></dd>

                <dt>Block</dt>
                <dd><nuxt-link class="link--default" :to="'/blocks/' + tx.block">{{ tx.block | prettyRound }}</nuxt-link></dd>

                <dt>Type</dt>
                <dd>{{ tx.type | txType }}</dd>

                <dt>From</dt>
                <dd><nuxt-link class="link--default" :to="'/address/' + tx.from">{{ tx.from }}</nuxt-link></dd>

                <!-- SEND -->
                <dt v-if="tx.data.to">To</dt>
                <dd v-if="tx.data.to"><nuxt-link class="link--default" :to="'/address/' + tx.data.to">{{ tx.data.to }}</nuxt-link></dd>
                <dt v-if="isDefined(tx.data.value)">Amount</dt>
                <dd v-if="isDefined(tx.data.value)">{{ tx.data.coin }} {{ tx.data.value | prettyExact }}</dd>

                <!-- SELL -->
                <dt v-if="isSell(tx)">Sell coins</dt>
                <dd v-if="isSell(tx)">{{ tx.data.coin_to_sell }} {{ tx.data.value_to_sell | prettyExact }}</dd>
                <dt v-if="isSell(tx)">Get coins</dt>
                <dd v-if="isSell(tx)">{{ tx.data.coin_to_buy }} {{ tx.data.value_to_buy | prettyExact }}</dd>
                <!-- BUY -->
                <dt v-if="isBuy(tx)">Buy coins</dt>
                <dd v-if="isBuy(tx)">{{ tx.data.coin_to_buy }}{{ tx.data.value_to_buy | prettyExact }}</dd>
                <dt v-if="isBuy(tx)">Spend coins</dt>
                <dd v-if="isBuy(tx)">{{ tx.data.coin_to_sell }} {{ tx.data.value_to_sell | prettyExact }}</dd>

                <!-- CREATE_COIN-->
                <dt v-if="tx.data.name">Name</dt>
                <dd v-if="tx.data.name">{{ tx.data.name }}</dd>
                <dt v-if="tx.data.symbol">Symbol</dt>
                <dd v-if="tx.data.symbol">{{ tx.data.symbol }}</dd>
                <dt v-if="tx.data.initial_amount">Initial Amount</dt>
                <dd v-if="tx.data.initial_amount">{{ tx.data.symbol }} {{ tx.data.initial_amount | prettyExact }}</dd>
                <dt v-if="tx.data.initial_reserve">Initial Reserve</dt>
                <dd v-if="tx.data.initial_reserve">{{ $store.state.COIN_NAME }} {{ tx.data.initial_reserve | prettyExact }}</dd>
                <dt v-if="tx.data.constant_reserve_ratio">CRR</dt>
                <dd v-if="tx.data.constant_reserve_ratio">{{ tx.data.constant_reserve_ratio }}&thinsp;%</dd>

                <!-- DELEGATE, UNBOND, DECLARE_CANDIDACY, SET_CANDIDATE_ONLINE, SET_CANDIDATE_OFFLINE -->
                <dt v-if="tx.data.pub_key">Public Key</dt>
                <dd v-if="tx.data.pub_key"><nuxt-link class="link--default" :to="'/validator/' + tx.data.pub_key">{{ tx.data.pub_key }}</nuxt-link></dd>
                <dt v-if="isDefined(tx.data.stake)">Stake</dt>
                <dd v-if="isDefined(tx.data.stake)">{{ tx.data.coin }} {{ tx.data.stake | prettyExact }}</dd>
                <dt v-if="isDefined(tx.data.commission)">Commission</dt>
                <dd v-if="isDefined(tx.data.commission)">{{ tx.data.commission }}&thinsp;%</dd>
                <dt v-if="isUnbond(tx)">Unbond Block</dt>
                <dd v-if="isUnbond(tx)">{{ tx.block + $options.UNBOND_PERIOD }}</dd>
                <dt v-if="tx.data.reward_address">Reward Address</dt>
                <dd v-if="tx.data.reward_address"><nuxt-link class="link--default" :to="'/address/' + tx.data.reward_address">{{ tx.data.reward_address }}</nuxt-link></dd>
                <dt v-if="tx.data.owner_address">Owner Address</dt>
                <dd v-if="tx.data.owner_address"><nuxt-link class="link--default" :to="'/address/' + tx.data.owner_address">{{ tx.data.owner_address }}</nuxt-link></dd>

                <!-- REDEEM_CHECK -->
                <dt v-if="tx.data.check && tx.data.check.sender">Check Issuer</dt>
                <dd v-if="tx.data.check && tx.data.check.sender"><nuxt-link class="link--default" :to="'/address/' + tx.data.check.sender">{{ tx.data.check.sender }}</nuxt-link></dd>
                <dt v-if="tx.data.check && tx.data.check.nonce">Check Nonce</dt>
                <dd v-if="tx.data.check && tx.data.check.nonce">{{ fromBase64(tx.data.check.nonce) }}</dd>
                <dt v-if="tx.data.check && tx.data.check.due_block">Due Block</dt>
                <dd v-if="tx.data.check && tx.data.check.due_block">{{ tx.data.check.due_block }}</dd>
                <dt v-if="tx.data.check && tx.data.check.value">Amount</dt>
                <dd v-if="tx.data.check && tx.data.check.value">{{ tx.data.check.coin }} {{ tx.data.check.value | prettyExact }}</dd>

                <!-- MULTISEND -->
                <table class="table--recipient-list" v-if="tx.data.list && tx.data.list.length">
                    <thead>
                    <tr>
                        <th>To</th>
                        <th>Value</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="(transfer, index) in tx.data.list" :key="index">
                        <td>
                            <TableLink
                                :link-text="transfer.to"
                                :link-path="'/address/' + transfer.to"
                                :should-not-shorten="!shouldShortenAddress"
                            />
                        </td>
                        <td>{{ transfer.coin }} {{ transfer.value | prettyExact }}</td>
                    </tr>
                    </tbody>
                </table>

                <dt v-if="tx.fee">Fee</dt>
                <dd v-if="tx.fee">{{ $store.state.COIN_NAME }} {{ tx.fee | prettyExact }}</dd>

                <dt v-if="tx.nonce">Nonce</dt>
                <dd v-if="tx.nonce">{{ tx.nonce }}</dd>

                <dt>Message</dt>
                <dd class="u-text-pre-line" :class="{'u-text-muted': !tx.payload }">{{ tx.payload ? fromBase64(tx.payload) : 'Blank' }}</dd>
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
