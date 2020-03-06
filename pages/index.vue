<script>
    // import Vue from 'vue';
    // import SockJS from "sockjs-client";
    import {getBlockList, getStatus, getTransactionList} from "~/api";
    import getTitle from '~/assets/get-title';
    import {NETWORK} from "~/assets/variables";
    import Stats from '~/components/Stats';
    import HistoryChart from '~/components/PreviewHistoryChart';
    import PreviewBlocks from '~/components/PreviewBlocks';
    import PreviewTransactions from '~/components/PreviewTransactions';

    const BLOCK_LIST_LENGTH = 20;
    const TX_LIST_LENGTH = 20;

    let centrifuge;
    let timeInterval = null;
    let statsPromise;

    function getAllData() {
        statsPromise = getStatus();
        const blocksPromise = getBlockList().then((blockListInfo) => blockListInfo.data);
        const txPromise = getTransactionList().then((txListInfo) => txListInfo.data);
        return Promise.all([statsPromise, blocksPromise, txPromise]);
    }

    export default {
        components: {
            Stats,
            HistoryChart,
            PreviewBlocks,
            PreviewTransactions,
        },
        asyncData() {
            if (process.server) {
                return;
            }
            return getAllData()
                .then(([stats, blockList, txList]) => {
                    return {
                        stats,
                        blockList: blockList.slice(0, BLOCK_LIST_LENGTH),
                        txList: txList.slice(0, TX_LIST_LENGTH),
                        isDataLoading: false,
                        lastBlockTime: Date.now(),
                        lastTxTime: Date.now(),
                    };
                })
                .catch((e) => {
                    // don't throw error, availability message will be shown instead
                });
        },
        head() {
            const title = getTitle(null);
            const description = `Blockchain explorer of the Minter ${this.network}. View info about blocks, transactions, and addresses.`;

            return {
                title: title,
                meta: [
                    { hid: 'og-title', name: 'og:title', content: title },
                    { hid: 'description', name: 'description', content: description },
                    { hid: 'og-description', name: 'og:description', content: description },
                ],
            };
        },
        data() {
            return {
                // isDataLoading: true,
                stats: null,
                /** @type Array<Block> */
                blockList: [],
                /*** @type Array<Transaction> */
                txList: [],
                lastBlockTime: 0,
                lastTxTime: 0,
            };
        },
        beforeMount() {
            // in SPA mode data will be loaded in asyncData (mounted hook need only for generate mode)
            // get blocks, txs
            // if (this.isDataLoading) {
            //     getAllData()
            //         .then(([stats, blockList, txList]) => {
            //             this.stats = stats;
            //             this.blockList = blockList.slice(0, BLOCK_LIST_LENGTH);
            //             this.txList = txList.slice(0, TX_LIST_LENGTH);
            //             this.isDataLoading = false;
            //             this.lastBlockTime = Date.now();
            //             this.lastTxTime = Date.now();
            //         })
            //         .catch((e) => {
            //             this.isDataLoading = false;
            //         });
            // }

            // if (!this.isDataLoading && this.stats.isLoading) {
            //     statsPromise.then((stats) => {
            //         this.stats = stats;
            //     });
            // }

            // update timestamps if no new data from server
            timeInterval = setInterval(() => {
                if (Date.now() - this.lastBlockTime >= 10000) {
                    this.blockList = this.blockList.slice(0);
                }
                if (Date.now() - this.lastTxTime >= 10000) {
                    this.txList = this.txList.slice(0);
                }
            }, 10000);

        },
        destroyed() {
            if (centrifuge) {
                centrifuge.disconnect();
            }
            clearInterval(timeInterval);
        },
        computed: {
            network() {
                // capitalize
                return NETWORK[0].toUpperCase() + NETWORK.slice(1);
            },
            // take actual height from blocks first
            latestBlockHeight() {
                return (this.blockList[0] && this.blockList[0].height) || (this.stats && this.stats.latestBlockHeight) || 0;
            },
            // take actual count from blocks response first
            totalTransactions() {
                return (this.txList[0] && this.txList[0].txn) || (this.stats && this.stats.totalTransactions) || 0;
            },
        },
        methods: {
        },
    };
</script>

<template>
    <div class="u-grid u-grid--vertical-margin" v-if="stats || blockList.length || txList.length">
        <section class="u-cell u-cell--large--1-2">
            <Stats :stats="stats" :latest-block-height="latestBlockHeight" :total-transactions="totalTransactions"/>
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
    <h1 class="u-text-center" style="margin-top: 50px" v-else>{{ network }} explorer is not available</h1>
</template>
