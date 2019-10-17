<script>
    import {isValidAddress} from 'minterjs-util/src/prefix';
    import {getBalance, getAddressTransactionList, getAddressStakeList, getAddressRewardAggregatedList, getAddressSlashList} from "~/api";
    import {getNonce} from '~/api/gate';
    import getTitle from '~/assets/get-title';
    import {getErrorText} from '~/assets/server-error';
    import {pretty, prettyPrecise} from "~/assets/utils";
    import {TAB_TYPES} from '~/assets/variables';
    import QrcodeVue from 'qrcode.vue';
    import InlineSvg from 'vue-inline-svg';
    import ButtonCopyIcon from '~/components/common/ButtonCopyIcon';
    import Modal from '~/components/common/Modal';
    import TransactionListTable from '~/components/TransactionListTable';
    import StakeListTable from '~/components/StakeListTable';
    import RewardSlashListTable from '~/components/RewardSlashListTable';
    import RewardChart from '~/components/RewardChart';
    import BackButton from '~/components/BackButton';
    import Pagination from "~/components/Pagination";

    const DEFAULT_TAB = TAB_TYPES.TX;

    function ensureTab(val) {
        return Object.values(TAB_TYPES).indexOf(val) !== -1 ? val : DEFAULT_TAB;
    }
    function ensurePage(val) {
        return val > 0 ? val : 1;
    }

    export default {
        ideFix: null,
        TAB_TYPES,
        components: {
            QrcodeVue,
            InlineSvg,
            ButtonCopyIcon,
            Modal,
            TransactionListTable,
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
        asyncData({ params, query, error }) {
            if (!isValidAddress(params.address)) {
                return error({
                    statusCode: 404,
                    message: 'Invalid address',
                });
            }

            const balancePromise = getBalance(params.address);
            // txList always needed for tx count
            const txListPromise = getAddressTransactionList(params.address, query);

            const activeTab = ensureTab(query.active_tab);
            let tabPromise;
            if (activeTab === TAB_TYPES.STAKE) {
                tabPromise = getAddressStakeList(params.address);
            } else if (activeTab === TAB_TYPES.REWARD) {
                tabPromise = getAddressRewardAggregatedList(params.address, query);
            } else if (activeTab === TAB_TYPES.SLASH) {
                tabPromise = getAddressSlashList(params.address, query);
            }

            return Promise.all([balancePromise, txListPromise, tabPromise])
                .then(([balanceList, txListData, tabData]) => {
                    let tabResult;
                    if (activeTab === TAB_TYPES.STAKE) {
                        tabResult = {
                            stakeList: tabData,
                            isStakeListLoaded: true,
                        };
                    } else if (activeTab === TAB_TYPES.REWARD) {
                        tabResult = {
                            rewardList: tabData.data,
                            rewardPaginationInfo: tabData.meta,
                            isRewardListLoaded: true,
                        };
                    } else if (activeTab === TAB_TYPES.SLASH) {
                        tabResult = {
                            slashList: tabData.data,
                            slashPaginationInfo: tabData.meta,
                            isSlashListLoaded: true,
                        };
                    }

                    return {
                        ...tabResult,
                        txList: txListData.data,
                        txPaginationInfo:  txListData.meta,
                        isTxListLoaded: true,
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
                storedTabPages: {},
                txList: [],
                txPaginationInfo: {},
                isTxListLoading: false,
                isTxListLoaded: false,
                stakeList: [],
                isStakeListLoading: false,
                isStakeListLoaded: false,
                rewardList: [],
                rewardPaginationInfo: {},
                isRewardListLoading: false,
                isRewardListLoaded: false,
                slashList: [],
                slashPaginationInfo: {},
                isSlashListLoading: false,
                isSlashListLoaded: false,
                nonce: '',
                isNonceQrModalVisible: false,
            };
        },
        watch: {
            //@TODO handle multiple page change
            // update data on page change
            '$route.query': {
                handler(newVal, oldVal) {
                    const oldTab = ensureTab(oldVal.active_tab);
                    const newTab = ensureTab(newVal.active_tab);
                    const oldPage = ensurePage(oldVal.page);
                    const newPage = ensurePage(newVal.page);

                    // new tab
                    if (newTab !== oldTab) {
                        if (this.activeTab === TAB_TYPES.TX && !this.isTxListLoaded) {
                            this.fetchTxs();
                        }
                        if (this.activeTab === TAB_TYPES.STAKE && !this.isStakeListLoaded) {
                            this.fetchStakes();
                        }
                        if (this.activeTab === TAB_TYPES.REWARD && !this.isRewardListLoaded) {
                            this.fetchRewards();
                        }
                        if (this.activeTab === TAB_TYPES.SLASH && !this.isSlashListLoaded) {
                            this.fetchSlashes();
                        }

                        this.checkPanelPosition();

                    // same tab, new page
                    } else if (newTab === oldTab && newPage !== oldPage) {
                        if (this.activeTab === TAB_TYPES.TX) {
                            this.fetchTxs();
                        }
                        if (this.activeTab === TAB_TYPES.REWARD) {
                            this.fetchRewards();
                        }
                        if (this.activeTab === TAB_TYPES.SLASH) {
                            this.fetchSlashes();
                        }

                        this.checkPanelPosition();
                    }
                },
            },
        },
        computed: {
            activeTab() {
                return ensureTab(this.$route.query.active_tab);
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
                return false;
            },
        },
        mounted() {
            getNonce(this.$route.params.address)
                .then((nonce) => {
                    this.nonce = nonce.toString();
                });
        },
        methods: {
            prettyPrecise,
            switchTab(newTab) {
                // save previous page
                if (this.$route.query.active_tab) {
                    this.storedTabPages[this.$route.query.active_tab] = this.$route.query.page;
                }
                // restore saved page
                let newTabPage;
                if (this.storedTabPages[newTab]) {
                    newTabPage = this.storedTabPages[newTab];
                }

                let newQuery = {
                    page: newTabPage,
                };
                if (newTab !== DEFAULT_TAB) {
                    newQuery.active_tab = newTab;
                }

                // update route
                this.$router.replace({
                    // path: this.$route.path,
                    query: newQuery,
                });

                // wait for rewards chart to disappear
                this.$nextTick(this.checkPanelPosition);
            },
            checkPanelPosition() {
                const delegationPanelEl = document.querySelector('[data-tab-panel]');
                if (window.pageYOffset > delegationPanelEl.offsetTop) {
                    window.scrollTo(0, delegationPanelEl.offsetTop - 15);
                }
            },
            fetchTxs() {
                this.isTxListLoading = true;
                getAddressTransactionList(this.$route.params.address, this.$route.query)
                    .then((txListInfo) => {
                        this.txList = txListInfo.data;
                        this.txPaginationInfo = txListInfo.meta;
                        this.isTxListLoading = false;
                        this.isTxListLoaded = true;
                    })
                    .catch(() => {
                        this.isTxListLoading = false;
                    });
            },
            fetchStakes() {
                this.isStakeListLoading = true;
                getAddressStakeList(this.$route.params.address)
                    .then((stakeList) => {
                        this.stakeList = stakeList;
                        this.isStakeListLoading = false;
                        this.isStakeListLoaded = true;
                    })
                    .catch(() => {
                        this.isStakeListLoading = false;
                    });
            },
            fetchRewards() {
                this.isRewardListLoading = true;
                getAddressRewardAggregatedList(this.$route.params.address, this.$route.query)
                    .then((rewardListInfo) => {
                        this.rewardList = rewardListInfo.data;
                        this.rewardPaginationInfo = rewardListInfo.meta;
                        this.isRewardListLoading = false;
                        this.isRewardListLoaded = true;
                    })
                    .catch(() => {
                        this.isRewardListLoading = false;
                    });
            },
            fetchSlashes() {
                this.isSlashListLoading = true;
                getAddressSlashList(this.$route.params.address, this.$route.query)
                .then((slashListInfo) => {
                    this.slashList = slashListInfo.data;
                    this.slashPaginationInfo = slashListInfo.meta;
                    this.isSlashListLoading = false;
                    this.isSlashListLoaded = true;
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

                <dt>#Transactions</dt>
                <dd>{{ txPaginationInfo.total || 0 }}</dd>
                <dt>Nonce for tx</dt>
                <dd class="u-icon-wrap">
                    <template v-if="nonce">
                        {{ nonce }}
                        <ButtonCopyIcon :copy-text="nonce"/>
                        <button class="u-icon u-icon--qr--right u-semantic-button link--opacity" @click="isNonceQrModalVisible = true">
                            <InlineSvg src="/img/icon-qr.svg" width="24" height="24"/>
                        </button>
                    </template>
                </dd>
            </dl>
        </section>

        <section class="panel u-section" data-tab-panel>
            <div class="panel__switcher">
                <button class="panel__switcher-item panel__switcher-item--small panel__title panel__header-title u-semantic-button"
                        :class="{'is-active': activeTab === $options.TAB_TYPES.TX}"
                        @click="switchTab($options.TAB_TYPES.TX)"
                >
                    <img class="panel__header-title-icon u-hidden-medium-down" src="/img/icon-transaction.svg" width="40" height="40" alt="" role="presentation">
                    <span class="u-hidden-medium-down">Transactions</span>
                    <span class="u-hidden-medium-up">Txs</span>
                </button>
                <button class="panel__switcher-item panel__switcher-item--small panel__title panel__header-title u-semantic-button"
                        :class="{'is-active': activeTab === $options.TAB_TYPES.STAKE}"
                        @click="switchTab($options.TAB_TYPES.STAKE)"
                >
                    <img class="panel__header-title-icon u-hidden-medium-down" src="/img/icon-mining.svg" width="40" height="40" alt="" role="presentation">
                    Stakes
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
            <!-- Transactions -->
            <TransactionListTable :tx-list="txList" :current-address="$route.params.address" :is-loading="isTxListLoading" v-if="activeTab === $options.TAB_TYPES.TX"/>
            <!-- Delegation -->
            <StakeListTable :stake-list="stakeList" stake-item-type="validator" :is-loading="isStakeListLoading" v-if="activeTab === $options.TAB_TYPES.STAKE"/>
            <RewardSlashListTable :data-list="rewardList" data-type="reward" :is-loading="isRewardListLoading" v-if="activeTab === $options.TAB_TYPES.REWARD"/>
            <RewardSlashListTable :data-list="slashList" data-type="slash" :is-loading="isSlashListLoading" v-if="activeTab === $options.TAB_TYPES.SLASH"/>
        </section>
        <Pagination :pagination-info="activePaginationInfo" :active-tab="activeTab" v-if="activePaginationInfo"/>
        <!-- Delegation Reward Chard-->
        <RewardChart v-show="activeTab === $options.TAB_TYPES.REWARD && rewardList.length"/>


        <Modal class="qr-modal"
               v-bind:isOpen.sync="isNonceQrModalVisible"
        >
            <QrcodeVue class="qr-modal__layer" :value="nonce" :size="280" level="L"></QrcodeVue>
        </Modal>
    </div>
</template>
