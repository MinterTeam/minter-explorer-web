<script>
    import {getValidatorTransactionList, getValidator} from "~/api";
    import getTitle from '~/assets/get-title';
    import {getErrorText} from '~/assets/server-error';
    import {pretty, prettyExact} from '~/assets/utils';
    import Amount from '~/components/common/Amount';
    import TransactionList from '~/components/TransactionList';
    import StakeListTable from '~/components/StakeListTable';
    import BackButton from '~/components/BackButton';
    import Pagination from "~/components/Pagination";

    const VALIDATOR_STATUS = {
        0: 'Not declared',
        1: 'Set off',
        2: 'Set on',
    };

    export default {
        ideFix: null,
        VALIDATOR_STATUS,
        components: {
            Amount,
            StakeListTable,
            TransactionList,
            BackButton,
            Pagination,
        },
        filters: {
            pretty,
        },
        // watchQuery: ['page'],
        // key: (to) => to.fullPath,
        asyncData({ params, query, error }) {
            return getValidator(params.pubKey)
                .then((validator) => {
                    return {
                        validator,
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
                validator: null,
                txList: [],
                txPaginationInfo: {},
                isTxListLoading: true,
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

                        // this.checkPanelPosition();
                    }
                },
            },
        },
        computed: {

        },
        mounted() {
            this.fetchTxs();
        },
        methods: {
            prettyExact,
            fetchTxs() {
                getValidatorTransactionList(this.$route.params.pubKey, this.$route.query)
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
            // checkPanelPosition() {
            //     const delegationPanelEl = document.querySelector('[data-tx-panel]');
            //     // const delegationTableEl = document.querySelector('[data-delegation-panel]');
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

                <!-- @TODO owner address -->

                <!-- @TODO validating status-->
                <dt>Status</dt>
                <dd>{{ $options.VALIDATOR_STATUS[validator.status || 0] }}</dd>

                <dt>Total Stake</dt>
                <dd><Amount :amount="prettyExact(validator.stake)"/> {{ $store.state.COIN_NAME }}</dd>

                <!--@TODO 0 if not validating-->
                <dt>Voting Power</dt>
                <dd>{{ (validator.part || 0) | pretty }}&thinsp;%</dd>

                <dt>#Delegators</dt>
                <dd>{{ validator.delegator_count }}</dd>

                <dt>#Transactions</dt>
                <dd>{{ txPaginationInfo.total }}</dd>
            </dl>
        </section>

        <section class="panel u-section">
            <div class="panel__section panel__header">
                <h1 class="panel__title panel__header-title">
                    <img class="panel__header-title-icon" src="/img/icon-mining.svg" width="40" height="40" alt="" role="presentation">
                    Delegated Stakes
                </h1>
            </div>
            <StakeListTable :stake-list="validator.delegator_list" stake-item-type="delegator"/>
        </section>

        <TransactionList data-tx-panel
                         :tx-list="txList"
                         :current-validator="$route.params.pubKey"
                         :pagination-info="txPaginationInfo"
                         :is-loading="isTxListLoading"
        />

        <Pagination :pagination-info="txPaginationInfo"/>
    </div>
</template>
