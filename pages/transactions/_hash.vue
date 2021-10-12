<script>
    import debounce from 'lodash-es/debounce';
    import Big from '~/assets/big.js';
    import {TX_TYPE} from 'minterjs-util/src/tx-types.js';
    import {isValidTransaction} from 'minterjs-util/src/prefix';
    import {convertFromPip} from "minterjs-util/src/converter.js";
    import {getTransaction, getBlock, getBlockList, getCoinById, checkBlockTime} from '~/api/explorer.js';
    import {getTimeDistance, getTime, getTimeMinutes, pretty, prettyExact, prettyRound, txTypeFilter, fromBase64, getEtherscanAddressUrl} from "~/assets/utils.js";
    import getTitle from '~/assets/get-title';
    import {getErrorText} from '~/assets/server-error';
    import {UNBOND_PERIOD, TX_STATUS, HUB_MINTER_MULTISIG_ADDRESS} from "~/assets/variables.js";
    import Amount from '@/components/common/Amount.vue';
    import PoolLink from '~/components/common/PoolLink.vue';
    import BackButton from '~/components/BackButton';
    import TableLink from '~/components/TableLink';

    const HUB_ADDRESS = HUB_MINTER_MULTISIG_ADDRESS;

    let fetchTxTimer;
    let fetchTxDestroy;
    let resizeHandler;

    export default {
        TX_TYPE,
        UNBOND_PERIOD,
        TX_STATUS,
        components: {
            Amount,
            PoolLink,
            BackButton,
            TableLink,
        },
        filters: {
            txType: txTypeFilter,
            timeDistance: getTimeDistance,
            // timeDistanceFuture: (value) => getTimeDistance(value, true),
            time: getTime,
        },
        asyncData({ params, error }) {
            if (!isValidTransaction(params.hash)) {
                return error({
                    statusCode: 404,
                    message: 'Invalid transaction hash',
                });
            }
            return getTransaction(params.hash)
                .then((tx) => {
                    return {
                        tx,
                    };
                })
                .catch((e) => {
                    console.log({e});
                    if (e.response && e.response.status === 404) {
                        // do nothing, wait for tx to appear in the blockchain
                    } else {
                        error({
                            statusCode: e.request && e.request.status,
                            message: getErrorText(e),
                        });
                    }
                });
        },
        head() {
            const title = getTitle('Transaction');

            return {
                title: title,
                meta: [
                    { hid: 'og-title', name: 'og:title', content: title },
                ],
            };
        },
        data() {
            return {
                /** @type Transaction|null */
                tx: null,
                shouldShortenAddress: this.getShouldShortenAddress(),
                /** @type BlockTimeInfo|null */
                unbondTimeInfo: null,
                /** @type BlockTimeInfo|null */
                voteTimeInfo: null,
                currentCoinSymbol: '',
            };
        },
        computed: {
            unbondBlockHeight() {
                if (!this.tx || !this.isUnbondType) {
                    return;
                }
                return this.tx.height + UNBOND_PERIOD;
            },
            validatorMeta() {
                const tx = this.tx;
                if (!tx.data.pubKey) {
                    return {};
                }
                const validator = this.$store.state.validatorMetaList.find((validatorItem) => validatorItem.publicKey === tx.data.pubKey);
                return validator || {};
            },
            poolPath() {
                if (!this.tx.data.coins) {
                    return [];
                }
                let result = [];
                for (let i = 0; i < this.tx.data.coins.length - 1; i++) {
                    result.push({
                        coin0: this.tx.data.coins[i],
                        coin1: this.tx.data.coins[i + 1],
                    });
                }
                return result;
            },
            coin0Price() {
                return calculateTradeRate(this.tx.data.valueToSell, this.tx.data.valueToBuy);
            },
            coin1Price() {
                return calculateTradeRate(this.tx.data.valueToBuy, this.tx.data.valueToSell);
            },
            isSellType() {
                return this.isTxType(TX_TYPE.SELL) || this.isTxType(TX_TYPE.SELL_ALL) || this.isTxType(TX_TYPE.SELL_SWAP_POOL) || this.isTxType(TX_TYPE.SELL_ALL_SWAP_POOL);
            },
            isBuyType() {
                return this.isTxType(TX_TYPE.BUY) || this.isTxType(TX_TYPE.BUY_SWAP_POOL);
            },
            isAddOrderType() {
                return this.isTxType(TX_TYPE.ADD_LIMIT_ORDER);
            },
            isUnbondType() {
                return this.isTxType(TX_TYPE.UNBOND);
            },
            isStakeType() {
                return this.isTxType(TX_TYPE.UNBOND) || this.isTxType(TX_TYPE.DELEGATE) || this.isTxType(TX_TYPE.DECLARE_CANDIDACY);
            },
            isMultisendType() {
                return this.isTxType(TX_TYPE.MULTISEND);
            },
            commissionPriceList() {
                if (!this.isTxType(TX_TYPE.VOTE_COMMISSION)) {
                    return;
                }

                let commissionData = {...this.tx.data};
                let list = [];
                Object.keys(commissionData).forEach((fieldName) => {
                    if (fieldName !== 'pubKey' && fieldName !== 'height' && fieldName !== 'coin') {
                        const regex = /[a-z][A-Z0-9]/g;
                        let result;
                        let position = 0;
                        let prettyName = '';

                        while ((result = regex.exec(fieldName)) !== null) {
                            prettyName += fieldName.substring(position, result.index + 1);
                            prettyName += ' ' + fieldName[result.index + 1].toLowerCase();
                            position = result.index + 2;
                        }
                        prettyName += fieldName.substring(position, fieldName.length);
                        prettyName = prettyName.replace('710', '7 to 10');

                        list.push(`${prettyName}: ${prettyExact(convertFromPip(commissionData[fieldName]))}`);
                    }
                });

                return list.join('\n');
            },
            payloadParsed() {
                try {
                    return JSON.parse(fromBase64(this.tx.payload));
                } catch (e) {
                    return null;
                }
            },
            isFromHubTx() {
                return this.tx.from === HUB_ADDRESS;
            },
            isToHubTx() {
                return this.tx.data.to === HUB_ADDRESS && this.payloadParsed?.type === 'send_to_eth';
            },
            hubNetworkFee() {
                if (!this.isToHubTx) {
                    return 0;
                }

                return convertFromPip(this.payloadParsed.fee);
            },
            hubBridgeFee() {
                if (!this.isToHubTx) {
                    return 0;
                }

                return new Big(this.tx.data.value).times(0.01).toFixed(18);
            },
            hubAmount() {
                if (!this.isToHubTx) {
                    return;
                }

                return new Big(this.tx.data.value).minus(this.hubBridgeFee).minus(this.hubNetworkFee).toFixed(18);
            },
        },
        mounted() {
            if (!this.tx) {
                this.fetchTx();
            } else {
                this.fetchUnbondBlock();
                this.fetchVoteBlock();
                this.fetchCreatedCoinCurrentSymbol();
            }
            if (process.client) {
                resizeHandler = debounce(() => {
                    this.shouldShortenAddress = this.getShouldShortenAddress();
                });
                window.addEventListener('resize', resizeHandler);
            }
        },
        destroyed() {
            if (fetchTxTimer) {
                clearTimeout(fetchTxTimer);
            }
            if (resizeHandler) {
                window.removeEventListener('resize', resizeHandler);
            }
            fetchTxDestroy = true;
        },
        methods: {
            fromBase64,
            pretty,
            prettyExact,
            prettyRound,
            timeDistance: getTimeDistance,
            timeDistanceFuture: (value) => getTimeDistance(value, true),
            time: getTime,
            timeMinutes: getTimeMinutes,
            getEtherscanAddressUrl,
            fetchTx() {
                getTransaction(this.$route.params.hash)
                    .then((tx) => {
                        this.tx = tx;
                        fetchTxTimer = null;
                        this.fetchUnbondBlock();
                        this.fetchVoteBlock();
                        this.fetchCreatedCoinCurrentSymbol();
                    })
                    .catch((e) => {
                        if (fetchTxDestroy) {
                            return;
                        }
                        fetchTxTimer = setTimeout(() => {
                            this.fetchTx();
                        }, 2500);
                    });
            },
            fetchUnbondBlock() {
                if (this.isUnbondType) {
                    checkBlockTime(this.unbondBlockHeight)
                        .then((timeInfo) => this.unbondTimeInfo = timeInfo)
                        .catch((e) => {
                            console.log('Unable to get unbond block info', e);
                        });
                }
            },
            fetchVoteBlock() {
                if (this.tx.data.height) {
                    checkBlockTime(this.tx.data.height)
                        .then((timeInfo) => this.voteTimeInfo = timeInfo)
                        .catch((e) => {
                            console.log('Unable to get vote block info', e);
                        });
                }
            },
            fetchCreatedCoinCurrentSymbol() {
                if (this.tx.data.createdCoinId) {
                    getCoinById(this.tx.data.createdCoinId)
                        .then((coinItem) => this.currentCoinSymbol = coinItem.symbol)
                        .catch((e) => {
                            console.log('Unable to get current coin', e);
                        });
                }
            },
            isDefined(value) {
                return typeof value !== 'undefined';
            },
            isTxType(txType) {
                return this.tx.type === Number(txType);
            },
            getShouldShortenAddress() {
                return process.client && window.innerWidth < 700;
            },
            getMultisendDeliveryList(tx) {
                return tx.data.list || [];
            },
            isMultisendMultipleCoin(tx) {
                if (!this.isMultisendType) {
                    return;
                }
                const currentUserDeliveryList = this.getMultisendDeliveryList(tx);
                return currentUserDeliveryList.some((delivery) => {
                    return delivery.coin.id !== currentUserDeliveryList[0].coin.id;
                });
            },
            getMultisendCoin(tx) {
                if (!this.isMultisendType) {
                    return;
                }
                if (!this.isMultisendMultipleCoin(tx)) {
                    const firstItem = this.getMultisendDeliveryList(tx)[0];
                    return firstItem && firstItem.coin.symbol;
                }
            },
            getMultisendValue(tx) {
                if (!this.isMultisendType) {
                    return;
                }
                const currentUserDeliveryList = this.getMultisendDeliveryList(tx);
                if (this.isMultisendMultipleCoin(tx)) {
                    return '...';
                } else {
                    return currentUserDeliveryList.reduce((accumulator, delivery) => accumulator.plus(new Big(delivery.value)), new Big(0)).toFixed();
                }
            },
            checkFromBase64(b64) {
                return 'Mc' + Buffer.from(b64, 'base64').toString('hex');
            },
        },
    };

    function calculateTradeRate(amountIn, amountOut) {
        if (Number(amountIn) === 0 || Number.isNaN(Number(amountIn))) {
            return 0;
        }
        return new Big(amountOut).div(amountIn).toString(33);
    }
