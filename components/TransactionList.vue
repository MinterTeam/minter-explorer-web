<script>
    import {getTimeDistance, prettyRound, txTypeFilter} from '~/assets/utils';
    import {TX_TYPES} from '~/assets/variables';
    import BackButton from '~/components/BackButton';
    import Pagination from "~/components/Pagination";
    import TableLink from '~/components/TableLink';
    //import TableLink from '~/components/TableO';

    export default {
        components: {
            BackButton,
            Pagination,
            TableLink,
        },
        filters: {
            prettyRound,
            // transform "camelCaseText" to "Sentence Case Text"
            txType: txTypeFilter,
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
            currentBlock: {
                type: Number,
            },
            paginationInfo: {
                type: Object,
            },
            backButton: {
                type: Boolean,
                default: false,
            },
        },
        data() {
            return {
                isTxExpanded: {/* {txn: boolean} */},
            }
        },
        computed: {
            txListFormatted() {
                return this.txList.map((tx) => {
                   return {
                       ...tx,
                       timeDistance:  getTimeDistance(tx.timestamp),
                   }
                });
            },
        },
        methods: {
            isCurrentAddress(address) {
                return address === this.currentAddress;
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
            getConvertCoinSymbol(tx) {
                if (tx.type === TX_TYPES.SELL_COIN) {
                    return tx.data.coin_to_sell;
                }
                if (tx.type === TX_TYPES.BUY_COIN) {
                    return tx.data.coin_to_buy;
                }
            },
            getConvertCoinText(tx) {
                if (tx.type === TX_TYPES.SELL_COIN) {
                    return 'to Sell';
                }
                if (tx.type === TX_TYPES.BUY_COIN) {
                    return 'to Buy';
                }
            },
        }
    }
</script>

<template>
    <section class="panel u-section">
        <div class="panel__section panel__header">
            <h1 class="panel__title panel__header-title">
                <BackButton v-if="backButton"/>
                <img class="panel__header-title-icon" src="/img/icon-transaction.svg" alt="" role="presentation" v-else>
                Transactions
            </h1>
            <Pagination :pagination-info="paginationInfo"
                        pagination-class="pagination--header u-hidden-medium-down"
                        button-class="button--white"
                        button-disabled-class="u-hidden"
            />
        </div>
        <div class="table-wrap">
            <table class="u-text-nowrap">
                <thead>
                <tr>
                    <th>TxHash</th>
                    <th>Block</th>
                    <th>Age</th>
                    <th>From</th>
                    <th>Type</th>
                    <th>TxFee</th>
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
                            <TableLink :link-text="tx.block" :link-path="'/blocks/' + tx.block" :is-not-link="isCurrentBlock(tx.block)"/>
                        </td>
                        <!-- age -->
                        <td>{{ tx.timeDistance }} ago</td>
                        <!-- from -->
                        <td>
                            <TableLink :link-text="tx.data.from"
                                       :link-path="'/address/' + tx.data.from"
                                       :is-not-link="isCurrentAddress(tx.data.from)"
                                       v-if="tx.data.from"
                            />
                        </td>
                        <!-- type -->
                        <td>{{ tx.type | txType }}</td>
                        <!-- fee -->
                        <td class="u-text-muted">{{ tx.fee | prettyRound }} {{ $store.state.COIN_NAME }}</td>
                        <!--expand button -->
                        <td class="table__expand-cell">
                            <button class="table__expand-button u-semantic-button" :class="{'is-expanded': isTxExpanded[tx.txn]}" @click="toggleTx(tx.txn)">Show Tx Data</button>
                        </td>
                    </tr>
                    <tr class="table__row-expanded-data" :key="tx.txn" v-if="isTxExpanded[tx.txn]">
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
                                    {{ tx.data.amount | prettyRound }} {{ tx.data.coin }}
                                </div>

                                <!-- type CONVERT -->
                                <div class="table__inner-item" v-if="tx.data.coin_to_sell">
                                    <strong>Coin to Sell</strong> <br>
                                    {{ tx.data.coin_to_sell }}
                                </div>
                                <div class="table__inner-item" v-if="isDefined(tx.data.value)">
                                    <strong>Value {{ getConvertCoinText(tx) }}</strong> <br>
                                    {{ tx.data.value | prettyRound }} {{ getConvertCoinSymbol(tx) }}
                                </div>
                                <div class="table__inner-item" v-if="tx.data.coin_to_buy">
                                    <strong>Coin to Buy</strong> <br>
                                    {{ tx.data.coin_to_buy }}
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
                                    {{ tx.data.initial_amount | prettyRound }}
                                </div>
                                <div class="table__inner-item" v-if="tx.data.initial_reserve">
                                    <strong>Initial Reserve</strong> <br>
                                    {{ tx.data.initial_reserve | prettyRound }}
                                </div>
                                <div class="table__inner-item" v-if="tx.data.constant_reserve_ratio">
                                    <strong>CRR</strong> <br>
                                    {{ tx.data.constant_reserve_ratio }}&thinsp;%
                                </div>

                                <!-- type DECLARE_CANDIDACY, DELEGATE, UNBOUND, SET_CANDIDATE_ONLINE, SET_CANDIDATE_OFFLINE -->
                                <div class="table__inner-item" v-if="tx.data.pub_key">
                                    <strong>Public Key</strong> <br>
                                    {{ tx.data.pub_key }}
                                </div>
                                <div class="table__inner-item" v-if="isDefined(tx.data.stake)">
                                    <strong>Stake</strong> <br>
                                    {{ tx.data.stake | prettyRound }} {{ tx.data.coin }}
                                </div>
                                <div class="table__inner-item" v-if="isDefined(tx.data.commission)">
                                    <strong>Commission</strong> <br>
                                    {{ tx.data.commission }}&thinsp;%
                                </div>

                                <!-- type REDEEM_CHECK -->
                                <div class="table__inner-item" v-if="tx.data.raw_check">
                                    <strong>Check</strong> <br>
                                    {{ tx.data.raw_check }}
                                </div>
                                <div class="table__inner-item" v-if="tx.data.proof">
                                    <strong>Proof</strong> <br>
                                    {{ tx.data.proof }}
                                </div>
                            </div>
                        </td>
                    </tr>
                </template>
                </tbody>
            </table>
        </div>
    </section>


</template>
