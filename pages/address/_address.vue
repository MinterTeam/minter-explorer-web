<script>
    import {isValidAddress} from 'minterjs-util/src/prefix';
    import {getBalance, getAddressTransactionList, getAddressStakeList, getAddressRewardAggregatedList, getAddressPenaltyList, getAddressUnbondList, getPoolList, getProviderPoolList, getAddressOrderList} from '~/api/explorer.js';
    import {getNonce} from '~/api/gate';
    import getTitle from '~/assets/get-title';
    import {getErrorText} from '~/assets/server-error';
    import {pretty, prettyPrecise, prettyUsd} from "~/assets/utils";
    import {TAB_TYPES} from '~/assets/variables';
    import QrcodeVue from 'qrcode.vue';
    import InlineSvg from 'vue-inline-svg';
    import ButtonCopyIcon from '~/components/common/ButtonCopyIcon';
    import Modal from '~/components/common/Modal';
    import TransactionListTable from '~/components/TransactionListTable';
    import PoolProviderList from '@/components/PoolProviderList.vue';
    import PoolOrderList from '@/components/PoolOrderList.vue';
    import StakeListTable from '~/components/StakeListTable';
    import RewardListTable from '~/components/RewardListTable.vue';
    import PenaltyListTable from '~/components/PenaltyListTable.vue';
    import UnbondListTable from '~/components/UnbondListTable';
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

    const STABLE_LIST = [
        'USDT',
        'USDC',
        'BUSD',
        'DAI',
        'UST',
        'PAX',
        'TUSD',
        'HUSD',
    ];
    function isStableCoin(symbol) {
        return STABLE_LIST.some((stableName) => new RegExp(`^${stableName}`).test(symbol));
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
            PoolProviderList,
            PoolOrderList,
            StakeListTable,
            RewardListTable,
            PenaltyListTable,
            UnbondListTable,
            RewardChart,
            BackButton,
            Pagination,
        },
        filters: {
            pretty,
            prettyUsd,
        },
        // watchQuery: ['page', 'active_tab_page'],
        // key: (to) => to.fullPath,
        asyncData({ params, store, error }) {
            if (!isValidAddress(params.address)) {
                return error({
                    statusCode: 404,
                    message: 'Invalid address',
                });
            }

            const balancePromise = getBalance(params.address);

            return balancePromise
                .then((balanceData) => {
                    return {
                        balanceList: balanceData.balances,
                        balanceTotal: balanceData.totalBalanceSum,
                        balanceTotalUsd: balanceData.totalBalanceSumUsd,

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
        fetch() {
            this.fetchTab(this.$route.query);
            getNonce(this.$route.params.address)
                .then((nonce) => {
                    this.nonce = nonce.toString();
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
                balanceTotal: '',
                balanceTotalUsd: '',
                storedTabPages: {},
                // txs
                txList: [],
                txPaginationInfo: {},
                isTxListLoading: false,
                isTxListLoaded: false,
                // failed txs
                failedTxList: [],
                failedTxPaginationInfo: {},
                isFailedTxListLoading: false,
                isFailedTxListLoaded: false,
                // provider pools
                poolList: [],
                poolPaginationInfo: {},
                isPoolListLoading: false,
                isPoolListLoaded: false,
                // limit orders
                orderList: [],
                orderPaginationInfo: {},
                isOrderListLoading: false,
                isOrderListLoaded: false,
                // stakes
                stakeList: [],
                isStakeListLoading: false,
                isStakeListLoaded: false,
                // rewards
                rewardList: [],
                rewardPaginationInfo: {},
                isRewardListLoading: false,
                isRewardListLoaded: false,
                // slashes
                slashList: [],
                slashPaginationInfo: {},
                isSlashListLoading: false,
                isSlashListLoaded: false,
                // unbonds
                unbondList: [],
                // unbondPaginationInfo: {},
                isUnbondListLoading: false,
                isUnbondListLoaded: false,
                nonce: '',
                isNonceQrModalVisible: false,
                isAddressQrModalVisible: false,
            };
        },
        watch: {
            //@TODO handle multiple page change
            // update data on page change
            '$route.query': {
                handler(newVal, oldVal) {
                    this.fetchTab(newVal, oldVal);
                },
            },
        },
        computed: {
            balanceListFormatted() {
                return this.balanceList
                    .map((item) => {
                        if (isStableCoin(item.coin.symbol)) {
                            item.usdAmount = 0;
                        } else {
                            item.usdAmount = item.bipAmount * this.$store.getters['explorer/bipPriceUsd'];
                        }
                        return item;
                    });
            },
            activeTab() {
                return ensureTab(this.$route.query.active_tab);
            },
            activePaginationInfo() {
                if (this.activeTab === TAB_TYPES.TX) {
                    return this.txPaginationInfo;
                }
                if (this.activeTab === TAB_TYPES.PROVIDER) {
                    return this.providerPaginationInfo;
                }
                if (this.activeTab === TAB_TYPES.ORDER) {
                    return this.orderPaginationInfo;
                }
                if (this.activeTab === TAB_TYPES.REWARD) {
                    return this.rewardPaginationInfo;
                }
                if (this.activeTab === TAB_TYPES.SLASH) {
                    return this.slashPaginationInfo;
                }
                if (this.activeTab === TAB_TYPES.UNBOND) {
                    return null;
                    // return this.unbondPaginationInfo;
                }
                return false;
            },
        },
        methods: {
            pretty,
            prettyPrecise,
            getCoinIconUrl(coin) {
                return this.$store.getters['explorer/getCoinIcon'](coin);
            },
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
                    active_tab: undefined, // fix: uncaught exception: Object
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
                const panelEl = document.querySelector('[data-tab-panel]');
                if (panelEl && window.pageYOffset > panelEl.offsetTop) {
                    window.scrollTo(0, panelEl.offsetTop - 15);
                }
            },
            fetchTab(newQuery, oldQuery) {
                const oldTab = oldQuery ? ensureTab(oldQuery.active_tab) : undefined;
                const newTab = ensureTab(newQuery.active_tab);
                const oldPage = oldQuery ? ensurePage(oldQuery.page) : undefined;
                const newPage = ensurePage(newQuery.page);

                // new tab
                if (newTab !== oldTab) {
                    if (this.activeTab === TAB_TYPES.TX && !this.isTxListLoaded) {
                        this.fetchTxs();
                    }
                    if (this.activeTab === TAB_TYPES.FAILED_TX && !this.isFailedTxListLoaded) {
                        this.fetchFailedTxs();
                    }
                    if (this.activeTab === TAB_TYPES.PROVIDER && !this.isPoolListLoaded) {
                        this.fetchProviderList();
                    }
                    if (this.activeTab === TAB_TYPES.ORDER && !this.isOrderListLoaded) {
                        this.fetchLimitOrderList();
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
                    if (this.activeTab === TAB_TYPES.UNBOND && !this.isUnbondListLoaded) {
                        this.fetchUnbonds();
                    }

                    this.checkPanelPosition();

                    // same tab, new page
                } else if (newTab === oldTab && newPage !== oldPage) {
                    if (this.activeTab === TAB_TYPES.TX) {
                        this.fetchTxs();
                    }
                    if (this.activeTab === TAB_TYPES.FAILED_TX) {
                        this.fetchFailedTxs();
                    }
                    if (this.activeTab === TAB_TYPES.PROVIDER) {
                        this.fetchProviderList();
                    }
                    if (this.activeTab === TAB_TYPES.ORDER) {
                        this.fetchLimitOrderList();
                    }
                    if (this.activeTab === TAB_TYPES.REWARD) {
                        this.fetchRewards();
                    }
                    if (this.activeTab === TAB_TYPES.SLASH) {
                        this.fetchSlashes();
                    }
                    if (this.activeTab === TAB_TYPES.UNBOND) {
                        this.fetchUnbonds();
                    }

                    this.checkPanelPosition();
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
            fetchFailedTxs() {
                this.isFailedTxListLoading = true;
                getAddressTransactionList(this.$route.params.address, {...this.$route.query, type: 'failed'})
                    .then((txListInfo) => {
                        this.failedTxList = txListInfo.data;
                        this.failedtxPaginationInfo = txListInfo.meta;
                        this.isFailedTxListLoading = false;
                        this.isFailedTxListLoaded = true;
                    })
                    .catch(() => {
                        this.isFailedTxListLoading = false;
                    });
            },
            fetchProviderList() {
                this.isPoolListLoading = true;
                return Promise.all([
                        getProviderPoolList(this.$route.params.address, this.$route.query),
                        getPoolList({provider: this.$route.params.address, limit: 1000}),
                    ])
                    .then(([providerListInfo, poolListInfo]) => {
                        let volumeMap = {};
                        poolListInfo.data.forEach((item) => {
                            volumeMap[item.token.symbol] = item;
                        });
                        this.poolList = providerListInfo.data.map((item) => {
                            // copy trade volume from pool info
                            item.tradeVolumeBip1D = volumeMap[item.token.symbol]?.tradeVolumeBip1D || 0;
                            item.totalLiquidityBip = volumeMap[item.token.symbol]?.liquidityBip || 0;
                            return item;
                        });
                        this.poolPaginationInfo = providerListInfo.meta;
                        this.isPoolListLoading = false;
                        this.isPoolListLoaded = true;
                    })
                    .catch((error) => {
                        console.log(error);
                        this.isPoolListLoading = false;
                    });
            },
            fetchLimitOrderList() {
                this.isOrderListLoading = true;
                getAddressOrderList(this.$route.params.address, this.$route.query)
                    .then((orderListInfo) => {
                        this.orderList = orderListInfo.data;
                        this.orderPaginationInfo = orderListInfo.meta;
                        this.isOrderListLoading = false;
                        this.isOrderListLoaded = true;
                    })
                    .catch(() => {
                        this.isOrderListLoading = false;
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
                getAddressPenaltyList(this.$route.params.address, this.$route.query)
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
            fetchUnbonds() {
                this.isUnbondListLoading = true;
                getAddressUnbondList(this.$route.params.address, this.$route.query)
                    .then((unbondList) => {
                        this.unbondList = unbondList;
                        // this.unbondPaginationInfo = unbondListInfo.meta;
                        this.isUnbondListLoading = false;
                        this.isUnbondListLoaded = true;
                    })
                    .catch(() => {
                        this.isUnbondListLoading = false;
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
                <dd>
                    <span class="u-select-all">{{ $route.params.address }}</span>
                    <ButtonCopyIcon :copy-text="$route.params.address"/>
                    <button class="u-icon u-icon--qr--right u-semantic-button link--opacity" @click="isAddressQrModalVisible = true">
                        <InlineSvg src="/img/icon-qr.svg" width="24" height="24"/>
                    </button>
                </dd>

                <dt>Balance</dt>
                <dd>
                    <table class="table--balance">
                        <tr v-for="balance in balanceListFormatted" :key="balance.coin.id">
                            <td>
                                <span class="u-icon-wrap">
                                    <img class="u-icon--coin" :src="getCoinIconUrl(balance.coin.symbol)" width="20" height="20" alt="" role="presentation">
                                    {{ balance.coin.symbol }}
                                    <img class="u-icon--verified" src="/img/icon-verified.svg" width="12" height="12" alt="" role="presentation" v-if="balance.coin.verified">
                                </span>
                            </td>
                            <td :title="prettyPrecise(balance.amount)">
                                {{ pretty(balance.amount) }}
                                <span class="u-text-muted" v-if="balance.usdAmount">
                                    (${{ pretty(balance.usdAmount) }})
                                </span>
                            </td>
                        </tr>
                    </table>
                </dd>

                <dt>Total</dt>
                <dd>
                    <span :title="prettyPrecise(balanceTotal)">{{ $store.getters.COIN_NAME }} {{ balanceTotal | pretty }}</span> <br>
                    <span class="u-text-muted">${{ balanceTotalUsd | prettyUsd }}</span>
                </dd>

                <dt>#Transactions</dt>
                <dd>{{ txPaginationInfo.total || 0 }}</dd>
                <dt>Nonce for tx</dt>
                <dd class="dd u-icon-wrap">
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
                    <img class="panel__header-title-icon u-hidden-large-down" src="/img/icon-transaction.svg" width="40" height="40" alt="" role="presentation">
                    Txs
                </button>
                <button class="panel__switcher-item panel__switcher-item--small panel__title panel__header-title u-semantic-button"
                        :class="{'is-active': activeTab === $options.TAB_TYPES.PROVIDER}"
                        @click="switchTab($options.TAB_TYPES.PROVIDER)"
                >
                    <img class="panel__header-title-icon u-hidden-large-down" src="/img/icon-pool.svg" width="40" height="40" alt="" role="presentation">
                    Pools
                </button>
                <button class="panel__switcher-item panel__switcher-item--small panel__title panel__header-title u-semantic-button"
                        :class="{'is-active': activeTab === $options.TAB_TYPES.ORDER}"
                        @click="switchTab($options.TAB_TYPES.ORDER)"
                >
                    <img class="panel__header-title-icon u-hidden-large-down" src="/img/icon-limit-order.svg" width="40" height="40" alt="" role="presentation">
                    Orders
                </button>
                <button class="panel__switcher-item panel__switcher-item--small panel__title panel__header-title u-semantic-button"
                        :class="{'is-active': activeTab === $options.TAB_TYPES.STAKE}"
                        @click="switchTab($options.TAB_TYPES.STAKE)"
                >
                    <img class="panel__header-title-icon u-hidden-large-down" src="/img/icon-mining.svg" width="40" height="40" alt="" role="presentation">
                    Stakes
                </button>
                <button class="panel__switcher-item panel__switcher-item--small panel__title panel__header-title u-semantic-button"
                        :class="{'is-active': activeTab === $options.TAB_TYPES.REWARD}"
                        @click="switchTab($options.TAB_TYPES.REWARD)"
                >
                    <img class="panel__header-title-icon u-hidden-large-down" src="/img/icon-reward.svg" width="40" height="40" alt="" role="presentation">
                    Rewards
                </button>
                <button class="panel__switcher-item panel__switcher-item--small panel__title panel__header-title u-semantic-button"
                        :class="{'is-active': activeTab === $options.TAB_TYPES.SLASH}"
                        @click="switchTab($options.TAB_TYPES.SLASH)"
                >
                    <img class="panel__header-title-icon u-hidden-large-down" src="/img/icon-slash.svg" width="40" height="40" alt="" role="presentation">
                    Penalties
                </button>
                <button class="panel__switcher-item panel__switcher-item--small panel__title panel__header-title u-semantic-button"
                        :class="{'is-active': activeTab === $options.TAB_TYPES.FAILED_TX}"
                        @click="switchTab($options.TAB_TYPES.FAILED_TX)"
                >
                    <img class="panel__header-title-icon u-hidden-large-down" src="/img/icon-transaction.svg" width="40" height="40" alt="" role="presentation">
                    Failed txs
                </button>
                <button class="panel__switcher-item panel__switcher-item--small panel__title panel__header-title u-semantic-button"
                        :class="{'is-active': activeTab === $options.TAB_TYPES.UNBOND}"
                        @click="switchTab($options.TAB_TYPES.UNBOND)"
                >
                    <img class="panel__header-title-icon u-hidden-large-down" src="/img/icon-unbond.svg" width="40" height="40" alt="" role="presentation">
                    Unbonds
                </button>
            </div>
            <!-- Transactions -->
            <TransactionListTable :tx-list="txList" :current-address="$route.params.address" :is-loading="isTxListLoading" v-if="activeTab === $options.TAB_TYPES.TX"/>
            <!-- Failed Transactions -->
            <TransactionListTable
                :tx-list="failedTxList"
                :current-address="$route.params.address"
                :is-loading="isFailedTxListLoading"
                v-if="activeTab === $options.TAB_TYPES.FAILED_TX"
            />
            <!-- Provider pools -->
            <PoolProviderList
                v-if="activeTab === $options.TAB_TYPES.PROVIDER"
                :provider-list="poolList"
                item-type="pool"
                :is-loading="isPoolListLoading"
            />
            <!-- Limit orders -->
            <PoolOrderList
                v-if="activeTab === $options.TAB_TYPES.ORDER"
                :order-list="orderList"
                item-type="pool"
                :is-loading="isOrderListLoading"
            />
            <!-- Delegation -->
            <StakeListTable :stake-list="stakeList" stake-item-type="validator" :is-loading="isStakeListLoading" v-if="activeTab === $options.TAB_TYPES.STAKE"/>
            <RewardListTable :data-list="rewardList" :is-loading="isRewardListLoading" v-if="activeTab === $options.TAB_TYPES.REWARD"/>
            <PenaltyListTable :data-list="slashList" :is-loading="isSlashListLoading" v-if="activeTab === $options.TAB_TYPES.SLASH"/>
            <UnbondListTable :data-list="unbondList" :is-loading="isUnbondListLoading" v-if="activeTab === $options.TAB_TYPES.UNBOND"/>
        </section>
        <Pagination :pagination-info="activePaginationInfo" :active-tab="activeTab" v-if="activePaginationInfo"/>
        <!-- Delegation Reward Chard-->
        <keep-alive>
            <RewardChart v-if="activeTab === $options.TAB_TYPES.REWARD && rewardList.length"/>
        </keep-alive>


        <Modal class="qr-modal"
               v-bind:isOpen.sync="isNonceQrModalVisible"
        >
            <QrcodeVue class="qr-modal__layer" :value="nonce" :size="280" level="L"></QrcodeVue>
        </Modal>
        <Modal class="qr-modal"
               v-bind:isOpen.sync="isAddressQrModalVisible"
        >
            <QrcodeVue class="qr-modal__layer" :value="$route.params.address" :size="280" level="L"></QrcodeVue>
        </Modal>
    </div>
</template>
