<script>
    import {isValidPublicKeyString} from 'minterjs-util/src/prefix';
    import {getValidatorTransactionList, getValidator} from "~/api";
    import getTitle from '~/assets/get-title';
    import {getErrorText} from '~/assets/server-error';
    import {pretty, prettyPrecise, prettyRound} from '~/assets/utils';
    import {TAB_TYPES} from '~/assets/variables';
    import TransactionListTable from '~/components/TransactionListTable';
    import StakeListTable from '~/components/StakeListTable';
    import BackButton from '~/components/BackButton';
    import Pagination from "~/components/Pagination";

    const VALIDATOR_STATUS = {
        0: 'Not declared',
        1: 'Set off',
        2: 'Set on',
    };

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
            StakeListTable,
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

            const validatorPromise = getValidator(params.pubKey);
            const txListPromise = getValidatorTransactionList(params.pubKey, query);

            return Promise.all([validatorPromise, txListPromise])
                .then(([validator, txListInfo]) => {
                    return {
                        validator,
                        txList: txListInfo.data,
                        txPaginationInfo: txListInfo.meta,
                    };
                })
                .catch((e) => {
                    console.log({e});
                    let statusCode = e.request && e.request.status;
                    error({
                        statusCode,
                        message: statusCode === 404 ? 'Validator not found' : getErrorText(e),
                    });
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
                /** @type Validator|null */
                validator: null,
                storedTabPages: {},
                txList: [],
                txPaginationInfo: {},
                isTxListLoading: false,
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

                    if (newTab === oldTab && oldPage !== newPage) {
                        if (this.activeTab === TAB_TYPES.TX) {
                            this.fetchTxs();
                        }
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
            fetchTxs() {
                this.isTxListLoading = true;
                getValidatorTransactionList(this.$route.params.pubKey, this.$route.query)
                    .then((txListInfo) => {
                        this.txList = txListInfo.data;
                        this.txPaginationInfo = txListInfo.meta;
                        this.isTxListLoading = false;
                    })
                    .catch(() => {
                        this.isTxListLoading = false;
                    });
            },
            // checkPanelPosition() {
            //     const delegationPanelEl = document.querySelector('[data-tab-panel]');
            //     if (window.pageYOffset > delegationPanelEl.offsetTop) {
            //         window.scrollTo(0, delegationPanelEl.offsetTop - 15);
            //     }
            // },
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

                <dt v-if="validator.meta && validator.meta.name">Name</dt>
                <dd v-if="validator.meta && validator.meta.name">{{ validator.meta.name }}</dd>

                <dt v-if="validator.meta && (validator.meta.description || validator.meta.siteUrl)">Description</dt>
                <dd v-if="validator.meta && (validator.meta.description || validator.meta.siteUrl)">
                    {{ validator.meta.description }} <br v-if="validator.meta.description">
                    <a class="link--main link--hover" :href="validator.meta.siteUrl">{{ validator.meta.siteUrl }}</a>
                </dd>

                <!-- @TODO owner address -->

                <!-- @TODO validating status-->
                <dt>Status</dt>
                <dd>{{ $options.VALIDATOR_STATUS[validator.status || 0] }}</dd>

                <dt>Total Stake</dt>
                <dd>{{ $store.state.COIN_NAME }} <span>{{ validator.stake | prettyPrecise }}</span></dd>

                <dt>Voting Power</dt>
                <dd>{{ (validator.part || 0) | pretty }}&thinsp;%</dd>

                <dt>#Delegators</dt>
                <dd>{{ validator.delegatorCount }}</dd>

                <dt>#Transactions</dt>
                <dd>{{ txPaginationInfo.total | prettyRound }}</dd>
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
            </div>
            <!-- Transactions -->
            <TransactionListTable :tx-list="txList" :current-validator="$route.params.pubKey" :is-loading="isTxListLoading" v-if="activeTab === $options.TAB_TYPES.TX"/>
            <!-- Delegation -->
            <StakeListTable :stake-list="validator.delegatorList" stake-item-type="delegator" v-if="activeTab === $options.TAB_TYPES.STAKE"/>
        </section>
        <Pagination :pagination-info="activePaginationInfo" :active-tab="activeTab" v-if="activePaginationInfo"/>

    </div>
</template>
