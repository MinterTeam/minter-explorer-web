<script>
    import {getAddress, getTransactionList, getRewardList, getSlashList} from "~/api";
    import getTitle from '~/assets/get-title';
    import {prettyExact, prettyUsd} from "~/assets/utils";
    import TransactionListTable from '~/components/TransactionListTable';
    import RewardSlashListTable from '~/components/RewardSlashListTable';
    import RewardChart from '~/components/RewardChart';
    import BackButton from '~/components/BackButton';
    import Pagination from "~/components/Pagination";

    const TAB_TYPES = {
        TX: 'tx',
        REWARD: 'reward',
        SLASH: 'slash',
    };

    export default {
        TAB_TYPES,
        components: {
            TransactionListTable,
            RewardSlashListTable,
            RewardChart,
            BackButton,
            Pagination,
        },
        filters: {
            prettyExact,
            prettyUsd,
        },
        //@TODO page switching without route reload
        watchQuery: ['page', 'active_tab'],
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
                activeTab: Object.values(TAB_TYPES).indexOf(this.$route.query.active_tab) !== -1 ? this.$route.query.active_tab : TAB_TYPES.TX,
                txCount: 0,
                txList: [],
                txPaginationInfo: {},
                isTxListLoading: true,
                rewardList: [],
                rewardPaginationInfo: {},
                isRewardListLoading: true,
                slashList: [],
                slashPaginationInfo: {},
                isSlashListLoading: true,
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
            activePaginationInfo() {
                if (this.activeTab === TAB_TYPES.TX) {
                    return this.txPaginationInfo;
                }
                if (this.activeTab === TAB_TYPES.REWARD) {
                    return this.rewardPaginationInfo;
                }
                if (this.activeTab === TAB_TYPES.SLASH) {
                    return this.slashPaginationInfo;
                }
            },
        },
        mounted() {
            getTransactionList({
                address: this.$route.params.address,
                page: this.$route.query.active_tab === TAB_TYPES.TX ? this.$route.query.page : undefined,
            })
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
            getRewardList({
                address: this.$route.params.address,
                page: this.$route.query.active_tab === TAB_TYPES.REWARD ? this.$route.query.page : undefined,
            })
                .then((rewardListInfo) => {
                    if (rewardListInfo.data && rewardListInfo.data.length) {
                        this.rewardList = rewardListInfo.data;
                        this.rewardPaginationInfo = rewardListInfo.meta;
                    }
                    this.isRewardListLoading = false;
                })
                .catch(() => {
                    this.isRewardListLoading = false;
                });
            getSlashList({
                address: this.$route.params.address,
                page: this.$route.query.active_tab === TAB_TYPES.SLASH ? this.$route.query.page : undefined,
            })
                .then((slashListInfo) => {
                    if (slashListInfo.data && slashListInfo.data.length) {
                        this.slashList = slashListInfo.data;
                        this.slashPaginationInfo = slashListInfo.meta;
                    }
                    this.isSlashListLoading = false;
                })
                .catch(() => {
                    this.isSlashListLoading = false;
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
        <RewardChart v-show="activeTab === $options.TAB_TYPES.REWARD"/>
        <section class="panel u-section">
            <div class="panel__switcher">
                <button class="panel__switcher-item panel__switcher-item--small panel__title panel__header-title u-semantic-button"
                        :class="{'is-active': activeTab === $options.TAB_TYPES.TX}"
                        @click="activeTab = $options.TAB_TYPES.TX"
                >
                    <img class="panel__header-title-icon u-hidden-medium-down" src="/img/icon-transaction.svg" width="40" height="40" alt="" role="presentation">
                    Transactions
                </button>
                <button class="panel__switcher-item panel__switcher-item--small panel__title panel__header-title u-semantic-button"
                        :class="{'is-active': activeTab === $options.TAB_TYPES.REWARD}"
                        @click="activeTab = $options.TAB_TYPES.REWARD"
                >
                    <img class="panel__header-title-icon u-hidden-medium-down" src="/img/icon-reward.svg" width="40" height="40" alt="" role="presentation">
                    Rewards
                </button>
                <button class="panel__switcher-item panel__switcher-item--small panel__title panel__header-title u-semantic-button"
                        :class="{'is-active': activeTab === $options.TAB_TYPES.SLASH}"
                        @click="activeTab = $options.TAB_TYPES.SLASH"
                >
                    <img class="panel__header-title-icon u-hidden-medium-down" src="/img/icon-slash.svg" width="40" height="40" alt="" role="presentation">
                    Slashes
                </button>
            </div>
            <TransactionListTable :tx-list="txList" :current-address="$route.params.address" :is-loading="isTxListLoading" v-if="activeTab === $options.TAB_TYPES.TX"/>
            <RewardSlashListTable :data-list="rewardList" data-type="reward" :is-loading="isRewardListLoading" v-if="activeTab === $options.TAB_TYPES.REWARD"/>
            <RewardSlashListTable :data-list="slashList" data-type="slash" :is-loading="isSlashListLoading" v-if="activeTab === $options.TAB_TYPES.SLASH"/>
        </section>
        <Pagination :pagination-info="activePaginationInfo" :active-tab="activeTab"/>
    </div>
</template>
