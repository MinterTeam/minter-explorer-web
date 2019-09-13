<script>
    import Big from 'big.js';
    import * as TX_TYPES from 'minterjs-tx/src/tx-types';
    import {getTimeDistance, getTime, pretty, prettyRound, txTypeFilter, shortFilter, fromBase64} from '~/assets/utils';
    import {UNBOND_PERIOD} from '~/assets/variables';
    import TableLink from '~/components/TableLink';

    export default {
        ideFix: null,
        UNBOND_PERIOD,
        components: {
            TableLink,
        },
        filters: {
            pretty,
            txType: txTypeFilter,
            short: shortFilter,
        },
        props: {
            /** @type Array<Transaction>*/
            txList: {
                type: Array,
                required: true,
            },
            currentAddress: {
                type: String,
            },
            currentValidator: {
                type: String,
            },
            currentBlock: {
                type: Number,
            },
            isLoading: {
                type: Boolean,
                default: false,
            },
        },
        data() {
            return {
                isTxExpanded: {/* {txn: boolean} */},
            };
        },
        computed: {
            txListFormatted() {
                return this.txList.map((tx) => {
                    return {
                        ...tx,
                        timeDistance:  getTimeDistance(tx.timestamp),
                        timeUTC: getTime(tx.timestamp),
                    };
                });
            },
        },
        methods: {
            prettyRound,
            fromBase64,
            isCurrentAddress(address) {
                return address === this.currentAddress;
            },
            isCurrentValidator(publicKey) {
                return publicKey === this.currentValidator;
            },
            isCurrentBlock(height) {
                return height === this.currentBlock;
            },
            isDefined(value) {
                return typeof value !== 'undefined';
            },
            toggleTx(txn) {
                this.$set(this.isTxExpanded, txn, !this.isTxExpanded[txn]);
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
            isMultisend(tx) {
                return tx.type === Number(TX_TYPES.TX_TYPE_MULTISEND);
            },
            isIncomeMultisend(tx) {
                if (!this.isMultisend(tx)) {
                    return;
                }
                const isOutcomeMultisend = this.currentAddress === tx.from;
                return !isOutcomeMultisend;
            },
            isIncomeSend(tx) {
                return this.currentAddress === tx.data.to;
            },
            isReceive(tx) {
                return this.currentAddress && (this.isIncomeSend(tx) || this.isIncomeMultisend(tx));
            },
            getAmount(tx) {
                return tx.data.value
                    || this.getConvertValue(tx)
                    || tx.data.stake
                    || tx.data.initial_amount
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
                    return (tx.data.coin || tx.data.symbol || this.getConvertCoinSymbol(tx) || (tx.data.check && tx.data.check.coin) || this.getMultisendCoin(tx)) + ' ' + pretty(this.getAmount(tx) || 0);
                }
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
            getMultisendDeliveryList(tx) {
                if (!this.currentAddress) {
                    return tx.data.list || [];
                }
                const isOutcomeMultisend = !this.isIncomeMultisend(tx);
                return isOutcomeMultisend ? tx.data.list : tx.data.list.filter((delivery) => {
                    return this.currentAddress === delivery.to;
                });
            },
            isMultisendMultipleCoin(tx) {
                if (!this.isMultisend(tx)) {
                    return;
                }
                const currentUserDeliveryList = this.getMultisendDeliveryList(tx);
                return currentUserDeliveryList.some((delivery) => {
                    return delivery.coin !== currentUserDeliveryList[0].coin;
                });
            },
            getMultisendCoin(tx) {
                if (!this.isMultisend(tx)) {
                    return;
                }
                if (!this.isMultisendMultipleCoin(tx)) {
                    return this.getMultisendDeliveryList(tx)[0].coin;
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
            getValidatorName(tx) {
                if (!tx.data.pub_key) {
                    return;
                }
                const validator = this.$store.state.validatorList.find((validatorItem) => validatorItem.public_key === tx.data.pub_key);
                return validator && validator.meta && validator.meta.name;
            },
        },
    };
</script>

<template>
    <div class="table-wrap">
        <div class="panel__content panel__section u-text-center" v-if="isLoading">
            <svg class="loader" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28">
                <circle class="loader__path" cx="14" cy="14" r="12"></circle>
            </svg>
        </div>
        <table class="u-text-nowrap" v-else-if="txList.length">
            <thead>
            <tr>
                <th>TxHash</th>
                <th>Block</th>
                <th>Age</th>
                <th>From</th>
                <th>Type</th>
                <th>Amount</th>
                <th class="table__expand-cell"></th>
            </tr>
            </thead>
            <tbody>
            <template v-for="tx in txListFormatted">
                <tr :class="{'is-expanded': isTxExpanded[tx.txn]}" :key="tx.txn">
                    <!-- hash -->
                    <td>
                        <TableLink :link-text="tx.hash" :link-path="'/transactions/' + tx.hash"/>
                    </td>
                    <!-- block -->
                    <td>
                        <TableLink :link-text="prettyRound(tx.block)" :link-path="'/blocks/' + tx.block" :is-not-link="isCurrentBlock(tx.block)" :should-not-shorten="true"/>
                    </td>
                    <!-- age -->
                    <td>{{ tx.timeDistance }} ago</td>
                    <!-- from -->
                    <td>
                        <TableLink :link-text="tx.from"
                                   :link-path="'/address/' + tx.from"
                                   :is-not-link="isCurrentAddress(tx.from)"
                        />
                    </td>
                    <!-- type -->
                    <td>
                        <span v-if="isReceive(tx)">Receive</span>
                        <span v-else>{{ tx.type | txType }}</span>
                    </td>
                    <!-- amount -->
                    <td>
                        <template v-if="hasAmount(tx)">
                            {{ getAmountWithCoin(tx) }}
                        </template>
                    </td>
                    <!--expand button -->
                    <td class="table__expand-cell">
                        <button class="table__expand-button u-semantic-button" :class="{'is-expanded': isTxExpanded[tx.txn]}" @click="toggleTx(tx.txn)">Show Tx Data</button>
                    </td>
                </tr>
                <tr class="table__row-expanded-data" :key="tx.txn + 'exp'" v-if="isTxExpanded[tx.txn]">
                    <td colspan="7">
                        <div class="table__inner">
                            <!-- type SEND -->
                            <div class="table__inner-item" v-if="tx.data.to">
                                <strong>To</strong> <br>
                                <TableLink :link-text="tx.data.to"
                                           :link-path="'/address/' + tx.data.to"
                                           :is-not-link="isCurrentAddress(tx.data.to)"
                                           :should-not-shorten="true"
                                />
                            </div>
                            <div class="table__inner-item" v-if="isDefined(tx.data.value)">
                                <strong>Value</strong> <br>
                                {{ tx.data.coin }} {{ tx.data.value | pretty }}
                            </div>

                            <!-- SELL -->
                            <div class="table__inner-item" v-if="isSell(tx)">
                                <strong>Sell coins</strong> <br>
                                {{ tx.data.coin_to_sell }} {{ tx.data.value_to_sell | pretty }}
                            </div>
                            <div class="table__inner-item" v-if="isSell(tx)">
                                <strong>Get coins</strong> <br>
                                {{ tx.data.coin_to_buy }} {{ tx.data.value_to_buy | pretty  }}
                            </div>
                            <!-- BUY -->
                            <div class="table__inner-item" v-if="isBuy(tx)">
                                <strong>Buy coins</strong> <br>
                                {{ tx.data.coin_to_buy }} {{ tx.data.value_to_buy | pretty }}
                            </div>
                            <div class="table__inner-item" v-if="isBuy(tx)">
                                <strong>Spend coins</strong> <br>
                                {{ tx.data.coin_to_sell }} {{ tx.data.value_to_sell | pretty }}
                            </div>

                            <!-- type CREATE_COIN -->
                            <div class="table__inner-item" v-if="tx.data.name">
                                <strong>Name</strong> <br>
                                {{ tx.data.name }}
                            </div>
                            <div class="table__inner-item" v-if="tx.data.symbol">
                                <strong>Symbol</strong> <br>
                                {{ tx.data.symbol }}
                            </div>
                            <div class="table__inner-item" v-if="tx.data.initial_amount">
                                <strong>Initial Amount</strong> <br>
                                {{ tx.data.initial_amount | pretty }}
                            </div>
                            <div class="table__inner-item" v-if="tx.data.initial_reserve">
                                <strong>Initial Reserve</strong> <br>
                                {{ tx.data.initial_reserve | pretty }}
                            </div>
                            <div class="table__inner-item" v-if="tx.data.constant_reserve_ratio">
                                <strong>CRR</strong> <br>
                                {{ tx.data.constant_reserve_ratio }}&thinsp;%
                            </div>

                            <!-- type DECLARE_CANDIDACY, EDIT_CANDIDATE, DELEGATE, UNBOND, SET_CANDIDATE_ONLINE, SET_CANDIDATE_OFFLINE -->
                            <div class="table__inner-item" v-if="getValidatorName(tx)">
                                <strong>Validator</strong> <br>
                                <TableLink :link-text="getValidatorName(tx)"
                                           :link-path="'/validator/' + tx.data.pub_key"
                                           :is-not-link="isCurrentValidator(tx.data.pub_key)"
                                           :should-not-shorten="true"
                                />
                            </div>
                            <div class="table__inner-item" v-if="tx.data.pub_key">
                                <strong>Public Key</strong> <br>
                                <TableLink :link-text="tx.data.pub_key"
                                           :link-path="'/validator/' + tx.data.pub_key"
                                           :is-not-link="isCurrentValidator(tx.data.pub_key)"
                                           :should-not-shorten="true"
                                />
                            </div>
                            <div class="table__inner-item" v-if="isDefined(tx.data.stake)">
                                <strong>Stake</strong> <br>
                                {{ tx.data.coin }} {{ tx.data.stake | pretty }}
                            </div>
                            <div class="table__inner-item" v-if="isDefined(tx.data.commission)">
                                <strong>Commission</strong> <br>
                                {{ tx.data.commission }}&thinsp;%
                            </div>
                            <div class="table__inner-item" v-if="isUnbond(tx)">
                                <strong>Unbond Block</strong> <br>
                                {{ prettyRound(tx.block + $options.UNBOND_PERIOD) }}
                            </div>
                            <div class="table__inner-item" v-if="tx.data.reward_address">
                                <strong>Reward Address</strong> <br>
                                <TableLink :link-text="tx.data.reward_address"
                                           :link-path="'/address/' + tx.data.reward_address"
                                           :is-not-link="isCurrentAddress(tx.data.reward_address)"
                                />
                            </div>
                            <div class="table__inner-item" v-if="tx.data.owner_address">
                                <strong>Owner Address</strong> <br>
                                <TableLink :link-text="tx.data.owner_address"
                                           :link-path="'/address/' + tx.data.owner_address"
                                           :is-not-link="isCurrentAddress(tx.data.owner_address)"
                                />
                            </div>

                            <!-- type REDEEM_CHECK -->
                            <div class="table__inner-item" v-if="tx.data.check && tx.data.check.sender">
                                <strong>Check Issuer</strong> <br>
                                <TableLink :link-text="tx.data.check.sender"
                                           :link-path="'/address/' + tx.data.check.sender"
                                           :is-not-link="isCurrentAddress(tx.data.check.sender)"
                                           :should-not-shorten="true"
                                />
                            </div>
                            <div class="table__inner-item" v-if="tx.data.check && tx.data.check.nonce">
                                <strong>Check Nonce</strong> <br>
                                {{ fromBase64(tx.data.check.nonce) }}
                            </div>
                            <div class="table__inner-item" v-if="tx.data.check && tx.data.check.due_block">
                                <strong>Due Block</strong> <br>
                                {{ tx.data.check.due_block }}
                            </div>

                            <!-- timestamp -->
                            <div class="table__inner-item">
                                <strong>Timestamp</strong> <br>
                                {{ tx.timeUTC }}
                            </div>

                            <!-- fee -->
                            <div class="table__inner-item">
                                <strong>Fee</strong> <br>
                                {{ $store.state.COIN_NAME }} {{ tx.fee | pretty }}
                            </div>

                            <!-- message -->
                            <div class="table__inner-item" v-if="tx.payload">
                                <strong>Message</strong> <br>
                                {{ fromBase64(tx.payload) }}
                            </div>
                        </div>
                    </td>
                </tr>
            </template>
            </tbody>
        </table>
        <div class="panel__content panel__section u-text-center" v-else>No Transactions</div>
    </div>
</template>
