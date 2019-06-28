<script>
    import {getBlock, getBlockTransactionList} from "~/api";
    import {getTimeDistance, getTime, pretty, prettyRound} from "~/assets/utils";
    import getTitle from '~/assets/get-title';
    import {getErrorText} from '~/assets/server-error';
    import TransactionList from '~/components/TransactionList';
    import ValidatorList from '~/components/ValidatorList';
    import BackButton from '~/components/BackButton';
    import Pagination from "~/components/Pagination";

    export default {
        components: {
            TransactionList,
            ValidatorList,
            BackButton,
            Pagination,
        },
        filters: {
            pretty,
            prettyRound,
        },
        // watchQuery: ['page'],
        // key: (to) => to.fullPath,
        asyncData({ params, error }) {
            if (parseInt(params.height).toString() !== params.height) {
                return error({
                    statusCode: 404,
                    message: 'Invalid block height',
                });
            }
            return getBlock(params.height)
                .then((block) => {
                    return {
                        block : {
                            ...block,
                            timeDistance: getTimeDistance(block.timestamp),
                            timeUTC: getTime(block.timestamp),
                        },
                    };
                })
                .catch((e) => {
                    console.log({e});
                    let statusCode = e.request && e.request.status;
                    error({
                        statusCode,
                        message: statusCode === 404 ? 'Block not found' : getErrorText(e),
                    });
                });
        },
        head() {
            const title = getTitle('Block ' + this.block.height);

            return {
                title: title,
                meta: [
                    { hid: 'og-title', name: 'og:title', content: title },
                ],
            };
        },
        data() {
            return {
                /** @type Block */
                block: {},
                isTxListLoading: true,
                txList: [],
                txPaginationInfo: {},
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

                        this.checkPanelPosition();
                    }
                },
            },
        },
        computed: {
            prevUrl() {
                return this.block.height > 1 ? '/blocks/' + (this.block.height - 1) : false;
            },
            nextUrl() {
                return '/blocks/' + (this.block.height + 1);
            },
        },
        mounted() {
            this.fetchTxs();
        },
        methods: {
            fetchTxs() {
                getBlockTransactionList(this.block.height, this.$route.query)
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
            checkPanelPosition() {
                const delegationPanelEl = document.querySelector('[data-tx-panel]');
                // const delegationTableEl = document.querySelector('[data-delegation-panel]');
                if (window.pageYOffset > delegationPanelEl.offsetTop) {
                    window.scrollTo(0, delegationPanelEl.offsetTop - 15);
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
                    Block Information
                </h1>
            </div>
            <dl>
                <dt>Height</dt>
                <dd>{{ block.height | prettyRound }}</dd>

                <dt>Timestamp</dt>
                <dd>{{ block.timeDistance }} ago ({{ block.timeUTC }})</dd>

                <dt>Hash</dt>
                <dd class="u-select-all">{{ block.hash }}</dd>

                <dt>Size</dt>
                <dd>{{ block.size | prettyRound }} bytes</dd>

                <dt>Reward</dt>
                <dd>{{ $store.state.COIN_NAME }} {{ block.reward | pretty }}</dd>

                <dt>#Transactions</dt>
                <dd>{{ block.txCount || txPaginationInfo.total || 0 }}</dd>

                <dt>#Validators</dt>
                <dd>{{ block.validators.length }}</dd>
            </dl>
        </section>
        <div class="u-section navigation">
            <nuxt-link class="button button--ghost-main" :to="prevUrl" v-if="prevUrl">Prev Block</nuxt-link>
            <nuxt-link class="button button--ghost-main" :to="nextUrl" v-if="nextUrl">Next Block</nuxt-link>
        </div>
        <TransactionList data-tx-panel
                         :tx-list="txList"
                         :current-block="block.height"
                         :pagination-info="txPaginationInfo"
                         :is-loading="isTxListLoading"
                         v-if="isTxListLoading || txList.length"
        />
        <Pagination :pagination-info="txPaginationInfo"/>
        <ValidatorList id="validators" :validator-list="block.validators" v-if="block.validators && block.validators.length"/>
    </div>
</template>
