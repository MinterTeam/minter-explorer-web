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
        <TransactionList :tx-list="txList" :pagination-info="paginationInfo" :back-button="true"/>
        <Pagination :pagination-info="paginationInfo"/>
    </div>
</template>


