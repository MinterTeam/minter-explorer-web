<script>
    import SockJS from "sockjs-client";
    import Centrifuge from 'centrifuge';
    import {getBlockList, getStatus, getTransactionList, getWebSocketConnectData} from "~/api";
    import {EXPLORER_RTM_URL, NETWORK} from "~/assets/variables";
    import Stats from '~/components/Stats';
    import HistoryChart from '~/components/HistoryChart';
    import PreviewBlocks from '~/components/PreviewBlocks';
    import PreviewTransactions from '~/components/PreviewTransactions';

    let centrifuge;

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
                    blockList,
                    txList,
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
            };
        },
        beforeMount() {
            // get blocks, txs
            if (this.isDataLoading) {
                getAllData()
                    .then(([stats, blockList, txList]) => {
                        this.stats = stats;
                        this.blockList = blockList;
                        this.txList = txList;
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
                    let exist = this.blockList.find(function(element) {
                        return element.height === response.data.height;
                    });
                    if (!exist) {
                        this.blockList = [...[response.data], ...this.blockList];
                    }
                });
                centrifuge.subscribe("transactions", (txData) => {
                    let exist = this.txList.find(function(element) {
                        return element.hash === txData.data.hash;
                    });
                    if (!exist) {
                        this.txList = [...[txData.data], ...this.txList];
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
