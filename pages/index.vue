<script>
    import {getBlockList, getStatus, getTransactionList} from "~/api";
    import Stats from '~/components/Stats';
    import HistoryChart from '~/components/HistoryChart';
    import PreviewBlocks from '~/components/PreviewBlocks';
    import PreviewTransactions from '~/components/PreviewTransactions';

    export default {
        components: {
            Stats,
            HistoryChart,
            PreviewBlocks,
            PreviewTransactions,
        },
        asyncData () {
            return getStatus()
                .then((stats) => ({stats}));
        },
        data() {
            return {
                stats: null,
                blockList: null,
                txList: null,
            }
        },
        created() {
            this.updateData();
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
                setTimeout(this.updateData, 5000);
            },
        }

    }
</script>

<template>
    <div class="u-grid u-grid--vertical-margin">
        <section class="u-cell u-cell--medium--1-2">
            <Stats :stats="stats"/>
        </section>
        <section class="u-cell u-cell--medium--1-2 history-cell">
            <HistoryChart/>
        </section>
        <section class="u-cell u-cell--medium--1-2">
            <PreviewBlocks :block-list="blockList"/>
        </section>
        <section class="u-cell u-cell--medium--1-2">
            <PreviewTransactions :tx-list="txList"/>
        </section>
    </div>
</template>
