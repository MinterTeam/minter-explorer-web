<script>
    import {getAddress, getTransactionList} from "~/api";
    import getTitle from '~/assets/get-title';
    import {roundMoney, thousandsFilter} from "~/assets/utils";
    import TransactionList from '~/components/TransactionList';
    import BackButton from '~/components/BackButton';
    import Pagination from "~/components/Pagination";

    export default {
        components: {
            TransactionList,
            BackButton,
            Pagination,
        },
        filters: {
            money: roundMoney,
            thousands: thousandsFilter,
        },
        watchQuery: ['page'],
        key: (to) => to.fullPath,
        asyncData({ params, error }) {
            return getAddress(params.address)
                .catch((e) => {
                    error({ statusCode: 404, message: 'Address not found' });
                });
        },
        head() {
            const title = getTitle('Address ' + this.$route.params.address);

            return {
                title: title,
                meta: [
                    { hid: 'og-title', name: 'og:title', content: title },
                ],
            }
        },
        data() {
            return {
                bipTotal: 0,
                usdTotal: 0,
                txCount: 0,
                txList: [],
                txPaginationInfo: {},
                isTxListLoading: true,
            }
        },
        mounted() {
            getTransactionList(Object.assign({}, this.$route.params, this.$route.query))
                .then((txListInfo) => {
                    if (txListInfo.data && txListInfo.data.length) {
                        this.txList = txListInfo.data;
                        this.txPaginationInfo = txListInfo.meta;
                    }
                    this.isTxListLoading = false;
                })
                .catch(() => {
                    this.isTxListLoading = false;
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

                <dt>Total Balance</dt>
                <dd>{{ bipTotal | money | thousands }} {{ $store.state.COIN_NAME }}</dd>

                <dt>USD Value</dt>
                <dd>${{ usdTotal | money | thousands }}</dd>

                <dt>#Transactions</dt>
                <dd>{{ txCount }}</dd>
            </dl>
        </section>
        <p class="u-section" v-if="isTxListLoading && txCount">Loading TX...</p>
        <TransactionList :tx-list="txList"
                         :current-address="$route.params.address"
                         :pagination-info="txPaginationInfo"
                         v-if="txList.length"
        />
        <Pagination :pagination-info="txPaginationInfo"/>
    </div>
</template>
