<script>
    import {getBlockList, getStatus, getTransactionList, getWebSocketConnectData} from "~/api";
    import {EXPLORER_RTM_URL, NETWORK} from "~/assets/variables";
    import Stats from '~/components/Stats';
    import HistoryChart from '~/components/HistoryChart';
    import PreviewBlocks from '~/components/PreviewBlocks';
    import PreviewTransactions from '~/components/PreviewTransactions';
    import SockJS from "sockjs-client";
    import Centrifuge from 'centrifuge';

    window.SockJS = SockJS;

    let timer = null;

    export default {
        components: {
            Stats,
            HistoryChart,
            PreviewBlocks,
            PreviewTransactions,
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

            getWebSocketConnectData()
                .then((data) => this.subscribeWS(data));

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
                const blocksPromise = getBlockList().then((blockListInfo) => blockListInfo.data);
                const txPromise = getTransactionList().then((txListInfo) => txListInfo.data);

                return Promise.all([statsPromise, blocksPromise, txPromise])
                    .then(([stats, blockList, txList]) => {
                        this.stats = stats;
                        this.blockList = blockList;
                        this.txList = txList;
                    })
                    .catch(this.handleData);
            },
            handleData() {
                this.isDataLoading = false;
                timer = setTimeout(this.updateData, 5000);
            },

            subscribeWS(connectData) {
                let centrifuge = new Centrifuge({
                    url: EXPLORER_RTM_URL,
                    user: connectData.user ? connectData.user : '',
                    timestamp: connectData.timestamp.toString(),
                    token: connectData.token,
                });

                centrifuge.subscribe("blocks", (response) => {
                    let exist = this.blockList.find(function (element) {
                        return element.height === response.data.height
                    });
                    if (!exist) {
                        this.blockList = [...[response.data], ...this.blockList];
                    }
                });
                centrifuge.subscribe("transactions", (txData) => {
                    let exist = this.txList.find(function (element) {
                        return element.hash === txData.data.hash
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
    <h1 class="u-text-center" style="margin-top: 50px" v-else-if="!isDataLoading">{{ network === 'Mainnet' ? 'Mainnet' :
        'Explorer' }} is not available</h1>
</template>
