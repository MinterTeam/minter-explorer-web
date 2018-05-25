<script>
    import {getTransactionList} from "~/api";
    import TransactionList from '~/components/TransactionList';
    import BackButton from '~/components/BackButton';
    import Pagination from "~/components/Pagination";

    export default {
        components: {
            TransactionList,
            BackButton,
            Pagination,
        },
        watchQuery: ['page'],
        key: (to) => to.fullPath,
        asyncData ({ query }) {
            return getTransactionList(query)
                .then((txListInfo) => {
                    return {
                        paginationInfo: txListInfo.meta,
                        txList: txListInfo.data,
                    };
                });
        },
        data() {
            return {
                paginationInfo: {},
                /** @type Array<Transaction> */
                txList: [],
            }
        },
    }
</script>

<template>
    <div>
        <section class="panel u-section">
            <div class="panel__section panel__header">
                <h1 class="panel__title panel__header-title">
                    <BackButton/>
                    Transactions
                </h1>
                <Pagination :pagination-info="paginationInfo"
                            base-path="/transactions"
                            pagination-class="pagination--header u-hidden-medium-down"
                            button-class="button--white"
                            button-disabled-class="u-hidden"
                />
            </div>
            <TransactionList :tx-list="txList"/>
        </section>
        <Pagination :pagination-info="paginationInfo" base-path="/transactions"/>
    </div>
</template>


