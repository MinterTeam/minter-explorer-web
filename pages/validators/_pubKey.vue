<script>
    import {isValidPublicKeyString} from 'minterjs-util/src/prefix';
    import {getValidatorTransactionList, getValidator, getValidatorStakeList, getValidatorPenaltyList} from '~/api/explorer.js';
    import getTitle from '~/assets/get-title';
    import {getErrorText} from '~/assets/server-error';
    import {pretty, prettyPrecise, prettyRound} from '~/assets/utils';
    import {TAB_TYPES, VALIDATOR_STATUS} from '~/assets/variables.js';
    import Amount from '@/components/common/Amount.vue';
    import TransactionListTable from '~/components/TransactionListTable';
    import StakeListTable from '~/components/StakeListTable';
    import PenaltyListTable from '~/components/PenaltyListTable.vue';
    import BackButton from '~/components/BackButton';
    import Pagination from "~/components/Pagination";

    function ensureTab(val) {
        return Object.values(TAB_TYPES).indexOf(val) !== -1 ? val : TAB_TYPES.TX;
    }

    function ensurePage(val) {
        return val > 0 ? val : 1;
    }

    export default {
        ideFix: null,
        TAB_TYPES,
        VALIDATOR_STATUS,
        components: {
            Amount,
            StakeListTable,
            PenaltyListTable,
            TransactionListTable,
            BackButton,
            Pagination,
        },
        filters: {
            pretty,
            prettyPrecise,
            prettyRound,
        },
        // watchQuery: ['page'],
        // key: (to) => to.fullPath,
        asyncData({ params, query, error }) {
            if (!isValidPublicKeyString(params.pubKey)) {
                return error({
                    statusCode: 404,
                    message: 'Invalid public key',
                });
            }

            return getValidator(params.pubKey)
                .then((validator) => {
                    return {
                        validator,
                    };
                })
                .catch((resError) => {
                    console.log(resError);
                    let statusCode = resError.request && resError.request.status;
                    error({
                        statusCode,
                        message: statusCode === 404 ? 'Validator not found' : getErrorText(e),
                    });
                });
        },
        fetch() {
            this.fetchTab(this.$route.query);
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
                /** @type Validator|null */
                validator: null,
                storedTabPages: {},
                // stakes
                stakeList: [],
                stakePaginationInfo: {},
                isStakeListLoading: false,
                isStakeListLoaded: false,
                // penalties
                penaltyList: [],
                penaltyPaginationInfo: {},
                isPenaltyListLoading: false,
                isPenaltyListLoaded: false,
                // txs
                txList: [],
                txPaginationInfo: {},
                isTxListLoading: false,
                isTxListLoaded: false,
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
            activeTab() {
                return ensureTab(this.$route.query.active_tab);
            },
            activePaginationInfo() {
                if (this.activeTab === TAB_TYPES.TX) {
                    return this.txPaginationInfo;
                }
                if (this.activeTab === TAB_TYPES.STAKE) {
                    return this.stakePaginationInfo;
                }
                if (this.activeTab === TAB_TYPES.SLASH) {
                    return this.penaltyPaginationInfo;
                }
                return false;
            },
        },
        methods: {
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

                // update route
                this.$router.replace({
                    // path: this.$route.path,
                    query: {
                        ...this.$route.query,
                        active_tab: newTab,
                        page: newTabPage,
                    },
                });

                // wait for rewards chart to disappear
                // this.$nextTick(this.checkPanelPosition);
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
                    if (this.activeTab === TAB_TYPES.STAKE && !this.isStakeListLoaded) {
                        this.fetchStakes();
                    }
                    if (this.activeTab === TAB_TYPES.SLASH && !this.isPenaltyListLoaded) {
                        this.fetchPenalties();
                    }

                    this.checkPanelPosition();

                    // same tab, new page
                } else if (newTab === oldTab && newPage !== oldPage) {
                    if (this.activeTab === TAB_TYPES.TX) {
                        this.fetchTxs();
                    }
                    if (this.activeTab === TAB_TYPES.STAKE) {
                        this.fetchStakes();
                    }
                    if (this.activeTab === TAB_TYPES.SLASH) {
                        this.fetchPenalties();
                    }

                    this.checkPanelPosition();
                }
            },
            fetchStakes() {
                this.isStakeListLoading = true;
                getValidatorStakeList(this.$route.params.pubKey, this.$route.query)
                    .then((stakeListInfo) => {
                        this.stakeList = stakeListInfo.data;
                        this.stakePaginationInfo = stakeListInfo.meta;
                        this.isStakeListLoading = false;
                        this.isStakeListLoaded = true;
                    })
                    .catch(() => {
                        this.isStakeListLoading = false;
                    });
            },
            fetchPenalties() {
                this.isPenaltyListLoading = true;
                getValidatorPenaltyList(this.$route.params.pubKey, this.$route.query)
                    .then((penaltyListInfo) => {
                        this.penaltyList = penaltyListInfo.data;
                        this.penaltyPaginationInfo = penaltyListInfo.meta;
                        this.isPenaltyListLoading = false;
                        this.isPenaltyListLoaded = true;
                    })
                    .catch(() => {
                        this.isPenaltyListLoading = false;
                    });
            },
            fetchTxs() {
                this.isTxListLoading = true;
                getValidatorTransactionList(this.$route.params.pubKey, this.$route.query)
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
            checkPanelPosition() {
                const panelEl = document.querySelector('[data-tab-panel]');
                if (panelEl && window.pageYOffset > panelEl.offsetTop) {
                    window.scrollTo(0, panelEl.offsetTop - 15);
                }
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
                    <span>Validator overview</span>
                </h1>
            </div>
            <dl>
                <dt>Public Key</dt>
                <dd class="dd u-select-all">{{ $route.params.pubKey }}</dd>

                <dt v-if="validator.name">Name</dt>
                <dd v-if="validator.name">
                    <div class="u-icon-wrap">
                        <img v-if="validator.iconUrl" :src="validator.iconUrl" class="u-icon--coin" width="24" height="24" alt="" role="presentation">
                        {{ validator.name }}
                    </div>
                </dd>

                <dt v-if="validator.description || validator.siteUrl">Description</dt>
                <dd v-if="validator.description || validator.siteUrl">
                    {{ validator.description }} <br v-if="validator.description">
                    <a class="link--main link--hover" :href="validator.siteUrl">{{ validator.siteUrl }}</a>
                </dd>

                <!-- @TODO owner address -->

                <dt>Status</dt>
                <dd>{{ $options.VALIDATOR_STATUS[validator.status || 0] }}</dd>

                <dt>Total stake</dt>
                <Amount :amount="validator.stake" :coin="$store.state.COIN_NAME" tag="dd"/>

                <dt>Voting power</dt>
                <dd>{{ (validator.part || 0) | pretty }}&thinsp;%</dd>

                <dt>Commission</dt>
                <dd>{{ validator.commission }}&thinsp;%</dd>

                <dt>#Delegators</dt>
                <dd>{{ validator.delegatorCount }}</dd>

                <dt>Minimal stake</dt>
                <Amount :amount="validator.minStake" :coin="$store.state.COIN_NAME" tag="dd"/>
            </dl>
        </section>

        <section class="panel u-section" data-tab-panel>
            <div class="panel__switcher">
                <button class="panel__switcher-item panel__switcher-item--small panel__title panel__header-title u-semantic-button"
                        :class="{'is-active': activeTab === $options.TAB_TYPES.TX}"
                        @click="switchTab($options.TAB_TYPES.TX)"
                >
                    <img class="panel__header-title-icon u-hidden-medium-down" src="/img/icon-transaction.svg" width="40" height="40" alt="" role="presentation">
                    Transactions
                </button>
                <button class="panel__switcher-item panel__switcher-item--small panel__title panel__header-title u-semantic-button"
                        :class="{'is-active': activeTab === $options.TAB_TYPES.STAKE}"
                        @click="switchTab($options.TAB_TYPES.STAKE)"
                >
                    <img class="panel__header-title-icon u-hidden-medium-down" src="/img/icon-mining.svg" width="40" height="40" alt="" role="presentation">
                    <span><span class="u-hidden-medium-down">Delegated</span> Stakes</span>
                </button>
                <button class="panel__switcher-item panel__switcher-item--small panel__title panel__header-title u-semantic-button"
                        :class="{'is-active': activeTab === $options.TAB_TYPES.SLASH}"
                        @click="switchTab($options.TAB_TYPES.SLASH)"
                >
                    <img class="panel__header-title-icon u-hidden-medium-down" src="/img/icon-slash.svg" width="40" height="40" alt="" role="presentation">
                    <span>Penalties</span>
                </button>
            </div>
            <!-- Transactions -->
            <TransactionListTable :tx-list="txList" :current-validator="$route.params.pubKey" :is-loading="isTxListLoading" v-if="activeTab === $options.TAB_TYPES.TX"/>
            <!-- Delegation -->
            <StakeListTable :stake-list="stakeList" stake-item-type="delegator" :is-loading="isStakeListLoading" v-if="activeTab === $options.TAB_TYPES.STAKE"/>
            <!-- Penalties -->
            <PenaltyListTable :data-list="penaltyList" item-type="address" :is-loading="isPenaltyListLoading" v-if="activeTab === $options.TAB_TYPES.SLASH"/>
        </section>
        <Pagination class="u-section" :pagination-info="activePaginationInfo" :active-tab="activeTab" v-if="activePaginationInfo"/>

    </div>
</template>
