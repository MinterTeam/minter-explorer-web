<script>
    import {getAddress, getTransactionList} from "~/api";
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
        asyncData({ params, error }) {
            return getAddress(params.address)
                .then((address) => address)
                .catch((e) => {
                    error({ statusCode: 404, message: 'Address not found' });
                });
        },
        data() {
            return {
                bipBalance: 0,
                bipBalanceUsd: 0,
                txCount: 0,
                txList: [],
                txPaginationInfo: {},
            }
        },
        mounted() {
            getTransactionList(Object.assign({}, this.$route.params, this.$route.query))
                .then((txListInfo) => {
                    if (txListInfo.data && txListInfo.data.length) {
                        this.txList = txListInfo.data;
                        this.txPaginationInfo = txListInfo.meta;
                    }
                });
        },
    }
</script>

<template>
    <div>
        <section class="panel u-section">
            <div class="panel__section panel__header">
                <h1 class="panel__header-title panel__title">
                    <BackButton/>
                    <span>Address Overview</span>
                </h1>
            </div>
            <dl>
                <dt>Address</dt>
                <dd>{{ $route.params.address }}</dd>

                <dt>Balance</dt>
                <dd>{{ bipBalance}} {{ $store.state.COIN_NAME }}</dd>

                <dt>USD Value</dt>
                <dd>${{ bipBalanceUsd }}</dd>

                <dt>#Transactions</dt>
                <dd>{{ txCount }}</dd>
            </dl>
        </section>
        <TransactionList :tx-list="txList"
                         :current-address="$route.params.address"
                         :pagination-info="txPaginationInfo"
                         v-if="txList.length"
        />
        <Pagination :pagination-info="txPaginationInfo"/>
    </div>
</template>
