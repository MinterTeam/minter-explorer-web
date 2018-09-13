<script>
    import {getAddress, getTransactionList} from "~/api";
    import getTitle from '~/assets/get-title';
    import {prettyExact, prettyUsd} from "~/assets/utils";
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
            prettyExact,
            prettyUsd,
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
            };
        },
        data() {
            return {
                txCount: 0,
                txList: [],
                txPaginationInfo: {},
                isTxListLoading: true,
            };
        },
        computed: {
            baseCoin() {
                // coins goes from asyncData
                return this.coins && this.coins.length ? this.coins.reduce((result, coin) => {
                    if (coin.coin.toUpperCase() === this.$store.state.COIN_NAME) {
                        result = coin;
                    }
                    return result;
                }, null) : null;
            },
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
    };
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
                <dd class="u-select-all">{{ $route.params.address }}</dd>

                <dt>Balance</dt>
                <dd>{{ baseCoin ? baseCoin.amount : 0 | prettyExact }} {{ $store.state.COIN_NAME }}</dd>

                <dt>USD Value</dt>
                <dd>${{ baseCoin ? baseCoin.usdAmount : 0 | prettyUsd }}</dd>

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
