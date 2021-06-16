<script>
    // import Vue from 'vue';
    // import SockJS from "sockjs-client";
    import Centrifuge from 'centrifuge/src';
    import {getBlockList, getStatus, getTransactionList, getPoolList} from '~/api/explorer.js';
    import getTitle from '~/assets/get-title';
    import {EXPLORER_RTM_URL, NETWORK, HISTORY_TRANSACTION_COUNT} from '~/assets/variables.js';
    import {toCamel} from '~/assets/to-camel.js';
    import Stats from '~/components/Stats';
    import HistoryChart from '~/components/PreviewHistoryChart';
    import PreviewBlocks from '~/components/PreviewBlocks';
    import PreviewTransactions from '~/components/PreviewTransactions';
    import PreviewPools from '~/components/PreviewPools.vue';
    import PreviewFarm from '~/components/PreviewFarm.vue';

    const BLOCK_LIST_LENGTH = 20;
    const TX_LIST_LENGTH = 20;
    const POOL_LIST_LENGTH = 10;

    let centrifuge;
    let timeInterval = null;
    let statsPromise;

    function getAllData() {
        statsPromise = getStatus();
        const blocksPromise = getBlockList().then((blockListInfo) => blockListInfo.data);
        const txPromise = getTransactionList().then((txListInfo) => txListInfo.data);
        const poolsPromise = getPoolList().then((poolListInfo) => poolListInfo.data);
        return Promise.all([statsPromise, blocksPromise, txPromise, poolsPromise]);
    }

    export default {
        components: {
            Stats,
            HistoryChart,
            PreviewBlocks,
            PreviewTransactions,
            PreviewPools,
            PreviewFarm,
        },
        asyncData() {
            if (process.server) {
                return;
            }
            return getAllData()
                .then(([stats, blockList, txList, poolList]) => {
                    return {
                        stats,
                        blockList: blockList.slice(0, BLOCK_LIST_LENGTH),
                        txList: txList.slice(0, TX_LIST_LENGTH),
                        poolList: poolList.slice(0, POOL_LIST_LENGTH),
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
                /** @type Array<Transaction> */
                txList: [],
                /** @type Array<Pool> */
                poolList: [],
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

            // getWebSocketConnectData()
            //     .then((data) => this.subscribeWS(data));
            this.subscribeWS();

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
                return this.txList[0] ? this.txList[0].txn + HISTORY_TRANSACTION_COUNT : (this.stats?.totalTransactions || 0);
            },
        },
        methods: {
            subscribeWS(connectData) {
                console.log('connect', EXPLORER_RTM_URL);
                centrifuge = new Centrifuge(EXPLORER_RTM_URL, {
                    // user: connectData.user ? connectData.user : '',
                    // timestamp: connectData.timestamp.toString(),
                    // token: connectData.token,
                    // sockjs: SockJS,
                });

                centrifuge.subscribe("blocks", (response) => {
                    const newBlock = toCamel(response.data);
                    const isExist = this.blockList.some(function(item) {
                        return item.height === newBlock.height;
                    });
                    if (!isExist) {
                        this.blockList.unshift(newBlock);
                        this.blockList = this.blockList.slice(0, BLOCK_LIST_LENGTH);
                        this.lastBlockTime = Date.now();

                        // this.checkLastBlockIsSynced();
                    }
                });
                centrifuge.subscribe("transactions_100", (response) => {
                    const newTx = toCamel(response.data);
                    const isExist = this.txList.find(function(item) {
                        return item.hash === newTx.hash;
                    });
                    if (!isExist) {
                        this.txList.unshift(newTx);
                        this.txList = this.txList.slice(0, TX_LIST_LENGTH);
                        this.lastTxTime = Date.now();
                    }
                });

                centrifuge.connect();
            },
        },
    };
</script>

<template>
    <div class="u-grid u-grid--vertical-margin" v-if="stats || blockList.length || txList.length">
        <div class="u-cell">
            <PreviewFarm/>
        </div>
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
        <section class="u-cell">
            <PreviewPools :pool-list="poolList"/>
        </section>
    </div>
    <h1 class="u-text-center" style="margin-top: 50px" v-else>{{ network }} explorer is not available</h1>
</template>
