<script>
    import {getBlockList, getStatus, getTransactionList} from "~/api";
    import {NETWORK} from "~/assets/variables";
    import Stats from '~/components/Stats';
    import HistoryChart from '~/components/HistoryChart';
    import PreviewBlocks from '~/components/PreviewBlocks';
    import PreviewTransactions from '~/components/PreviewTransactions';

    let timer = null;

    export default {
        components: {
            Stats,
            HistoryChart,
            PreviewBlocks,
            PreviewTransactions,
        },
        asyncData () {
            if (process.server) {
                return;
            }
            return getStatus()
                .then((stats) => ({
                    stats,
                    isDataLoading: false,
                }))
                .catch((e) => {});
        },
        data() {
            return {
                isDataLoading: true,
                stats: null,
                blockList: null,
                txList: null,
            }
        },
        created() {
            // get blocks, txs and set loop
            this.updateData();
        },
        destroyed() {
            clearTimeout(timer);
        },
        computed: {
            network() {
                return NETWORK[0].toUpperCase() + NETWORK.slice(1);
            }
        },
        methods: {
            updateData() {
                const statsPromise = getStatus();
                const blocksPromise = getBlockList()
                    .then((blockListInfo) => blockListInfo.data);
                const txPromise = getTransactionList()
                    .then((txListInfo) => txListInfo.data);

                return Promise.all([statsPromise, blocksPromise, txPromise])
                    .then(([stats, blockList, txList]) => {
                        this.stats = stats;
                        this.blockList = blockList;
                        this.txList = txList;
                        this.handleData();
                    })
                    .catch(this.handleData);
            },
            handleData() {
                this.isDataLoading = false;
                timer = setTimeout(this.updateData, 5000);
            },
        }

    }
</script>

<template>
    <div class="u-grid u-grid--vertical-margin" v-if="stats">
        <section class="u-cell u-cell--large--1-2">
            <Stats :stats="stats"/>
        </section>
        <section class="u-cell u-cell--large--1-2 history-cell">
            <HistoryChart/>
        </section>
        <section class="u-cell u-cell--large--1-2">
            <PreviewBlocks :block-list="blockList"/>
        </section>
        <section class="u-cell u-cell--large--1-2">
            <PreviewTransactions :tx-list="txList"/>
        </section>
    </div>
    <h1 class="u-text-center" style="margin-top: 50px" v-else-if="!isDataLoading">{{ network }} is not available</h1>
</template>
