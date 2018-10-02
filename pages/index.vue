<script>
    import SockJS from "sockjs-client";
    import Centrifuge from 'centrifuge';
    import {getBlockList, getStatus, getTransactionList, getWebSocketConnectData} from "~/api";
    import getTitle from '~/assets/get-title';
    import {EXPLORER_RTM_URL, NETWORK} from "~/assets/variables";
    import Stats from '~/components/Stats';
    import HistoryChart from '~/components/PreviewHistoryChart';
    import PreviewBlocks from '~/components/PreviewBlocks';
    import PreviewTransactions from '~/components/PreviewTransactions';

    let centrifuge;
    const BLOCK_LIST_LENGTH = 20;
    const TX_LIST_LENGTH = 20;

    function getAllData() {
        const statsPromise = getStatus();
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
                .then(([stats, blockList, txList]) => ({
                    stats,
                    blockList: blockList.slice(0, BLOCK_LIST_LENGTH),
                    txList: txList.slice(0, TX_LIST_LENGTH),
                    isDataLoading: false,
                }))
                .catch((e) => {});
        },
        head() {
            const title = getTitle(null);
            const description = 'Blockchain explorer of the Minter test network. View info about blocks, transactions, and addresses.';

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
                isDataLoading: true,
                stats: null,
                blockList: [],
                txList: [],
            };
        },
        beforeMount() {
            // get blocks, txs
            if (this.isDataLoading) {
                getAllData()
                    .then(([stats, blockList, txList]) => {
                        this.stats = stats;
                        this.blockList = blockList.slice(0, BLOCK_LIST_LENGTH);
                        this.txList = txList.slice(0, TX_LIST_LENGTH);
                        this.isDataLoading = false;
                    })
                    .catch((e) => {
                        this.isDataLoading = false;
                    });
            }

            getWebSocketConnectData()
                .then((data) => this.subscribeWS(data));

        },
        destroyed() {
            if (centrifuge) {
                centrifuge.disconnect();
            }
        },
        computed: {
            network() {
                return NETWORK[0].toUpperCase() + NETWORK.slice(1);
            },
        },
        methods: {
            subscribeWS(connectData) {
                let centrifuge = new Centrifuge({
                    url: EXPLORER_RTM_URL,
                    user: connectData.user ? connectData.user : '',
                    timestamp: connectData.timestamp.toString(),
                    token: connectData.token,
                    sockjs: SockJS,
                });

                centrifuge.subscribe("blocks", (response) => {
                    const newBlock = response.data;
                    const isExist = this.blockList.some(function(item) {
                        return item.height === newBlock.height;
                    });
                    if (!isExist) {
                        this.blockList.unshift(newBlock);
                        this.blockList = this.blockList.slice(0, BLOCK_LIST_LENGTH);
                    }
                });
                centrifuge.subscribe("transactions", (response) => {
                    const newTx = response.data;
                    const isExist = this.txList.find(function(item) {
                        return item.hash === newTx.hash;
                    });
                    if (!isExist) {
                        this.txList.unshift(newTx);
                        this.txList = this.txList.slice(0, TX_LIST_LENGTH);
                    }
                });
                centrifuge.subscribe("status-info", (statusData) => {
                    this.stats = statusData.data;
                });

                centrifuge.connect();
            },
        },

    };
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
    <h1 class="u-text-center" style="margin-top: 50px" v-else-if="!isDataLoading">{{ network === 'Mainnet' ? 'Mainnet' : 'Explorer' }} is not available</h1>
</template>
