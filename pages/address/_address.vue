<script>
    import {isValidAddress} from 'minterjs-util/src/prefix';
    import {getBalance, getBalanceLock, getAddressTransactionList, getAddressStake, getAddressRewardAggregatedList, getAddressPenaltyList, getAddressStakeLockList, getPoolList, getProviderPoolList, getAddressOrderList, checkBlockTime} from '~/api/explorer.js';
    import {getNonce} from '~/api/gate';
    import getTitle from '~/assets/get-title';
    import {getErrorText} from '~/assets/server-error';
    import {pretty, prettyPrecise, prettyUsd} from "~/assets/utils";
    import {TAB_TYPES} from '~/assets/variables';
    import QrcodeVue from 'qrcode.vue';
    import InlineSvg from 'vue-inline-svg';
    import ButtonCopyIcon from '~/components/common/ButtonCopyIcon';
    import Modal from '~/components/common/Modal';
    import TabSwitcher from '~/components/common/TabSwitcher.vue';
    import TransactionListTable from '~/components/TransactionListTable';
    import PoolProviderList from '@/components/PoolProviderList.vue';
    import PoolOrderList from '@/components/PoolOrderList.vue';
    import StakeListTable from '~/components/StakeListTable';
    import RewardListTable from '~/components/RewardListTable.vue';
    import PenaltyListTable from '~/components/PenaltyListTable.vue';
    import StakeLockListTable from '~/components/StakeLockListTable.vue';
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
            TabSwitcher,
            TransactionListTable,
            PoolProviderList,
            PoolOrderList,
            StakeListTable,
            RewardListTable,
            PenaltyListTable,
            StakeLockListTable,
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

            getBalanceLock(this.$route.params.address, {squashKeep: 'coin'})
                .then((lockList) => {
                    this.balanceLockList = lockList;
                });

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
                balanceLockList: [],
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
                unbondLock: null,
                unbondLockEndTimestamp: '',
                totalDelegatedBipValue: 0,
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
                // stake locks
                stakeLockList: [],
                // stakeLockPaginationInfo: {},
                isStakeLockListLoading: false,
                isStakeLockListLoaded: false,
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
                if (this.activeTab === TAB_TYPES.STAKE_LOCK) {
                    return null;
                    // return this.stakeLockPaginationInfo;
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
                    if (this.activeTab === TAB_TYPES.STAKE_LOCK && !this.isStakeLockListLoaded) {
                        this.fetchStakeLocks();
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
                    if (this.activeTab === TAB_TYPES.STAKE_LOCK) {
                        this.fetchStakeLocks();
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
                getAddressStake(this.$route.params.address)
                    .then((stakeData) => {
                        this.stakeList = stakeData.list;
                        this.unbondLock = stakeData.lock;
                        this.totalDelegatedBipValue = stakeData.totalDelegatedBipValue;
                        this.isStakeListLoading = false;
                        this.isStakeListLoaded = true;

                        if (stakeData.lock.endBlock) {
                            checkBlockTime(stakeData.lock.endBlock)
                                .then((blockTimeInfo) => {
                                    this.unbondLockEndTimestamp = blockTimeInfo.timestamp;
                                })
                                .catch((error) => {
                                    console.log(error);
                                });
                        }
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
            fetchStakeLocks() {
                this.isStakeLockListLoading = true;
                getAddressStakeLockList(this.$route.params.address, this.$route.query)
                    .then((stakeLockList) => {
                        this.stakeLockList = stakeLockList;
                        // this.stakeLockPaginationInfo = stakeLockListInfo.meta;
                        this.isStakeLockListLoading = false;
                        this.isStakeLockListLoaded = true;
                    })
                    .catch(() => {
                        this.isStakeLockListLoading = false;
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

                <dt>Total available</dt>
                <dd>
                    <span :title="prettyPrecise(balanceTotal)">{{ $store.getters.COIN_NAME }} {{ balanceTotal | pretty }}</span> <br>
                    <span class="u-text-muted">${{ balanceTotalUsd | prettyUsd }}</span>
                </dd>

                <dt>Locked balance</dt>
                <dd>
                    <table class="table--balance" v-if="balanceLockList.length">
                        <tr v-for="balance in balanceLockList" :key="balance.coin.id">
                            <td>
                                <span class="u-icon-wrap">
                                    <img class="u-icon--coin" :src="getCoinIconUrl(balance.coin.symbol)" width="20" height="20" alt="" role="presentation">
                                    {{ balance.coin.symbol }}
                                    <img class="u-icon--verified" src="/img/icon-verified.svg" width="12" height="12" alt="" role="presentation" v-if="balance.coin.verified">
                                </span>
                            </td>
                            <td :title="prettyPrecise(balance.value)">
                                {{ pretty(balance.value) }}
                            </td>
                        </tr>
                    </table>
                    <span class="u-text-muted" v-else>—</span>
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
            <TabSwitcher :tabs="[
                {
                    caption: 'Txs',
                    iconName: 'transaction',
                    isGroup: true,
                    tabs: [
                        {
                            slug: $options.TAB_TYPES.TX,
                            caption: 'Successful',
                        },
                        {
                            slug: $options.TAB_TYPES.FAILED_TX,
                            caption: 'Failed',
                        },
                    ]
                },
                {
                    slug: $options.TAB_TYPES.PROVIDER,
                    caption: 'Pools',
                    iconName: 'pool',
                },
                {
                    slug: $options.TAB_TYPES.ORDER,
                    caption: 'Orders',
                    iconName: 'limit-order',
                },
                {
                    caption: 'Stakes',
                    iconName: 'mining',
                    isGroup: true,
                    tabs: [
                        {
                            slug: $options.TAB_TYPES.STAKE,
                            caption: 'Delegated',
                        },
                        {
                            slug: $options.TAB_TYPES.STAKE_LOCK,
                            caption: 'Locked',
                            // iconName: 'unbond',
                        },
                        {
                            slug: $options.TAB_TYPES.REWARD,
                            caption: 'Rewards',
                            // iconName: 'reward',
                        },
                        {
                            slug: $options.TAB_TYPES.SLASH,
                            caption: 'Penalties',
                            // iconName: 'slash',
                        },
                    ]
                },
            ]"/>
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
            <StakeListTable
                :stake-list="stakeList"
                stake-item-type="validator"
                :total-delegated-bip-value="totalDelegatedBipValue"
                :lock="unbondLock"
                :lock-end-timestamp="unbondLockEndTimestamp"
                :is-loading="isStakeListLoading"
                v-if="activeTab === $options.TAB_TYPES.STAKE"
            />
            <RewardListTable :data-list="rewardList" :is-loading="isRewardListLoading" v-if="activeTab === $options.TAB_TYPES.REWARD"/>
            <PenaltyListTable :data-list="slashList" :is-loading="isSlashListLoading" v-if="activeTab === $options.TAB_TYPES.SLASH"/>
            <StakeLockListTable :data-list="stakeLockList" :is-loading="isStakeLockListLoading" v-if="activeTab === $options.TAB_TYPES.STAKE_LOCK"/>
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
