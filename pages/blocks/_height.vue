<script>
    import {getBlock, getTransactionList} from "~/api";
    import {getTimeDistance, getTimeUTC, prettyExact} from "~/assets/utils";
    import getTitle from '~/assets/get-title';
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
            prettyExact,
        },
        watchQuery: ['page'],
        key: (to) => to.fullPath,
        asyncData({ params, error }) {
            return getBlock(params.height)
                .then((block) => {
                    return {
                        block : {
                            ...block,
                            timeDistance: getTimeDistance(block.timestamp),
                            timeUTC: getTimeUTC(block.timestamp),
                        },
                    };
                })
                .catch((e) => {
                    error({ statusCode: 404, message: 'Block not found' });
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
                //isTxListLoading: true,
                txList: [],
                txPaginationInfo: {},
            };
        },
        computed: {
            prevUrl() {
                return this.block.height > 1 ? '/blocks/' + (this.block.height - 1) : false;
            },
            nextUrl() {
                return this.block.height < this.block.latestBlockHeight ? '/blocks/' + (this.block.height + 1) : '';
            },
        },
        mounted() {
            getTransactionList(Object.assign({block: this.block.height}, this.$route.query))
                .then((txListInfo) => {
                    if (txListInfo.data && txListInfo.data.length) {
                        this.txList = txListInfo.data;
                        this.txPaginationInfo = txListInfo.meta;
                    }
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
                    Block Information
                </h1>
            </div>
            <dl>
                <dt>Height</dt>
                <dd>{{ block.height | prettyExact }}</dd>

                <dt>TimeStamp</dt>
                <dd>{{ block.timeDistance }} ago ({{ block.timeUTC }})</dd>

                <dt>Hash</dt>
                <dd class="u-select-all">{{ block.hash }}</dd>

                <dt>Size</dt>
                <dd>{{ block.size | prettyExact }} bytes</dd>

                <dt>Reward</dt>
                <dd>{{ block.reward | prettyExact }} {{ $store.state.COIN_NAME }}</dd>

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
        <TransactionList :tx-list="txList"
                         :current-block="block.height"
                         :pagination-info="txPaginationInfo"
                         v-if="txList.length"
        />
        <Pagination :pagination-info="txPaginationInfo"/>
        <ValidatorList id="validators" :validator-list="block.validators" v-if="block.validators && block.validators.length"/>
    </div>
</template>
