<script>
    import Big from '~/assets/big.js';
    import {TX_TYPE} from 'minterjs-util/src/tx-types.js';
    import {getTimeDistance, getTime, pretty, prettyRound, getExplorerValidatorUrl, txTypeFilter, shortFilter, fromBase64} from '~/assets/utils.js';
    import {LOCK_STAKE_PERIOD, UNBOND_PERIOD} from '~/assets/variables';
    import PoolLink from '~/components/common/PoolLink.vue';
    import TableLink from '~/components/TableLink';

    export default {
        TX_TYPE,
        UNBOND_PERIOD,
        components: {
            PoolLink,
            TableLink,
        },
        filters: {
            pretty,
            txType: txTypeFilter,
            short: shortFilter,
        },
        props: {
            /** @type Array<Transaction>*/
            txList: {
                type: Array,
                required: true,
            },
            currentAddress: {
                type: String,
            },
            currentValidator: {
                type: String,
            },
            currentBlock: {
                type: Number,
            },
            isLoading: {
                type: Boolean,
                default: false,
            },
        },
        data() {
            return {
                isTxExpanded: {/* {txn: boolean} */},
            };
        },
        computed: {
            txListFormatted() {
                return this.txList.map((tx) => {
                    return {
                        ...tx,
                        timeDistance:  getTimeDistance(tx.timestamp),
                        timeLocal: getTime(tx.timestamp),
                    };
                });
            },
        },
        methods: {
            pretty,
            prettyRound,
            getExplorerValidatorUrl,
            fromBase64,
            isCurrentAddress(address) {
                return address === this.currentAddress;
            },
            isCurrentValidator(publicKey) {
                return publicKey === this.currentValidator;
            },
            isCurrentBlock(height) {
                return height === this.currentBlock;
            },
            getDueBlockHeight(tx) {
                if (this.isTxType(tx, TX_TYPE.LOCK_STAKE)) {
                    return tx.height + LOCK_STAKE_PERIOD;
                }
                return tx?.data?.dueBlock || tx?.check?.dueBlock;
            },
            isDefined(value) {
                return typeof value !== 'undefined';
            },
            toggleTx(txn) {
                this.$set(this.isTxExpanded, txn, !this.isTxExpanded[txn]);
            },
            isSell(tx) {
                return this.isTxType(tx, TX_TYPE.SELL) || this.isTxType(tx, TX_TYPE.SELL_ALL);
            },
            isSellPool(tx) {
                return this.isTxType(tx, TX_TYPE.SELL_SWAP_POOL) || this.isTxType(tx, TX_TYPE.SELL_ALL_SWAP_POOL);
            },
            isBuy(tx) {
                return this.isTxType(tx, TX_TYPE.BUY);
            },
            isBuyPool(tx) {
                return this.isTxType(tx, TX_TYPE.BUY_SWAP_POOL);
            },
            isAddOrder(tx) {
                return this.isTxType(tx, TX_TYPE.ADD_LIMIT_ORDER);
            },
            isUnbond(tx) {
                return this.isTxType(tx, TX_TYPE.UNBOND);
            },
            isMultisend(tx) {
                return this.isTxType(tx, TX_TYPE.MULTISEND);
            },
            isTxType(tx, txType) {
                return tx.type === Number(txType);
            },
            isIncomeMultisend(tx) {
                if (!this.isMultisend(tx)) {
                    return;
                }
                const isOutcomeMultisend = this.currentAddress === tx.from;
                return !isOutcomeMultisend;
            },
            isIncomeSend(tx) {
                return this.currentAddress === tx.data.to && tx.from !== tx.data.to;
            },
            isReceive(tx) {
                return this.currentAddress && (this.isIncomeSend(tx) || this.isIncomeMultisend(tx));
            },
            getAmount(tx) {
                return tx.data.value
                    || this.getConvertValue(tx)
                    || tx.data.stake
                    || tx.data.initialAmount
                    || (tx.data.check && tx.data.check.value)
                    || this.getMultisendValue(tx);
            },
            getRecipient(tx) {
                if (tx.data.to) {
                    return tx.data.to;
                }
                // single recipient
                if (this.isMultisend(tx) && !this.isMultisendMultipleRecipients(tx)) {
                    return tx.data.list[0].to;
                }
            },
            hasAmount(tx) {
                return typeof this.getAmount(tx) !== 'undefined';
            },
            getAmountWithCoin(tx) {
                if (this.isMultisend(tx) && this.isMultisendMultipleCoin(tx)) {
                    return 'Multiple coins';
                } else {
                    return (tx.data.coin?.symbol || tx.data.symbol || this.getConvertCoinSymbol(tx) || tx.data.check?.coin.symbol || this.getMultisendCoin(tx)) + ' ' + pretty(this.getAmount(tx) || 0);
                }
            },
            getConvertCoinSymbol(tx) {
                if (this.isSell(tx)) {
                    return tx.data.coinToSell.symbol;
                }
                if (this.isBuy(tx)) {
                    return tx.data.coinToBuy.symbol;
                }
                if (this.isSellPool(tx)) {
                    return tx.data.coins[0].symbol;
                }
                if (this.isBuyPool(tx)) {
                    return tx.data.coins[tx.data.coins.length - 1].symbol;
                }
            },
            getConvertValue(tx) {
                if (this.isSell(tx) || this.isSellPool(tx)) {
                    return tx.data.valueToSell;
                }
                if (this.isBuy(tx) || this.isBuyPool(tx)) {
                    return tx.data.valueToBuy;
                }
            },
            isEditPool(tx) {
                return this.isTxType(tx, TX_TYPE.CREATE_SWAP_POOL) || this.isTxType(tx, TX_TYPE.ADD_LIQUIDITY) || this.isTxType(tx, TX_TYPE.REMOVE_LIQUIDITY);
            },
            isMultisendMultipleRecipients(tx) {
                if (!this.isMultisend(tx)) {
                    return;
                }
                const hasDifferentRecipient = tx.data.list.some((item) => item.to !== tx.data.list[0].to);
                return hasDifferentRecipient;
            },
            getMultisendDeliveryList(tx) {
                if (!this.currentAddress) {
                    return tx.data.list || [];
                }
                const isOutcomeMultisend = !this.isIncomeMultisend(tx);
                return isOutcomeMultisend ? tx.data.list : tx.data.list.filter((delivery) => {
                    return this.currentAddress === delivery.to;
                });
            },
            isMultisendMultipleCoin(tx) {
                if (!this.isMultisend(tx)) {
                    return;
                }
                const currentUserDeliveryList = this.getMultisendDeliveryList(tx);
                return currentUserDeliveryList.some((delivery) => {
                    return delivery.coin.id !== currentUserDeliveryList[0].coin.id;
                });
            },
            getMultisendCoin(tx) {
                if (!this.isMultisend(tx)) {
                    return;
                }
                if (!this.isMultisendMultipleCoin(tx)) {
                    return this.getMultisendDeliveryList(tx)[0].coin.symbol;
                }
            },
            getMultisendValue(tx) {
                if (!this.isMultisend(tx)) {
                    return;
                }
                const currentUserDeliveryList = this.getMultisendDeliveryList(tx);
                if (this.isMultisendMultipleCoin(tx)) {
                    return '...';
                } else {
                    return currentUserDeliveryList.reduce((accumulator, delivery) => accumulator.plus(new Big(delivery.value)), new Big(0)).toString();
                }
            },
            getValidatorName(tx) {
                if (!tx.data.pubKey) {
                    return;
                }
                const validator = this.$store.state.validatorMetaList.find((validatorItem) => validatorItem.publicKey === tx.data.pubKey);
                return validator && validator.name;
            },
        },
    };
