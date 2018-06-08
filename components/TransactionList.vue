<script>
    import {getTimeDistance, roundMoney} from '~/assets/utils';
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
            money: (value) => roundMoney(value),
            // bipAmount: (value) => {
            //     const result = roundMoney(value);
            //     const isReducedPrecision = parseFloat(result) !== value;
            //     return isReducedPrecision ? '~ ' + result : result;
            // },
        },
        props: {
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
                    <th>To</th>
                    <th>Value</th>
                    <th>TxFee</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="tx in txListFormatted" :key="tx.hash">
                    <td>
                        <TableLink :link-text="tx.hash" :link-path="'/transactions/' + tx.hash"/>
                    </td>
                    <td>
                        <TableLink :link-text="tx.block" :link-path="'/blocks/' + tx.block" :is-not-link="isCurrentBlock(tx.block)"/>
                    </td>
                    <td>{{ tx.timeDistance }} ago</td>
                    <td>
                        <TableLink :link-text="tx.data.from" :link-path="'/address/' + tx.data.from" :is-not-link="isCurrentAddress(tx.data.from)"/>
                    </td>
                    <td>
                        <TableLink :link-text="tx.data.to" :link-path="'/address/' + tx.data.to" :is-not-link="isCurrentAddress(tx.data.to)"/>
                    </td>
                    <td>{{ tx.data.amount | money }} {{ tx.data.coin }}</td>
                    <td class="u-text-muted">{{ tx.fee | money }} {{ $store.state.COIN_NAME }}</td>
                </tr>
                </tbody>
            </table>
        </div>
    </section>


</template>
