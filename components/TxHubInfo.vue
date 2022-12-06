<script>
import Big from '~/assets/big.js';
import {convertFromPip} from "minterjs-util/src/converter.js";
import {getTransferFee, getTransferStatus} from '~/api/hub.js';
import {prettyExact, shortHashFilter, getEvmTxUrl, getEvmAddressUrl} from "~/assets/utils.js";
import { HUB_MINTER_MULTISIG_ADDRESS, HUB_CHAIN_DATA, HUB_TRANSFER_STATUS as WITHDRAW_STATUS} from "~/assets/variables.js";

const HUB_ADDRESS = HUB_MINTER_MULTISIG_ADDRESS;


export default {
    WITHDRAW_STATUS,
    props: {
        tx: {
            type: Object,
            required: true,
        },
        payloadParsed: {
            type: Object,
            required: true,
        },
    },
    fetch() {
        if (this.isToHubTx) {
            this.fetchHubTxFee();
            this.fetchHubTxStatus();
        }
    },
    data() {
        return {
            hubFee: null,
            hubStatus: null,
        };
    },
    computed: {
        isFromHubTx() {
            return this.tx?.from === HUB_ADDRESS;
        },
        isToHubTx() {
            if (this.tx?.data.to === HUB_ADDRESS) {
                const hubTypes = Object.keys(HUB_CHAIN_DATA).map((item) => `send_to_${item}`);
                return hubTypes.includes(this.payloadParsed?.type);
            }
            return false;
        },
        /** @type {HubChainDataItem}*/
        hubNetworkData() {
            if (!this.isToHubTx) {
                return undefined;
            }
            const networkName = this.payloadParsed.type.replace('send_to_', '');
            return HUB_CHAIN_DATA[networkName];
        },
        hubNetworkFee() {
            if (!this.isToHubTx) {
                return 0;
            }

            return convertFromPip(this.payloadParsed.fee);
        },
        hubNetworkFeeUsed() {
            if (!this.isToHubTx || !this.hubFee) {
                return 0;
            }

            return this.hubFee.networkFee;
        },
        hubNetworkFeeRefunded() {
            if (!this.isToHubTx || !this.hubFee) {
                return 0;
            }

            return new Big(this.hubNetworkFee).minus(this.hubNetworkFeeUsed).toString();
        },
        hubBridgeFee() {
            if (!this.isToHubTx) {
                return 0;
            }

            if (this.hubFee) {
                return this.hubFee.bridgeFee;
            }

            return new Big(this.tx.data.value).times(0.01).toString();
        },
        hubBridgePercent() {
            if (!this.isToHubTx || !this.hubFee) {
                return 1;
            }

            return new Big(this.hubFee.bridgeFee).div(this.tx.data.value).times(100).toString(2);
        },
        hubAmount() {
            if (!this.isToHubTx) {
                return;
            }

            return new Big(this.tx.data.value).minus(this.hubBridgeFee).minus(this.hubNetworkFee).toString();
        },
    },
    methods: {
        prettyExact,
        shortHashFilter,
        getWithdrawTxUrl(hash) {
            return getEvmTxUrl(this.hubNetworkData?.chainId, hash);
        },
        getWithdrawRecipientUrl(address) {
            return getEvmAddressUrl(this.hubNetworkData?.chainId, address);
        },
        fetchHubTxFee() {
            getTransferFee(this.tx.hash)
                .then((transferFee) => {
                    this.hubFee = {
                        bridgeFee: transferFee.valCommission,
                        networkFee: transferFee.externalFee,
                    };
                })
                .catch((e) => {
                    console.log('Unable to get Hub tx fee', e);
                });
        },
        fetchHubTxStatus() {
            getTransferStatus(this.tx.hash)
                .then((transferStatus) => {
                    this.hubStatus = transferStatus;
                })
                .catch((e) => {
                    console.log('Unable to get Hub tx status', e);
                });
        },
    },
};

</script>

<template>
    <div v-if="isFromHubTx || isToHubTx" style="display: contents;">
        <dt>Purpose</dt>
        <dd>
            <template v-if="isFromHubTx">Deposit from Hub</template>
            <template v-if="isToHubTx">Withdraw to Hub</template>
        </dd>
        <dt v-if="isToHubTx">Hub info</dt>
        <dd v-if="isToHubTx">
            Type: {{ payloadParsed.type.includes('send_to_') ? `Send to ${hubNetworkData.shortName}` : payloadParsed.type }}
            <div v-if="hubStatus">
                Status:
                <template v-if="hubStatus.status === $options.WITHDRAW_STATUS.not_found">Not found</template>
                <template v-if="hubStatus.status === $options.WITHDRAW_STATUS.deposit_to_hub_received || hubStatus.status === $options.WITHDRAW_STATUS.batch_created">Processing</template>
                <template v-if="hubStatus.status === $options.WITHDRAW_STATUS.batch_executed">
                    Success
                    <a class="link--default" :href="getWithdrawTxUrl(hubStatus.outTxHash)" target="_blank">{{ shortHashFilter(hubStatus.outTxHash) }}</a>
                </template>
                <template v-if="hubStatus.status === $options.WITHDRAW_STATUS.refund">Refunded</template>
            </div>
            Recipient:
            <a class="link--default" :href="getWithdrawRecipientUrl(payloadParsed.recipient)" target="_blank">{{ payloadParsed.recipient }}</a><br>
            Amount: {{ prettyExact(hubAmount) }} {{ tx.data.coin.symbol }}<br>
            {{ hubNetworkData.shortName }} fee sent: {{ prettyExact(hubNetworkFee) }} {{ tx.data.coin.symbol }}<br>
            {{ hubNetworkData.shortName }} fee used: {{ prettyExact(hubNetworkFeeUsed) }} {{ tx.data.coin.symbol }}<br>
            {{ hubNetworkData.shortName }} fee refund: {{ prettyExact(hubNetworkFeeRefunded) }} {{ tx.data.coin.symbol }}<br>
            Hub bridge fee ({{hubBridgePercent}}%): {{ prettyExact(hubBridgeFee) }} {{ tx.data.coin.symbol }}
        </dd>
    </div>
</template>
