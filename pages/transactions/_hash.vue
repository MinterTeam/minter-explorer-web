<script>
    import debounce from 'lodash-es/debounce';
    import Big from 'big.js';
    import {TX_TYPE} from 'minterjs-tx/src/tx-types';
    import {isValidTransaction} from 'minterjs-util/src/prefix';
    import {getTransaction, getBlock, getBlockList} from "~/api";
    import {getTimeDistance, getTime, getTimeMinutes, prettyExact, prettyRound, txTypeFilter, fromBase64} from "~/assets/utils";
    import getTitle from '~/assets/get-title';
    import {getErrorText} from '~/assets/server-error';
    import {UNBOND_PERIOD, TX_STATUS} from "~/assets/variables";
    import BackButton from '~/components/BackButton';
    import TableLink from '~/components/TableLink';

    let fetchTxTimer;
    let fetchTxDestroy;
    let resizeHandler;

    export default {
        UNBOND_PERIOD,
        TX_STATUS,
        components: {
            BackButton,
            TableLink,
        },
        filters: {
            prettyExact,
            prettyRound,
            txType: txTypeFilter,
            timeDistance: getTimeDistance,
            timeDistanceFuture: (value) => getTimeDistance(value, true),
            time: getTime,
            timeMinutes: getTimeMinutes,
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
                        tx,
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
                unbondOrLastBlock: null,
            };
        },
        computed: {
            unbondBlockHeight() {
                if (!this.tx || !this.isUnbond(this.tx)) {
                    return;
                }
                return this.tx.block + UNBOND_PERIOD;
            },
            isUnbondBlock() {
                return this.unbondOrLastBlock && this.unbondOrLastBlock.height === this.unbondBlockHeight;
            },
            unbondTime() {
                if (!this.unbondOrLastBlock) {
                    return;
                }
                // unbondOrLastBlock is unbond block
                if (this.isUnbondBlock) {
                    return this.unbondOrLastBlock.timestamp;
                }
                // unbondOrLastBlock is last block => calculate difference
                if (this.unbondOrLastBlock.height < this.unbondBlockHeight) {
                    return (this.unbondBlockHeight - this.unbondOrLastBlock.height) * 5000 + Date.now();
                }
                return undefined;
            },
            validator() {
                const tx = this.tx;
                if (!tx.data.pubKey) {
                    return {};
                }
                const validator = this.$store.state.validatorList.find((validatorItem) => validatorItem.publicKey === tx.data.pubKey);
                return validator || {};
            },
        },
        mounted() {
            if (!this.tx) {
                this.fetchTx();
            } else {
                this.fetchUnbondBlock();
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
                        this.tx = tx;
                        fetchTxTimer = null;
                        this.fetchUnbondBlock();
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
            fetchUnbondBlock() {
                if (this.isUnbond(this.tx)) {
                    getBlock(this.unbondBlockHeight)
                        .then((block) => this.unbondOrLastBlock = block)
                        .catch((e) => {
                            if (e.request.status === 404) {
                                return getBlockList();
                            } else {
                                throw e;
                            }
                        })
                        .then((blockList) => {
                            if (blockList && blockList.data) {
                                this.unbondOrLastBlock = blockList.data[0];
                            }
                        })
                        .catch((e) => {
                            console.log('Unable to get block', e);
                        });
                }
            },
            isDefined(value) {
                return typeof value !== 'undefined';
            },
            isSell(tx) {
                return tx.type === Number(TX_TYPE.SELL) || tx.type === Number(TX_TYPE.SELL_ALL);
            },
            isBuy(tx) {
                return tx.type === Number(TX_TYPE.BUY);
            },
            isUnbond(tx) {
                return tx.type === Number(TX_TYPE.UNBOND);
            },
            isStake(tx) {
                return tx.type === Number(TX_TYPE.UNBOND) || tx.type === Number(TX_TYPE.DELEGATE) || tx.type === Number(TX_TYPE.DECLARE_CANDIDACY);
            },
            isMultisend(tx) {
                return tx.type === Number(TX_TYPE.MULTISEND);
            },
            getShouldShortenAddress() {
                return process.client && window.innerWidth < 700;
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
                    const firstItem = this.getMultisendDeliveryList(tx)[0];
                    return firstItem && firstItem.coin.symbol;
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
    <div>
        <section class="panel u-section" v-if="tx">
            <div class="panel__section panel__header">
                <h1 class="panel__header-title panel__title">
                    <BackButton/>
                    Transaction information
                </h1>
            </div>
            <dl>
                <dt>Hash</dt>
                <dd class="u-select-all">{{ tx.hash }}</dd>

                <dt>Timestamp</dt>
                <dd>{{ tx.timestamp | timeDistance }} ago ({{ tx.timestamp | time }})</dd>

                <dt>Status</dt>
                <dd><strong :class="tx.status === $options.TX_STATUS.SUCCESS ? 'tx__success' : 'tx__fail'">{{ tx.status }}</strong></dd>

                <dt>Block</dt>
                <dd><nuxt-link class="link--default" :to="'/blocks/' + tx.height">{{ tx.height | prettyRound }}</nuxt-link></dd>

                <dt>Type</dt>
                <dd>{{ tx.type | txType }}</dd>

                <dt>From</dt>
                <dd><nuxt-link class="link--default" :to="'/address/' + tx.from">{{ tx.from }}</nuxt-link></dd>

                <template v-if="tx.status !== $options.TX_STATUS.FAILURE">



                <!-- SEND -->
                <dt v-if="tx.data.to">To</dt>
                <dd v-if="tx.data.to"><nuxt-link class="link--default" :to="'/address/' + tx.data.to">{{ tx.data.to }}</nuxt-link></dd>
                <dt v-if="isDefined(tx.data.value) && !isStake(tx)">Amount</dt>
                <dd v-if="isDefined(tx.data.value) && !isStake(tx)">{{ tx.data.coin.symbol }} {{ tx.data.value | prettyExact }}</dd>

                <!-- SELL -->
                <dt v-if="isSell(tx)">Sell coins</dt>
                <dd v-if="isSell(tx)">{{ tx.data.coinToSell.symbol }} {{ tx.data.valueToSell | prettyExact }}</dd>
                <dt v-if="isSell(tx)">Get coins</dt>
                <dd v-if="isSell(tx)">{{ tx.data.coinToBuy.symbol }} {{ tx.data.valueToBuy | prettyExact }}</dd>
                <!-- BUY -->
                <dt v-if="isBuy(tx)">Buy coins</dt>
                <dd v-if="isBuy(tx)">{{ tx.data.coinToBuy.symbol }} {{ tx.data.valueToBuy | prettyExact }}</dd>
                <dt v-if="isBuy(tx)">Spend coins</dt>
                <dd v-if="isBuy(tx)">{{ tx.data.coinToSell.symbol }} {{ tx.data.valueToSell | prettyExact }}</dd>

                <!-- CREATE_COIN, EDIT_COIN_OWNER -->
                <dt v-if="tx.data.name">Name</dt>
                <dd v-if="tx.data.name">{{ tx.data.name }}</dd>
                <dt v-if="tx.data.symbol">Symbol</dt>
                <dd v-if="tx.data.symbol">{{ tx.data.symbol }}</dd>
                <dt v-if="tx.data.initialAmount">Initial amount</dt>
                <dd v-if="tx.data.initialAmount">{{ tx.data.initialAmount | prettyExact }}</dd>
                <dt v-if="tx.data.initialReserve">Initial reserve</dt>
                <dd v-if="tx.data.initialReserve">{{ $store.state.COIN_NAME }} {{ tx.data.initialReserve | prettyExact }}</dd>
                <dt v-if="tx.data.constantReserveRatio">CRR</dt>
                <dd v-if="tx.data.constantReserveRatio">{{ tx.data.constantReserveRatio }}&thinsp;%</dd>
                <dt v-if="tx.data.maxSupply">Max supply</dt>
                <dd v-if="tx.data.maxSupply">{{ tx.data.maxSupply | prettyExact }}</dd>
                <dt v-if="tx.data.newOwner">Owner address</dt>
                <dd v-if="tx.data.newOwner"><nuxt-link class="link--default" :to="'/address/' + tx.data.newOwner">{{ tx.data.newOwner }}</nuxt-link></dd>

                <!-- DELEGATE, UNBOND, DECLARE_CANDIDACY, SET_CANDIDATE_ONLINE, SET_CANDIDATE_OFFLINE, EDIT_CANDIDATE, EDIT_CANDIDATE_PUBLIC_KEY -->
                <dt v-if="validator.name">Validator</dt>
                <dd v-if="validator.name"><nuxt-link class="link--default" :to="'/validator/' + tx.data.pubKey">{{ validator.name }}</nuxt-link></dd>
                <dt v-if="tx.data.pubKey">Public key</dt>
                <dd v-if="tx.data.pubKey"><nuxt-link class="link--default" :to="'/validator/' + tx.data.pubKey">{{ tx.data.pubKey }}</nuxt-link></dd>
                    <dt v-if="tx.data.newPubKey">New public key</dt>
                    <dd v-if="tx.data.newPubKey"><nuxt-link class="link--default" :to="'/validator/' + tx.data.newPubKey">{{ tx.data.newPubKey }}</nuxt-link></dd>
                <dt v-if="isStake(tx) && isDefined(tx.data.stake || tx.data.value)">Stake</dt>
                <dd v-if="isStake(tx) && isDefined(tx.data.stake || tx.data.value)">{{ tx.data.coin.symbol }} {{ (tx.data.stake || tx.data.value) | prettyExact }}</dd>
                <dt v-if="isDefined(tx.data.commission)">Commission</dt>
                <dd v-if="isDefined(tx.data.commission)">{{ tx.data.commission }}&thinsp;%</dd>
                <dt v-if="isUnbond(tx)">Unbond block</dt>
                <dd v-if="isUnbond(tx)">{{ unbondBlockHeight | prettyRound }}</dd>
                <dt v-if="isUnbond(tx) && unbondTime">Unbond time</dt>
                <dd v-if="isUnbond(tx) && unbondTime">
                    <span v-if="isUnbondBlock">{{ unbondTime | timeDistance }} ago ({{ unbondTime | time }})</span>
                    <span v-else>In {{ unbondTime | timeDistanceFuture }} ({{ unbondTime | timeMinutes }})</span>
                </dd>
                <dt v-if="tx.data.rewardAddress">Reward address</dt>
                <dd v-if="tx.data.rewardAddress"><nuxt-link class="link--default" :to="'/address/' + tx.data.rewardAddress">{{ tx.data.rewardAddress }}</nuxt-link></dd>
                <dt v-if="tx.data.ownerAddress">Owner address</dt>
                <dd v-if="tx.data.ownerAddress"><nuxt-link class="link--default" :to="'/address/' + tx.data.ownerAddress">{{ tx.data.ownerAddress }}</nuxt-link></dd>
                    <dt v-if="tx.data.controlAddress">Control address</dt>
                    <dd v-if="tx.data.controlAddress"><nuxt-link class="link--default" :to="'/address/' + tx.data.controlAddress">{{ tx.data.controlAddress }}</nuxt-link></dd>

                <!-- REDEEM_CHECK -->
                <dt v-if="tx.data.check && tx.data.check.sender">Check issuer</dt>
                <dd v-if="tx.data.check && tx.data.check.sender"><nuxt-link class="link--default" :to="'/address/' + tx.data.check.sender">{{ tx.data.check.sender }}</nuxt-link></dd>
                <dt v-if="tx.data.check && tx.data.check.nonce">Check nonce</dt>
                <dd v-if="tx.data.check && tx.data.check.nonce">{{ fromBase64(tx.data.check.nonce) }}</dd>
                <dt v-if="tx.data.check && tx.data.check.dueBlock">Due Block</dt>
                <dd v-if="tx.data.check && tx.data.check.dueBlock">{{ tx.data.check.dueBlock }}</dd>
                <dt v-if="tx.data.check && tx.data.check.value">Amount</dt>
                <dd v-if="tx.data.check && tx.data.check.value">{{ tx.data.check.coin }} {{ tx.data.check.value | prettyExact }}</dd>

                <!-- MULTISEND -->
                <dt v-if="tx.data.list">#Recipients</dt>
                <dd v-if="tx.data.list">{{ tx.data.list.length }}</dd>
                <dt v-if="isMultisend(tx)">Total</dt>
                <dd v-if="isMultisend(tx)">
                    <span v-if="isMultisendMultipleCoin(tx)">Multiple coins</span>
                    <span v-else>{{ getMultisendCoin(tx) }} {{ getMultisendValue(tx) }}</span>
                </dd>

                <!-- CREATE MULTISIG -->
                <dt v-if="tx.data.multisigAddress">Multisig</dt>
                <dd v-if="tx.data.multisigAddress">
                    <nuxt-link class="link--default" :to="'/address/' + tx.data.multisigAddress">{{ tx.data.multisigAddress }}</nuxt-link>
                </dd>
                <dt v-if="tx.data.threshold">Threshold</dt>
                <dd v-if="tx.data.threshold">{{ tx.data.threshold }}</dd>
                <dt v-if="tx.data.weights">Weights Sum</dt>
                <dd v-if="tx.data.weights">{{ tx.data.weights.reduce((prev, next) => Number(prev) + Number(next)) }}</dd>

                <!-- SET_HALT_BLOCK -->
                <dt v-if="tx.data.height">Halt height</dt>
                <dd v-if="tx.data.height">{{ tx.data.height }}</dd>

                <dt v-if="tx.fee">Fee</dt>
                <dd v-if="tx.fee">
                    <template v-if="tx.gasCoin.symbol === $store.state.COIN_NAME">
                        {{ $store.state.COIN_NAME }} {{ tx.fee | prettyExact }}
                    </template>
                    <template v-else>
                        {{ tx.gasCoin.symbol }} <span class="u-text-muted">({{ $store.state.COIN_NAME }} {{ tx.fee | prettyExact }})</span>
                    </template>
                </dd>

                <dt v-if="tx.nonce">Nonce</dt>
                <dd v-if="tx.nonce">{{ tx.nonce }}</dd>

                <dt>Message</dt>
                <dd class="u-text-pre-line" :class="{'u-text-muted': !tx.payload }">{{ tx.payload ? fromBase64(tx.payload) : 'Blank' }}</dd>

                </template>

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
                        <td>{{ transfer.coin.symbol }} {{ transfer.value | prettyExact }}</td>
                    </tr>
                    </tbody>
                </table>

                <!-- CREATE MULTISIG -->
                <table class="table--recipient-list" v-if="tx.data.addresses && tx.data.addresses.length">
                    <thead>
                    <tr>
                        <th>Participant address</th>
                        <th>Weight</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="(address, index) in tx.data.addresses" :key="index">
                        <td>
                            <TableLink
                                    :link-text="address"
                                    :link-path="'/address/' + address"
                                    :should-not-shorten="!shouldShortenAddress"
                            />
                        </td>
                        <td>{{ tx.data.weights[index] }}</td>
                    </tr>
                    </tbody>
                </table>
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
