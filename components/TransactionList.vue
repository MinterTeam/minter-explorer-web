<script>
    import TransactionListTable from '~/components/TransactionListTable';
    import BackButton from '~/components/BackButton';
    import Pagination from "~/components/Pagination";

    export default {
        components: {
            TransactionListTable,
            BackButton,
            Pagination,
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
            paginationInfo: {
                type: Object,
            },
            backButton: {
                type: Boolean,
                default: false,
            },
            isLoading: {
                type: Boolean,
            },
        },

    };
</script>

<template>
    <section class="panel u-section">
        <div class="panel__section panel__header">
            <h1 class="panel__title panel__header-title">
                <BackButton v-if="backButton"/>
                <img class="panel__header-title-icon" src="/img/icon-transaction.svg" width="40" height="40" alt="" role="presentation" v-else>
                Transactions
            </h1>
            <Pagination
                v-show="!isLoading"
                :pagination-info="paginationInfo"
                :hide-meta="true"
                class="u-hidden-medium-down"
                pagination-class="pagination--header"
                button-class="button--white"
                button-disabled-class="u-hidden"
            />
        </div>
        <TransactionListTable :tx-list="txList" :current-address="currentAddress" :current-validator="currentValidator" :current-block="currentBlock" :is-loading="isLoading"/>
    </section>
</template>
