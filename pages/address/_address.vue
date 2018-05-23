<script>
    import {getAddress, getTransactionList} from "~/api";
    import TransactionList from '~/components/TransactionList';
    import BackButton from '~/components/BackButton';

    export default {
        components: {
            TransactionList,
            BackButton,
        },
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
            }
        },
        mounted() {
            getTransactionList(this.$route.params)
                .then((txListInfo) => {
                    if (txListInfo.data && txListInfo.data.length) {
                        this.txList = txListInfo.data;
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

                <dt>BIP Balance</dt>
                <dd>{{ bipBalance}} BIP</dd>

                <dt>BIP USD Value</dt>
                <dd>${{ bipBalanceUsd }}</dd>

                <dt>#Transactions</dt>
                <dd>{{ txCount }}</dd>
            </dl>
        </section>
        <section class="panel u-section">
            <div class="panel__section panel__header">
                <h2 class="panel__header-title panel__title">
                    <img class="panel__header-title-icon" src="/img/icon-transaction.svg" alt="" role="presentation">
                    Transactions
                </h2>
            </div>
            <TransactionList :tx-list="txList" v-if="txList.length" :current-address="$route.params.address"/>
        </section>
    </div>
</template>
