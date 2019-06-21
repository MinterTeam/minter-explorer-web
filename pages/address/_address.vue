<script>
    import {isValidAddress} from 'minterjs-util/src/prefix';
    import {getBalance, getAddressTransactionList, getAddressStakeList, getAddressRewardList, getAddressSlashList} from "~/api";
    import getTitle from '~/assets/get-title';
    import {getErrorText} from '~/assets/server-error';
    import {pretty, prettyPrecise} from "~/assets/utils";
    import TransactionList from '~/components/TransactionList';
    import StakeListTable from '~/components/StakeListTable';
    import RewardSlashListTable from '~/components/RewardSlashListTable';
    import RewardChart from '~/components/RewardChart';
    import BackButton from '~/components/BackButton';
    import Pagination from "~/components/Pagination";

    const TAB_TYPES = {
        TX: 'tx',
        STAKE: 'stake',
        REWARD: 'reward',
        SLASH: 'slash',
    };

    export default {
        TAB_TYPES,
        components: {
            TransactionList,
            StakeListTable,
            RewardSlashListTable,
            RewardChart,
            BackButton,
            Pagination,
        },
        filters: {
            pretty,
        },
        // watchQuery: ['page', 'active_tab_page'],
        // key: (to) => to.fullPath,
        asyncData({ params, error }) {
            if (!isValidAddress(params.address)) {
                return error({
                    statusCode: 404,
                    message: 'Invalid address',
                });
            }
            return getBalance(params.address)
                .then((balanceList) => {
                    return {
                        balanceList,
                    };
                })
                .catch((e) => {
                    console.log({e});
                    let statusCode = e.request && e.request.status;
                    error({
                        statusCode,
                        message: statusCode === 404 ? 'Address not found' : getErrorText(e),
                    });
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
                balanceList: [],
                activeTab: Object.values(TAB_TYPES).indexOf(this.$route.query.active_tab) !== -1 ? this.$route.query.active_tab : TAB_TYPES.STAKE,
                storedTabPages: {},
                txList: [],
                txPaginationInfo: {},
                isTxListLoading: true,
                stakeList: [],
                isStakeListLoading: true,
                rewardList: [],
                rewardPaginationInfo: {},
                isRewardListLoading: true,
                slashList: [],
                slashPaginationInfo: {},
                isSlashListLoading: true,
            };
        },
        watch: {
            //@TODO handle multiple page change
            // update data on page change
            '$route.query': {
                handler(newVal, oldVal) {
                    if (newVal.page !== oldVal.page) {
                        this.isTxListLoading = true;
                        this.fetchTxs();
                    }

                    // same tab, new page
                    if (newVal.active_tab === oldVal.active_tab && newVal.active_tab_page !== oldVal.active_tab_page) {
                        if (this.activeTab === TAB_TYPES.REWARD) {
                            this.isRewardListLoading = true;
                            this.fetchRewards();
                        }
                        if (this.activeTab === TAB_TYPES.SLASH) {
                            this.isSlashListLoading = true;
                            this.fetchSlashes();
                        }

                        this.checkPanelPosition();
                    }
                },
            },
        },
        computed: {
            activePaginationInfo() {
                if (this.activeTab === TAB_TYPES.REWARD) {
                    return this.rewardPaginationInfo;
                }
                if (this.activeTab === TAB_TYPES.SLASH) {
                    return this.slashPaginationInfo;
                }
                return false;
            },
        },
        mounted() {
            this.fetchTxs();
            this.fetchStakes();
            this.fetchRewards();
            this.fetchSlashes();
        },
        methods: {
            prettyPrecise,
            switchTab(newTab) {
                // save previous active_tab_page
                if (this.$route.query.active_tab) {
                    this.storedTabPages[this.$route.query.active_tab] = this.$route.query.active_tab_page;
                }
                // set new tab
                this.activeTab = newTab;
                // restore saved active_tab_page
                let newTabPage;
                if (this.storedTabPages[newTab]) {
                    newTabPage = this.storedTabPages[newTab];
                }

                // update route
                this.$router.replace({
                    // path: this.$route.path,
                    query: {
                        ...this.$route.query,
                        active_tab: newTab,
                        active_tab_page: newTabPage,
                    },
                });

                // wait for rewards chart to disappear
                this.$nextTick(this.checkPanelPosition);
            },
            checkPanelPosition() {
                const delegationPanelEl = document.querySelector('[data-delegation-panel]');
                // const delegationTableEl = document.querySelector('[data-delegation-panel]');
                if (window.pageYOffset > delegationPanelEl.offsetTop) {
                    window.scrollTo(0, delegationPanelEl.offsetTop - 15);
                }
            },
            fetchTxs() {
                getAddressTransactionList(this.$route.params.address, this.$route.query)
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
            fetchStakes() {
                getAddressStakeList(this.$route.params.address)
                    .then((stakeList) => {
                        this.stakeList = stakeList;
                        this.isStakeListLoading = false;
                    })
                    .catch(() => {
                        this.isStakeListLoading = false;
                    });
            },
            fetchRewards() {
                getAddressRewardList(this.$route.params.address, {
                    page: this.$route.query.active_tab === TAB_TYPES.REWARD ? this.$route.query.active_tab_page : undefined,
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
            },
            fetchSlashes() {
                getAddressSlashList(this.$route.params.address, {
                    page: this.$route.query.active_tab === TAB_TYPES.SLASH ? this.$route.query.active_tab_page : undefined,
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
                <dd>
                    <table class="table--balance">
                        <tr v-for="balance in balanceList" :key="balance.coin">
                            <td>{{ balance.coin }}</td>
                            <td :title="prettyPrecise(balance.amount)">{{ balance.amount | pretty }}</td>
                        </tr>
                    </table>
                </dd>

<!--
                <dt>USD Value</dt>
                <dd>${{ baseCoin ? baseCoin.usdAmount : 0 | prettyUsd }}</dd>
-->

                <dt>#Transactions</dt>
                <dd>{{ txPaginationInfo.total || 0 }}</dd>
            </dl>
        </section>

        <!-- Delegation -->
        <section class="panel u-section" v-if="stakeList.length || rewardList.length" data-delegation-panel>
            <div class="panel__switcher">
                <button class="panel__switcher-item panel__switcher-item--small panel__title panel__header-title u-semantic-button"
                        :class="{'is-active': activeTab === $options.TAB_TYPES.STAKE}"
                        @click="switchTab($options.TAB_TYPES.STAKE)"
                >
                    <img class="panel__header-title-icon u-hidden-medium-down" src="/img/icon-mining.svg" width="40" height="40" alt="" role="presentation">
                    Delegate
                </button>
                <button class="panel__switcher-item panel__switcher-item--small panel__title panel__header-title u-semantic-button"
                        :class="{'is-active': activeTab === $options.TAB_TYPES.REWARD}"
                        @click="switchTab($options.TAB_TYPES.REWARD)"
                >
                    <img class="panel__header-title-icon u-hidden-medium-down" src="/img/icon-reward.svg" width="40" height="40" alt="" role="presentation">
                    Rewards
                </button>
                <button class="panel__switcher-item panel__switcher-item--small panel__title panel__header-title u-semantic-button"
                        :class="{'is-active': activeTab === $options.TAB_TYPES.SLASH}"
                        @click="switchTab($options.TAB_TYPES.SLASH)"
                >
                    <img class="panel__header-title-icon u-hidden-medium-down" src="/img/icon-slash.svg" width="40" height="40" alt="" role="presentation">
                    Slashes
                </button>
            </div>
            <StakeListTable :stake-list="stakeList" stake-item-type="validator" v-if="activeTab === $options.TAB_TYPES.STAKE"/>
            <RewardSlashListTable :data-list="rewardList" data-type="reward" :is-loading="isRewardListLoading" v-if="activeTab === $options.TAB_TYPES.REWARD"/>
            <RewardSlashListTable :data-list="slashList" data-type="slash" :is-loading="isSlashListLoading" v-if="activeTab === $options.TAB_TYPES.SLASH"/>
        </section>
        <Pagination :pagination-info="activePaginationInfo" :active-tab="activeTab" v-if="activePaginationInfo"/>
        <!-- Delegation Reward Chard-->
        <RewardChart v-show="activeTab === $options.TAB_TYPES.REWARD"/>

        <!-- Transactions -->
        <TransactionList :tx-list="txList" :current-address="$route.params.address" :pagination-info="txPaginationInfo" :is-loading="isTxListLoading"/>
        <Pagination :pagination-info="txPaginationInfo"/>
    </div>
</template>
