<script>
    import {getTransactionList} from "~/api";
    import getTitle from '~/assets/get-title';
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
        asyncData({ query }) {
            return getTransactionList(query)
                .then((txListInfo) => {
                    return {
                        paginationInfo: txListInfo.meta,
                        txList: txListInfo.data,
                    };
                });
        },
        head() {
            const title = getTitle('Transactions');

            return {
                title: title,
                meta: [
                    { hid: 'og-title', name: 'og:title', content: title },
                ],
            };
        },
        data() {
            return {
                paginationInfo: {},
                /** @type Array<Transaction> */
                txList: [],
            };
        },
    };
</script>

<template>
    <div>
        <TransactionList :tx-list="txList" :pagination-info="paginationInfo" :back-button="true"/>
        <Pagination :pagination-info="paginationInfo"/>
    </div>
</template>


