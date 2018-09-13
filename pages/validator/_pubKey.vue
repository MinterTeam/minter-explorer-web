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
        asyncData({ params, query, error }) {
            return getTransactionList(Object.assign({}, params, query))
                .then((txListInfo) => {
                    return {
                        txList: txListInfo.data,
                        txPaginationInfo: txListInfo.meta,
                    };
                })
                .catch(() => {
                    error({ statusCode: 404, message: 'Public key not found' });
                });
        },
        head() {
            const title = getTitle('Validator ' + this.$route.params.pubKey);

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
    };
</script>

<template>
    <div>
        <section class="panel u-section">
            <div class="panel__section panel__header">
                <h1 class="panel__header-title panel__title">
                    <BackButton/>
                    <span>Validator Overview</span>
                </h1>
            </div>
            <dl>
                <dt>Public Key</dt>
                <dd class="u-select-all">{{ $route.params.pubKey }}</dd>

                <dt>#Transactions</dt>
                <dd>{{ txPaginationInfo.total }}</dd>
            </dl>
        </section>
        <TransactionList :tx-list="txList"
                         :current-validator="$route.params.pubKey"
                         :pagination-info="txPaginationInfo"
                         v-if="txList.length"
        />
        <Pagination :pagination-info="txPaginationInfo"/>
    </div>
</template>
