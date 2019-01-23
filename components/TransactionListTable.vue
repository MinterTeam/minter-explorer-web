<script>
    import {getTimeDistance, pretty, txTypeFilter, shortFilter} from '~/assets/utils';
    import {TX_TYPES, UNBOND_PERIOD} from '~/assets/variables';
    import TableLink from '~/components/TableLink';

    export default {
        UNBOND_PERIOD,
        components: {
            TableLink,
        },
        filters: {
            pretty,
            // transform "camelCaseText" to "Sentence Case Text"
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
                   };
                });
            },
        },
        methods: {
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
                return tx.type === TX_TYPES.SELL_COIN || tx.type === TX_TYPES.SELL_ALL_COIN;
            },
            isBuy(tx) {
                return tx.type === TX_TYPES.BUY_COIN;
            },
            isUnbond(tx) {
                return tx.type === TX_TYPES.UNBOND;
            },
            hasAmount(tx) {
                return typeof tx.data.amount !== 'undefined'
                    || typeof tx.data.value !== 'undefined'
                    || typeof tx.data.value_to_sell !== 'undefined'
                    || typeof tx.data.value_to_buy !== 'undefined'
                    || typeof tx.data.stake !== 'undefined'
                    || typeof tx.data.initial_amount !== 'undefined'
                    || (tx.data.check && typeof tx.data.check.value !== 'undefined');
            },
            getConvertCoinSymbol(tx) {
                if (tx.type === TX_TYPES.SELL_COIN || tx.type === TX_TYPES.SELL_ALL_COIN) {
                    return tx.data.coin_to_sell;
                }
                if (tx.type === TX_TYPES.BUY_COIN) {
                    return tx.data.coin_to_buy;
                }
            },
            getConvertValue(tx) {
                if (tx.type === TX_TYPES.SELL_COIN || tx.type === TX_TYPES.SELL_ALL_COIN) {
                    return tx.data.value_to_sell;
                }
                if (tx.type === TX_TYPES.BUY_COIN) {
                    return tx.data.value_to_buy;
                }
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
                        <TableLink :link-text="tx.block" :link-path="'/blocks/' + tx.block" :is-not-link="isCurrentBlock(tx.block)" :should-not-shorten="true"/>
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
                    <td>{{ tx.type | txType }}</td>
                    <!-- amount -->
                    <td>
                        <div v-if="hasAmount(tx)">
                            {{ tx.data.amount || getConvertValue(tx) || tx.data.stake || tx.data.initial_amount || (tx.data.check && tx.data.check.value) || 0 | pretty }}
                            {{ tx.data.coin || tx.data.symbol || getConvertCoinSymbol(tx) || (tx.data.check && tx.data.check.coin) }}
                        </div>
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
                            <div class="table__inner-item" v-if="isDefined(tx.data.amount)">
                                <strong>Value</strong> <br>
                                {{ tx.data.amount | pretty }} {{ tx.data.coin }}
                            </div>

                            <!-- SELL -->
                            <div class="table__inner-item" v-if="isSell(tx)">
                                <strong>Sell coins</strong> <br>
                                {{ tx.data.value_to_sell | pretty }} {{ tx.data.coin_to_sell }}
                            </div>
                            <div class="table__inner-item" v-if="isSell(tx)">
                                <strong>Get coins</strong> <br>
                                {{ tx.data.value_to_buy | pretty  }} {{ tx.data.coin_to_buy }}
                            </div>
                            <!-- BUY -->
                            <div class="table__inner-item" v-if="isBuy(tx)">
                                <strong>Buy coins</strong> <br>
                                {{ tx.data.value_to_buy | pretty }} {{ tx.data.coin_to_buy }}
                            </div>
                            <div class="table__inner-item" v-if="isBuy(tx)">
                                <strong>Spend coins</strong> <br>
                                {{ tx.data.value_to_sell | pretty }} {{ tx.data.coin_to_sell }}
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
                                {{ tx.data.stake | pretty }} {{ tx.data.coin }}
                            </div>
                            <div class="table__inner-item" v-if="isDefined(tx.data.commission)">
                                <strong>Commission</strong> <br>
                                {{ tx.data.commission }}&thinsp;%
                            </div>
                            <div class="table__inner-item" v-if="isUnbond(tx)">
                                <strong>Unbond Block</strong> <br>
                                {{ tx.block + $options.UNBOND_PERIOD }}
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
                            <div class="table__inner-item" v-if="tx.data.raw_check">
                                <strong>Check</strong> <br>
                                <!--<TableLink :link-text="tx.data.raw_check" :is-not-link="true"/>-->
                                {{ tx.data.raw_check | short}}
                            </div>
                            <div class="table__inner-item" v-if="tx.data.proof">
                                <strong>Proof</strong> <br>
                                {{ tx.data.proof | short}}
                            </div>
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
                                {{ tx.data.check.nonce }}
                            </div>
                            <div class="table__inner-item" v-if="tx.data.check && tx.data.check.due_block">
                                <strong>Due Block</strong> <br>
                                {{ tx.data.check.due_block }}
                            </div>

                            <!-- fee -->
                            <div class="table__inner-item">
                                <strong>Fee</strong> <br>
                                {{ tx.fee | pretty }} {{ $store.state.COIN_NAME }}
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