</script>

<template>
    <div>
        <section class="panel u-section" v-if="tx">
            <div class="panel__section panel__header">
                <h1 class="panel__header-title panel__title">
                    <BackButton/>
                    Transaction information
                </h1>
            </div>
            <dl>
                <dt>Hash</dt>
                <dd class="dd u-select-all">{{ tx.hash }}</dd>

                <dt>Timestamp</dt>
                <dd>{{ tx.timestamp | timeDistance }} ago ({{ tx.timestamp | time }})</dd>

                <dt>Status</dt>
                <dd><strong :class="tx.status === $options.TX_STATUS.SUCCESS ? 'tx__success' : 'tx__fail'">{{ tx.status }}</strong></dd>

                <dt>Block</dt>
                <dd><nuxt-link class="link--default" :to="'/blocks/' + tx.height">{{ prettyRound(tx.height) }}</nuxt-link></dd>

                <dt>Type</dt>
                <dd>{{ tx.type | txType }}</dd>

                <dt>From</dt>
                <dd><nuxt-link class="link--default" :to="'/address/' + tx.from">{{ tx.from }}</nuxt-link></dd>

                <template v-if="tx.status !== $options.TX_STATUS.FAILURE">



                <!-- SEND, MINT_TOKEN, BURN_TOKEN -->
                <dt v-if="tx.data.to">To</dt>
                <dd v-if="tx.data.to"><nuxt-link class="link--default" :to="'/address/' + tx.data.to">{{ tx.data.to }}</nuxt-link></dd>
                    <dt v-if="isDefined(tx.data.value) && !isStakeType">Amount</dt>
                    <Amount tag="dd" v-if="isDefined(tx.data.value) && !isStakeType" :amount="tx.data.value" :coin="tx.data.coin.symbol" :exact="true"/>

                    <!-- SELL, SELL_ALL, SELL_SWAP_POOL, SELL_ALL_SWAP_POOL -->
                    <dt v-if="isSellType">Sell coins</dt>
                    <Amount tag="dd" v-if="isSellType" :amount="tx.data.valueToSell" :coin="tx.data.coinToSell.symbol" :exact="true"/>
                    <dt v-if="isSellType">Get coins</dt>
                    <Amount tag="dd" v-if="isSellType" :amount="tx.data.valueToBuy" :coin="tx.data.coinToBuy.symbol" :exact="true"/>
                    <dt v-if="tx.data.minimumValueToBuy">Minimum value to get</dt>
                    <dd v-if="tx.data.minimumValueToBuy">{{ prettyExact(tx.data.minimumValueToBuy) }}</dd>
                    <!-- BUY, BUY_SWAP_POOL -->
                    <dt v-if="isBuyType">Buy coins</dt>
                    <Amount tag="dd" v-if="isBuyType" :amount="tx.data.valueToBuy" :coin="tx.data.coinToBuy.symbol" :exact="true"/>
                    <dt v-if="isBuyType">Spend coins</dt>
                    <Amount tag="dd" v-if="isBuyType" :amount="tx.data.valueToSell" :coin="tx.data.coinToSell.symbol" :exact="true"/>
                    <dt v-if="tx.data.maximumValueToSell">Maximum value to spend</dt>
                    <dd v-if="tx.data.maximumValueToSell">{{ prettyExact(tx.data.maximumValueToSell) }}</dd>

                    <!-- ADD_LIMIT_ORDER, REMOVE_LIMIT_ORDER -->
                    <dt v-if="tx.data.id || tx.data.orderId">Order ID</dt>
                    <dd v-if="tx.data.id || tx.data.orderId">{{ tx.data.id || tx.data.orderId }}</dd>

                    <!-- ADD_LIMIT_ORDER -->
                    <dt v-if="isAddOrderType">Want to sell</dt>
                    <Amount tag="dd" v-if="isAddOrderType" :amount="tx.data.valueToSell" :coin="tx.data.coinToSell.symbol" :exact="true"/>
                    <dt v-if="isAddOrderType">Want to buy</dt>
                    <Amount tag="dd" v-if="isAddOrderType" :amount="tx.data.valueToBuy" :coin="tx.data.coinToBuy.symbol" :exact="true"/>

                    <dt v-if="isSellType || isBuyType || isAddOrderType">Rate {{ tx.data.coinToSell.symbol }}</dt>
                    <Amount v-if="isSellType || isBuyType || isAddOrderType" :amount="coin0Price" :coin="tx.data.coinToBuy.symbol" :significant="true" tag="dd"/>
                    <dt v-if="isSellType || isBuyType || isAddOrderType">Rate {{ tx.data.coinToBuy.symbol }}</dt>
                    <Amount v-if="isSellType || isBuyType || isAddOrderType" :amount="coin1Price" :coin="tx.data.coinToSell.symbol" :significant="true" tag="dd"/>

                    <dt v-if="tx.data.coins">Coins route</dt>
                    <dd v-if="tx.data.coins">
                        <span v-for="(coinPathItem, coinPathIndex) in tx.data.coins" :key="coinPathItem.id + '-' + coinPathIndex">
                            <nuxt-link class="link--default" :to="'/coins/' + coinPathItem.symbol">{{ coinPathItem.symbol }}</nuxt-link><span v-if="coinPathIndex !== tx.data.coins.length - 1"> -> </span>
                        </span>
                    </dd>
                    <dt v-if="tx.data.coins">Pools route</dt>
                    <dd v-if="tx.data.coins">
                        <span v-for="(poolPathItem, poolPathIndex) in poolPath" :key="poolPathItem.coin0.id + '-' + poolPathItem.coin1.id">
                            <PoolLink :pool="poolPathItem"/><span v-if="poolPathIndex !== poolPath.length - 1"> -> </span>
                        </span>
                    </dd>

                    <!-- CREATE_SWAP_POOL -->
                    <dt v-if="tx.data.coin0 && tx.data.coin1">Pool</dt>
                    <dd v-if="tx.data.coin0 && tx.data.coin1">
                        <PoolLink :pool="tx.data"/>
                    </dd>
                    <dt v-if="tx.data.poolToken">Pool token</dt>
                    <dd v-if="tx.data.poolToken">
                        <!-- REMOVE_LIQUIDITY -->
                        <span v-if="tx.data.liquidity">{{ prettyExact(tx.data.liquidity) }}</span>
                        <nuxt-link class="link--default" :to="'/coins/' + tx.data.poolToken.symbol">{{ tx.data.poolToken.symbol }}</nuxt-link>
                    </dd>
                    <dt v-if="tx.data.coin0">First coin</dt>
                    <dd v-if="tx.data.coin0"><span v-if="isDefined(tx.data.volume0)">{{ prettyExact(tx.data.volume0) }}</span> {{ tx.data.coin0.symbol }} </dd>
                    <dt v-if="tx.data.coin1">Second coin</dt>
                    <dd v-if="tx.data.coin1"><span v-if="isDefined(tx.data.volume1)">{{ prettyExact(tx.data.volume1) }}</span> {{ tx.data.coin1.symbol }}</dd>
                    <!-- ADD_LIQUIDITY -->
                    <dt v-if="tx.data.maximumVolume1">Max volume of second coin</dt>
                    <dd v-if="tx.data.maximumVolume1">{{ prettyExact(tx.data.maximumVolume1) }} {{ tx.data.coin1.symbol }}</dd>
                    <!-- REMOVE_LIQUIDITY -->
                    <dt v-if="tx.data.minimumVolume0">Min volume of first coin</dt>
                    <dd v-if="tx.data.minimumVolume0">{{ prettyExact(tx.data.minimumVolume0) }} {{ tx.data.coin0.symbol }}</dd>
                    <dt v-if="tx.data.minimumVolume1">Min volume of second coin</dt>
                    <dd v-if="tx.data.minimumVolume1">{{ prettyExact(tx.data.minimumVolume1) }} {{ tx.data.coin1.symbol }}</dd>

                    <dt v-if="isDefined(tx.data.volume0) && isDefined(tx.data.volume1)">{{ tx.data.coin0.symbol }} price</dt>
                    <dd v-if="isDefined(tx.data.volume0) && isDefined(tx.data.volume1)">
                        {{ pretty(tx.data.volume1 / tx.data.volume0) }} {{ tx.data.coin1.symbol }}
                    </dd>
                    <dt v-if="isDefined(tx.data.volume0) && isDefined(tx.data.volume1)">{{ tx.data.coin1.symbol }} price</dt>
                    <dd v-if="isDefined(tx.data.volume0) && isDefined(tx.data.volume1)">
                        {{ pretty(tx.data.volume0 / tx.data.volume1) }} {{ tx.data.coin0.symbol }}
                    </dd>

                <!-- CREATE_COIN, RECREATE_COIN, EDIT_TICKER_OWNER, CREATE_TOKEN, RECREATE_TOKEN -->
                <dt v-if="tx.data.createdCoinId">Coin ID</dt>
                <dd v-if="tx.data.createdCoinId">{{ tx.data.createdCoinId }}</dd>
                <dt v-if="tx.data.name">Name</dt>
                <dd v-if="tx.data.name">{{ tx.data.name }}</dd>
                <dt v-if="tx.data.symbol">Symbol</dt>
                <dd v-if="tx.data.symbol">{{ tx.data.symbol }}</dd>
                <dt v-if="currentCoinSymbol && currentCoinSymbol !== tx.data.symbol">Symbol current</dt>
                <dd v-if="currentCoinSymbol && currentCoinSymbol !== tx.data.symbol">{{ currentCoinSymbol }}</dd>

                <dt v-if="tx.data.initialAmount">Initial amount</dt>
                <dd v-if="tx.data.initialAmount">{{ prettyExact(tx.data.initialAmount) }}</dd>
                <dt v-if="tx.data.initialReserve">Initial reserve</dt>
                <dd v-if="tx.data.initialReserve">{{ prettyExact(tx.data.initialReserve) }} {{ $store.getters.BASE_COIN }}</dd>
                <dt v-if="tx.data.constantReserveRatio">CRR</dt>
                <dd v-if="tx.data.constantReserveRatio">{{ tx.data.constantReserveRatio }}&thinsp;%</dd>
                <dt v-if="tx.data.maxSupply">Max supply</dt>
                <dd v-if="tx.data.maxSupply">{{ prettyExact(tx.data.maxSupply) }}</dd>
                <dt v-if="tx.data.newOwner">Owner address</dt>
                <dd v-if="tx.data.newOwner"><nuxt-link class="link--default" :to="'/address/' + tx.data.newOwner">{{ tx.data.newOwner }}</nuxt-link></dd>
                    <dt v-if="isDefined(tx.data.mintable)">Mintable</dt>
                    <dd v-if="isDefined(tx.data.mintable)">{{ tx.data.mintable ? 'Yes' : 'No' }}</dd>
                    <dt v-if="isDefined(tx.data.burnable)">Burnable</dt>
                    <dd v-if="isDefined(tx.data.burnable)">{{ tx.data.burnable ? 'Yes' : 'No' }}</dd>


                <!-- DELEGATE, UNBOND, DECLARE_CANDIDACY, SET_CANDIDATE_ONLINE, SET_CANDIDATE_OFFLINE, EDIT_CANDIDATE, EDIT_CANDIDATE_PUBLIC_KEY, EDIT_CANDIDATE_COMMISSION, VOTE_HALT_BLOCK, VOTE_UPDATE, VOTE_COMMISSION -->
                <dt v-if="validatorMeta.name">Validator</dt>
                <dd v-if="validatorMeta.name">
                    <nuxt-link class="u-icon-wrap-inline link--default" :to="'/validator/' + tx.data.pubKey">
                        <img v-if="validatorMeta.iconUrl" :src="validatorMeta.iconUrl" class="u-icon--coin" width="24" height="24" alt="" role="presentation">
                        {{ validatorMeta.name }}
                    </nuxt-link>
                </dd>
                <dt v-if="tx.data.pubKey">Public key</dt>
                <dd v-if="tx.data.pubKey"><nuxt-link class="link--default" :to="'/validator/' + tx.data.pubKey">{{ tx.data.pubKey }}</nuxt-link></dd>
                    <dt v-if="tx.data.newPubKey">New public key</dt>
                    <dd v-if="tx.data.newPubKey"><nuxt-link class="link--default" :to="'/validator/' + tx.data.newPubKey">{{ tx.data.newPubKey }}</nuxt-link></dd>
                    <dt v-if="isStakeType && isDefined(tx.data.stake || tx.data.value)">Stake</dt>
                    <Amount tag="dd"
                            v-if="isStakeType && isDefined(tx.data.stake || tx.data.value)"
                            :amount="tx.data.stake || tx.data.value"
                            :coin="tx.data.coin.symbol"
                            :exact="true"
                    />
                <dt v-if="isDefined(tx.data.commission)">Commission</dt>
                <dd v-if="isDefined(tx.data.commission)">{{ tx.data.commission }}&thinsp;%</dd>
                <dt v-if="isUnbondType">Unbond block</dt>
                <dd v-if="isUnbondType">{{ prettyRound(unbondBlockHeight) }}</dd>
                <dt v-if="isUnbondType && unbondTimeInfo">Unbond time</dt>
                <dd v-if="isUnbondType && unbondTimeInfo">
                    <span v-if="!unbondTimeInfo.isFutureBlock">{{ timeDistance(unbondTimeInfo.timestamp) }} ago ({{ time(unbondTimeInfo.timestamp) }})</span>
                    <span v-else>In {{ timeDistanceFuture(unbondTimeInfo.timestamp) }} ({{ timeMinutes(unbondTimeInfo.timestamp) }})</span>
                </dd>
                <dt v-if="tx.data.rewardAddress">Reward address</dt>
                <dd v-if="tx.data.rewardAddress"><nuxt-link class="link--default" :to="'/address/' + tx.data.rewardAddress">{{ tx.data.rewardAddress }}</nuxt-link></dd>
                <dt v-if="tx.data.ownerAddress">Owner address</dt>
                <dd v-if="tx.data.ownerAddress"><nuxt-link class="link--default" :to="'/address/' + tx.data.ownerAddress">{{ tx.data.ownerAddress }}</nuxt-link></dd>
                    <dt v-if="tx.data.controlAddress">Control address</dt>
                    <dd v-if="tx.data.controlAddress"><nuxt-link class="link--default" :to="'/address/' + tx.data.controlAddress">{{ tx.data.controlAddress }}</nuxt-link></dd>
                    <dt v-if="isDefined(tx.data.height)">Vote height</dt>
                    <dd v-if="isDefined(tx.data.height)">{{ tx.data.height }}</dd>
                    <dt v-if="isDefined(tx.data.height) && voteTimeInfo">Height time</dt>
                    <dd v-if="isDefined(tx.data.height) && voteTimeInfo">
                        <span v-if="!voteTimeInfo.isFutureBlock">{{ timeDistance(voteTimeInfo.timestamp) }} ago ({{ time(voteTimeInfo.timestamp) }})</span>
                        <span v-else>In {{ timeDistanceFuture(voteTimeInfo.timestamp) }} ({{ timeMinutes(voteTimeInfo.timestamp) }})</span>
                    </dd>
                    <dt v-if="isDefined(tx.data.version)">Version</dt>
                    <dd v-if="isDefined(tx.data.version)">{{ tx.data.version }}</dd>
                    <dt v-if="isTxType($options.TX_TYPE.VOTE_COMMISSION)">Vote coin</dt>
                    <dd v-if="isTxType($options.TX_TYPE.VOTE_COMMISSION)">{{ tx.data.coin.symbol }}</dd>
                    <dt v-if="isTxType($options.TX_TYPE.VOTE_COMMISSION)">Vote prices</dt>
                    <dd v-if="isTxType($options.TX_TYPE.VOTE_COMMISSION)" class="dd u-text-pre-line">{{ commissionPriceList }}</dd>
                    <!-- @TODO UPDATE_COMMISSION -->

                <!-- REDEEM_CHECK -->
                <dt v-if="tx.data.check && tx.data.check.sender">Check issuer</dt>
                <dd v-if="tx.data.check && tx.data.check.sender"><nuxt-link class="link--default" :to="'/address/' + tx.data.check.sender">{{ tx.data.check.sender }}</nuxt-link></dd>
                <dt v-if="tx.data.check && tx.data.check.nonce">Check nonce</dt>
                <dd v-if="tx.data.check && tx.data.check.nonce">{{ fromBase64(tx.data.check.nonce) }}</dd>
                <dt v-if="tx.data.check && tx.data.check.dueBlock">Due Block</dt>
                <dd v-if="tx.data.check && tx.data.check.dueBlock">{{ tx.data.check.dueBlock }}</dd>
                    <dt v-if="tx.data.check && tx.data.check.value">Amount</dt>
                    <Amount tag="dd"
                            v-if="tx.data.check && tx.data.check.value"
                            :amount="tx.data.check.value"
                            :coin="tx.data.check.coin.symbol"
                            :exact="true"
                    />
                    <dt v-if="tx.data.rawCheck">Check</dt>
                    <dd v-if="tx.data.rawCheck">{{ checkFromBase64(tx.data.rawCheck) }}</dd>

                <!-- MULTISEND -->
                <dt v-if="tx.data.list">#Recipients</dt>
                <dd v-if="tx.data.list">{{ tx.data.list.length }}</dd>
                <dt v-if="isMultisendType">Total</dt>
                <dd v-if="isMultisendType">
                    <span v-if="isMultisendMultipleCoin(tx)">Multiple coins</span>
                    <span v-else>{{ getMultisendCoin(tx) }} {{ getMultisendValue(tx) }}</span>
                </dd>

                <!-- CREATE MULTISIG -->
                <dt v-if="tx.data.multisigAddress">Multisig</dt>
                <dd v-if="tx.data.multisigAddress">
                    <nuxt-link class="link--default" :to="'/address/' + tx.data.multisigAddress">{{ tx.data.multisigAddress }}</nuxt-link>
                </dd>
                <dt v-if="tx.data.threshold">Threshold</dt>
                <dd v-if="tx.data.threshold">{{ tx.data.threshold }}</dd>
                <dt v-if="tx.data.weights">Weights Sum</dt>
                <dd v-if="tx.data.weights">{{ tx.data.weights.reduce((prev, next) => Number(prev) + Number(next)) }}</dd>

                    <!-- HUB -->
                    <dt v-if="isFromHubTx || isToHubTx">Purpose</dt>
                    <dd v-if="isFromHubTx || isToHubTx">
                        <template v-if="isFromHubTx">Deposit from Hub</template>
                        <template v-if="isToHubTx">Withdraw to Hub</template>
                    </dd>
                    <dt v-if="isToHubTx">Hub info</dt>
                    <dd v-if="isToHubTx">
                        Type: {{ payloadParsed.type === 'send_to_eth' ? 'Send to Ethereum' : payloadParsed.type }}<br>
                        Recipient:
                        <a class="link--default" :href="getEtherscanAddressUrl(payloadParsed.recipient)" target="_blank">{{ payloadParsed.recipient }}</a><br>
                        Amount: {{ prettyExact(hubAmount) }} {{ tx.data.coin.symbol }}<br>
                        Ethereum fee: {{ prettyExact(hubNetworkFee) }} {{ tx.data.coin.symbol }}<br>
                        Hub bridge fee (1%): {{ prettyExact(hubBridgeFee) }} {{ tx.data.coin.symbol }}
                        <!-- @TODO show ETH tx hash -->
                    </dd>


                <dt v-if="tx.commissionInBaseCoin">Fee</dt>
                <dd v-if="tx.commissionInBaseCoin">
                    <template v-if="tx.gasCoin.symbol === $store.getters.BASE_COIN">
                        {{ prettyExact(tx.commissionInBaseCoin) }} {{ $store.getters.BASE_COIN }}
                    </template>
                    <template v-else>
                        {{ prettyExact(tx.commissionInGasCoin) }} {{ tx.gasCoin.symbol }} <span class="u-text-muted">({{ prettyExact(tx.commissionInBaseCoin) }} {{ $store.getters.BASE_COIN }})</span>
                    </template>
                </dd>
                    <dt v-if="tx.commissionPriceCoin.id > 0">Fee price</dt>
                    <dd v-if="tx.commissionPriceCoin.id > 0">
                        {{ prettyExact(tx.commissionPrice) }} {{ tx.commissionPriceCoin.symbol }}
                    </dd>
                    <dt>Fee multiplier</dt>
                    <dd>
                        {{ tx.gasPrice }}
                    </dd>

                <dt v-if="tx.nonce">Nonce</dt>
                <dd v-if="tx.nonce">{{ tx.nonce }}</dd>

                <dt>Message</dt>
                <dd class="dd u-text-pre-line" :class="{'u-text-muted': !tx.payload }">{{ tx.payload ? fromBase64(tx.payload) : 'Blank' }}</dd>

                </template>
                <template v-if="tx.status === $options.TX_STATUS.FAILURE">
                    <dt>Error code</dt>
                    <dd>{{ tx.code }}</dd>

                    <dt>Error log</dt>
                    <dd>{{ tx.log }}</dd>
                </template>

                <!-- MULTISEND -->
                <table class="table--recipient-list" v-if="tx.data.list && tx.data.list.length">
                    <thead>
                    <tr>
                        <th>To</th>
                        <th>Value</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="(transfer, index) in tx.data.list" :key="index">
                        <td>
                            <TableLink
                                :link-text="transfer.to"
                                :link-path="'/address/' + transfer.to"
                                :should-not-shorten="!shouldShortenAddress"
                            />
                        </td>
                        <td>
                            <Amount :amount="transfer.value"
                                    :coin="transfer.coin.symbol"
                                    :exact="true"
                                    :coinFirst="true"
                            />
                        </td>
                    </tr>
                    </tbody>
                </table>

                <!-- CREATE MULTISIG -->
                <table class="table--recipient-list" v-if="tx.data.addresses && tx.data.addresses.length">
                    <thead>
                    <tr>
                        <th>Participant address</th>
                        <th>Weight</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="(address, index) in tx.data.addresses" :key="index">
                        <td>
                            <TableLink
                                    :link-text="address"
                                    :link-path="'/address/' + address"
                                    :should-not-shorten="!shouldShortenAddress"
                            />
                        </td>
                        <td>{{ tx.data.weights[index] }}</td>
                    </tr>
                    </tbody>
                </table>
            </dl>
        </section>
        <h1 class="u-text-center" style="margin-top: 50px;" v-else>
            Transaction not found yet <br>
            <svg class="loader" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28"  style="margin-top: 20px;">
                <circle class="loader__path" cx="14" cy="14" r="12"></circle>
            </svg>
        </h1>
    </div>
</template>