</script>

<template>
    <div class="table-wrap">
        <div class="panel__content panel__section u-text-center" v-if="isLoading">
            <svg class="loader" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28">
                <circle class="loader__path" cx="14" cy="14" r="12"></circle>
            </svg>
        </div>
        <table v-else-if="txList.length">
            <thead>
            <tr>
                <th>TxHash</th>
                <th>Block</th>
                <th>Age</th>
                <th>From</th>
                <th>Type</th>
                <th>Value</th>
                <th class="table__controls-cell"></th>
            </tr>
            </thead>
            <tbody>
            <template v-for="tx in txListFormatted">
                <tr class="u-text-nowrap" :class="{'is-expanded': isTxExpanded[tx.txn]}" :key="tx.txn">
                    <!-- hash -->
                    <td>
                        <TableLink :link-text="tx.hash" :link-path="'/transactions/' + tx.hash"/>
                    </td>
                    <!-- block -->
                    <td>
                        <TableLink :link-text="prettyRound(tx.height)" :link-path="'/blocks/' + tx.height" :is-not-link="isCurrentBlock(tx.height)" :should-not-shorten="true"/>
                    </td>
                    <!-- age -->
                    <td>{{ tx.timeDistance }} ago</td>
                    <!-- from -->
                    <td>
                        <TableLink :link-text="tx.from"
                                   :link-path="'/address/' + tx.from"
                                   :is-not-link="isCurrentAddress(tx.from)"
                        />
                    </td>
                    <!-- type -->
                    <td>
                        <span v-if="isReceive(tx)">Receive</span>
                        <span v-else>{{ tx.type | txType }}</span>
                    </td>
                    <!-- amount -->
                    <td>
                        <template v-if="hasAmount(tx)">
                            {{ getAmountWithCoin(tx) }}
                        </template>
                        <PoolLink v-else-if="isEditPool(tx)" :pool="tx.data"/>
                        <PoolLink v-else-if="isAddOrder(tx)" :pool="{coin0: tx.data.coinToSell, coin1: tx.data.coinToBuy}"/>
                    </td>
                    <!--expand button -->
                    <td class="table__controls-cell">
                        <button class="table__controls-button table__controls-button--expand u-semantic-button" :class="{'is-expanded': isTxExpanded[tx.txn]}" @click="toggleTx(tx.txn)">Show Tx Data</button>
                    </td>
                </tr>
                <tr class="table__row-expanded-data" :key="tx.txn + 'exp'" v-if="isTxExpanded[tx.txn]">
                    <td colspan="7">
                        <div class="table__inner">
                            <!-- type SEND, MULTISEND -->
                            <div class="table__inner-item" v-if="getRecipient(tx) || (isMultisend(tx) && !isIncomeMultisend(tx))">
                                <strong>To</strong> <br>
                                <TableLink :link-text="getRecipient(tx)"
                                           :link-path="'/address/' + getRecipient(tx)"
                                           :is-not-link="isCurrentAddress(getRecipient(tx))"
                                           :should-not-shorten="true"
                                           v-if="getRecipient(tx)"
                                />
                                <!-- outcome multisend -->
                                <span v-else>{{ tx.data.list.length }} recipients</span>
                            </div>

                            <!-- SELL, SELL_ALL -->
                            <div class="table__inner-item" v-if="isSell(tx)">
                                <strong>Sell coins</strong> <br>
                                {{ tx.data.coinToSell.symbol }} {{ tx.data.valueToSell | pretty }}
                            </div>
                            <div class="table__inner-item" v-if="isSell(tx)">
                                <strong>Get coins</strong> <br>
                                {{ tx.data.coinToBuy.symbol }} {{ tx.data.valueToBuy | pretty  }}
                            </div>
                            <!-- SELL_SWAP_POOL, SELL_ALL_SWAP_POOL -->
                            <div class="table__inner-item" v-if="isSellPool(tx)">
                                <strong>Sell coins</strong> <br>
                                {{ tx.data.coins[0].symbol }} {{ tx.data.valueToSell | pretty }}
                            </div>
                            <div class="table__inner-item" v-if="isSellPool(tx)">
                                <strong>Get coins</strong> <br>
                                {{ tx.data.coins[tx.data.coins.length - 1].symbol }} {{ tx.data.valueToBuy | pretty  }}
                            </div>
                            <!-- BUY -->
                            <div class="table__inner-item" v-if="isBuy(tx)">
                                <strong>Buy coins</strong> <br>
                                {{ tx.data.coinToBuy.symbol }} {{ tx.data.valueToBuy | pretty }}
                            </div>
                            <div class="table__inner-item" v-if="isBuy(tx)">
                                <strong>Spend coins</strong> <br>
                                {{ tx.data.coinToSell.symbol }} {{ pretty(tx.data.valueToSell) }}
                            </div>
                            <!-- BUY_SWAP_POOL -->
                            <div class="table__inner-item" v-if="isBuyPool(tx)">
                                <strong>Buy coins</strong> <br>
                                {{ tx.data.coins[tx.data.coins.length - 1].symbol }} {{ tx.data.valueToBuy | pretty }}
                            </div>
                            <div class="table__inner-item" v-if="isBuyPool(tx)">
                                <strong>Spend coins</strong> <br>
                                {{ tx.data.coins[0].symbol }} {{ pretty(tx.data.valueToSell) }}
                            </div>

                            <div class="table__inner-item" v-if="isBuyPool(tx) || isSellPool(tx)">
                                <strong>Route</strong> <br>
                                <span v-for="(coinPathItem, coinPathIndex) in tx.data.coins" :key="coinPathItem.id + '-' + coinPathIndex">
                                    {{ coinPathItem.symbol }}<span v-if="coinPathIndex !== tx.data.coins.length - 1"> -> </span>
                                </span>
                            </div>

                            <!-- ADD_LIMIT_ORDER -->
                            <div class="table__inner-item" v-if="isAddOrder(tx)">
                                <strong>Want to sell</strong> <br>
                                {{ tx.data.coinToSell.symbol }} {{ pretty(tx.data.valueToSell) }}
                            </div>
                            <div class="table__inner-item" v-if="isAddOrder(tx)">
                                <strong>Want to buy</strong> <br>
                                {{ tx.data.coinToBuy.symbol }} {{ pretty(tx.data.valueToBuy) }}
                            </div>

                            <!-- ADD_LIMIT_ORDER, REMOVE_LIMIT_ORDER -->
                            <div class="table__inner-item" v-if="tx.data.id || tx.data.orderId">
                                <strong>Order ID</strong> <br>
                                {{ tx.data.id || tx.data.orderId }}
                            </div>

                            <!-- CREATE_SWAP_POOL, ADD_LIQUIDITY, REMOVE_LIQUIDITY -->
                            <div class="table__inner-item" v-if="isDefined(tx.data.coin0)">
                                <strong>First coin</strong> <br>
                                {{ tx.data.coin0.symbol }} <span v-if="tx.data.volume0">{{ pretty(tx.data.volume0) }}</span>
                            </div>
                            <div class="table__inner-item" v-if="isDefined(tx.data.coin1)">
                                <strong>Second coin</strong> <br>
                                {{ tx.data.coin1.symbol }} <span v-if="tx.data.volume1">{{ pretty(tx.data.volume1) }} </span>
                            </div>
                            <div class="table__inner-item" v-if="isDefined(tx.data.liquidity)">
                                <strong>LP amount</strong> <br>
                                {{ pretty(tx.data.liquidity) }}
                            </div>

                            <!-- type CREATE_COIN, RECREATE_COIN, EDIT_TICKER_OWNER, CREATE_TOKEN, RECREATE_TOKEN -->
                            <div class="table__inner-item" v-if="tx.data.createdCoinId">
                                <strong>Coin ID</strong> <br>
                                {{ tx.data.createdCoinId }}
                            </div>
                            <div class="table__inner-item" v-if="tx.data.name">
                                <strong>Name</strong> <br>
                                {{ tx.data.name }}
                            </div>
                            <div class="table__inner-item" v-if="tx.data.symbol">
                                <strong>Symbol</strong> <br>
                                {{ tx.data.symbol }}
                            </div>
                            <div class="table__inner-item" v-if="tx.data.initialAmount">
                                <strong>Initial amount</strong> <br>
                                {{ tx.data.initialAmount | pretty }}
                            </div>
                            <div class="table__inner-item" v-if="tx.data.initialReserve">
                                <strong>Initial reserve</strong> <br>
                                {{ tx.data.initialReserve | pretty }}
                            </div>
                            <div class="table__inner-item" v-if="tx.data.constantReserveRatio">
                                <strong>CRR</strong> <br>
                                {{ tx.data.constantReserveRatio }}&thinsp;%
                            </div>
                            <div class="table__inner-item" v-if="tx.data.maxSupply">
                                <strong>Max supply</strong> <br>
                                {{ prettyRound(tx.data.maxSupply) }}
                            </div>
                            <div class="table__inner-item" v-if="tx.data.newOwner">
                                <strong>Owner address</strong> <br>
                                <TableLink :link-text="tx.data.newOwner"
                                           :link-path="'/address/' + tx.data.newOwner"
                                           :is-not-link="isCurrentAddress(tx.data.newOwner)"
                                           :should-not-shorten="true"
                                />
                            </div>
                            <div class="table__inner-item" v-if="tx.data.mintable">
                                <strong>Mintable</strong> <br>
                                {{ tx.data.mintable ? 'Yes' : 'No' }}
                            </div>
                            <div class="table__inner-item" v-if="tx.data.burnable">
                                <strong>Burnable</strong> <br>
                                {{ tx.data.burnable ? 'Yes' : 'No' }}
                            </div>

                            <!-- type DECLARE_CANDIDACY, EDIT_CANDIDATE, DELEGATE, UNBOND, SET_CANDIDATE_ONLINE, SET_CANDIDATE_OFFLINE, EDIT_CANDIDATE_PUBLIC_KEY, EDIT_CANDIDATE_COMMISSION, VOTE_HALT_BLOCK, VOTE_UPDATE, VOTE_COMMISSION -->
                            <div class="table__inner-item" v-if="getValidatorName(tx)">
                                <strong>Validator</strong> <br>
                                <TableLink :link-text="getValidatorName(tx)"
                                           :link-path="getExplorerValidatorUrl(tx.data.pubKey)"
                                           :is-not-link="isCurrentValidator(tx.data.pubKey)"
                                           :should-not-shorten="true"
                                />
                            </div>
                            <div class="table__inner-item" v-if="tx.data.pubKey">
                                <strong>Public key</strong> <br>
                                <TableLink :link-text="tx.data.pubKey"
                                           :link-path="getExplorerValidatorUrl(tx.data.pubKey)"
                                           :is-not-link="isCurrentValidator(tx.data.pubKey)"
                                           :should-not-shorten="true"
                                />
                            </div>
                            <div class="table__inner-item" v-if="tx.data.newPubKey">
                                <strong>New public key</strong> <br>
                                <TableLink :link-text="tx.data.newPubKey"
                                           :link-path="getExplorerValidatorUrl(tx.data.newPubKey)"
                                           :is-not-link="isCurrentValidator(tx.data.newPubKey)"
                                           :should-not-shorten="true"
                                />
                            </div>
                            <div class="table__inner-item" v-if="isDefined(tx.data.stake)">
                                <strong>Stake</strong> <br>
                                {{ tx.data.coin.symbol }} {{ tx.data.stake | pretty }}
                            </div>
                            <div class="table__inner-item" v-if="isDefined(tx.data.commission)">
                                <strong>Commission</strong> <br>
                                {{ tx.data.commission }}&thinsp;%
                            </div>
                            <div class="table__inner-item" v-if="isUnbond(tx)">
                                <strong>Unbond block</strong> <br>
                                {{ prettyRound(tx.height + $options.UNBOND_PERIOD) }}
                            </div>
                            <div class="table__inner-item" v-if="tx.data.ownerAddress">
                                <strong>Owner address</strong> <br>
                                <TableLink :link-text="tx.data.ownerAddress"
                                           :link-path="'/address/' + tx.data.ownerAddress"
                                           :is-not-link="isCurrentAddress(tx.data.ownerAddress)"
                                />
                            </div>
                            <div class="table__inner-item" v-if="tx.data.rewardAddress">
                                <strong>Reward address</strong> <br>
                                <TableLink :link-text="tx.data.rewardAddress"
                                           :link-path="'/address/' + tx.data.rewardAddress"
                                           :is-not-link="isCurrentAddress(tx.data.rewardAddress)"
                                />
                            </div>
                            <div class="table__inner-item" v-if="tx.data.controlAddress">
                                <strong>Control address</strong> <br>
                                <TableLink :link-text="tx.data.controlAddress"
                                           :link-path="'/address/' + tx.data.controlAddress"
                                           :is-not-link="isCurrentAddress(tx.data.controlAddress)"
                                />
                            </div>
                            <div class="table__inner-item" v-if="isDefined(tx.data.commission)">
                                <strong>Commission</strong> <br>
                                {{ tx.data.commission }}&thinsp;%
                            </div>
                            <div class="table__inner-item" v-if="isDefined(tx.data.height)">
                                <strong>Block height</strong> <br>
                                {{ tx.data.height }}
                            </div>
                            <div class="table__inner-item" v-if="isDefined(tx.data.version)">
                                <strong>Version</strong> <br>
                                {{ tx.data.version }}
                            </div>

                            <!-- MOVE_STAKE -->
                            <div class="table__inner-item" v-if="tx.data.fromPubKey">
                                <strong>From public key</strong> <br>
                                <TableLink :link-text="tx.data.fromPubKey"
                                           :link-path="getExplorerValidatorUrl(tx.data.fromPubKey)"
                                           :is-not-link="isCurrentValidator(tx.data.fromPubKey)"
                                           :should-not-shorten="true"
                                />
                            </div>
                            <div class="table__inner-item" v-if="tx.data.toPubKey">
                                <strong>To public key</strong> <br>
                                <TableLink :link-text="tx.data.toPubKey"
                                           :link-path="getExplorerValidatorUrl(tx.data.toPubKey)"
                                           :is-not-link="isCurrentValidator(tx.data.toPubKey)"
                                           :should-not-shorten="true"
                                />
                            </div>

                            <!-- type REDEEM_CHECK -->
                            <div class="table__inner-item" v-if="tx.data.check && tx.data.check.sender">
                                <strong>Check issuer</strong> <br>
                                <TableLink :link-text="tx.data.check.sender"
                                           :link-path="'/address/' + tx.data.check.sender"
                                           :is-not-link="isCurrentAddress(tx.data.check.sender)"
                                           :should-not-shorten="true"
                                />
                            </div>
                            <div class="table__inner-item" v-if="tx.data.check && tx.data.check.nonce">
                                <strong>Check nonce</strong> <br>
                                {{ fromBase64(tx.data.check.nonce) }}
                            </div>
                            <div class="table__inner-item" v-if="getDueBlockHeight(tx)">
                                <strong>Due block</strong> <br>
                                {{ prettyRound(getDueBlockHeight(tx)) }}
                            </div>

                            <!-- type CREATE_MULTISIG -->
                            <div class="table__inner-item" v-if="tx.data.multisigAddress">
                                <strong>Multisig address</strong> <br>
                                <TableLink :link-text="tx.data.multisigAddress"
                                           :link-path="'/address/' + tx.data.multisigAddress"
                                           :should-not-shorten="true"
                                />
                            </div>

                            <!-- timestamp -->
                            <div class="table__inner-item">
                                <strong>Timestamp</strong> <br>
                                {{ tx.timeLocal }}
                            </div>

                            <!-- fee -->
                            <div class="table__inner-item">
                                <strong>Fee</strong> <br>
                                {{ $store.state.COIN_NAME }} {{ tx.fee | pretty }}
                            </div>

                            <!-- message -->
                            <div class="table__inner-item u-text-wrap-anywhere" v-if="tx.payload">
                                <strong>Message</strong> <br>
                                {{ fromBase64(tx.payload) }}
                            </div>
                        </div>
                    </td>
                </tr>
            </template>
            </tbody>
        </table>
        <div class="panel__content panel__section u-text-center" v-else>No transactions</div>
    </div>
</template>
