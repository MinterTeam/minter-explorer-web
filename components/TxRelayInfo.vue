<script>
import web3Utils from 'web3-utils';
import web3Abi from 'web3-eth-abi';
import Big from '~/assets/big.js';
import {getRelayTxStatus, SMART_WALLET_RELAY_TX_STATUS} from '~/api/smart-wallet-relay.js';
import {prettyExact, shortHashFilter, getEvmTxUrl, getEvmAddressUrl, getEvmBlockUrl} from "~/assets/utils.js";
import {SMART_WALLET_RELAY_MINTER_ADDRESS, SMART_WALLET_FACTORY_CONTRACT_ADDRESS, HUB_CHAIN_DATA, HUB_CHAIN_ID} from "~/assets/variables.js";
import smartWalletABI from '~/assets/abi-smartwallet.js';
import smartWalletFactoryABI from '~/assets/abi-smartwallet-factory.js';


export default {
    SMART_WALLET_RELAY_TX_STATUS,
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
        if (this.isToRelayTx) {
            this.fetchRelayTxStatus();
        }
    },
    data() {
        return {
            relayTxStatus: null,
        };
    },
    computed: {
        isFromRelayTx() {
            return this.tx?.from === SMART_WALLET_RELAY_MINTER_ADDRESS;
        },
        isToRelayTxViaMiner() {
            return this.tx?.data.to === SMART_WALLET_RELAY_MINTER_ADDRESS && this.payloadParsed.a && this.payloadParsed.d && this.payloadParsed.gp;
        },
        isToRelayTxViaApi() {
            return this.payloadParsed.smartWalletTx;
        },
        isToRelayTx() {
            return this.isToRelayTxViaMiner || this.isToRelayTxViaApi;
        },
        relayTxParams() {
            if (this.isToRelayTxViaApi) {
                try {
                    return JSON.parse(this.relayTxStatus?.tx);
                } catch (e) {
                    return undefined;
                }
            } else {
                return this.payloadParsed;
            }
        },
        callDestination() {
            return this.relayTxParams.a;
        },
        callPayload() {
            if (!this.relayTxParams) {
                return '';
            }
            return '0x' + Buffer.from(this.relayTxParams.d, 'base64').toString('hex');
        },
        callPayloadDecoded() {
            try {
                let abi;
                if (this.callDestination === SMART_WALLET_FACTORY_CONTRACT_ADDRESS) {
                    abi = smartWalletFactoryABI.find((item) => item.name === 'createAndCall');
                } else {
                    abi = smartWalletABI.find((item) => item.name === 'call');
                }
                // console.debug(abi);
                return web3Abi.decodeParameters(abi.inputs, '0x' + this.callPayload.slice(2 + 8));
            } catch (error) {
                console.error(error);
                return '';
            }
        },
        txList() {
            return this.callPayloadDecoded._logicContractAddress.map((to, index) => {
                return {
                    to,
                    value: web3Utils.fromWei(this.callPayloadDecoded._value[index], 'ether'),
                    data: this.callPayloadDecoded._payload[index],
                };
            });
        },
        gasPriceGwei() {
            if (!this.relayTxParams) {
                return '';
            }
            return web3Utils.fromWei(this.relayTxParams.gp, 'gwei');
        },
        gasLimit() {
            return this.relayTxParams.gl;
            // return new Big(web3Utils.toWei(this.tx.data.value, 'ether')).div(this.payloadParsed.gp).toFixed();
        },
        /** @type {HubChainDataItem}*/
        hubNetworkData() {
            const networkName = HUB_CHAIN_ID.BSC;// this.payloadParsed.type.replace('send_to_', '');
            return HUB_CHAIN_DATA[networkName];
        },

    },
    methods: {
        prettyExact,
        prettyJson(obj) {
            return JSON.stringify(obj, null, 4);
        },
        shortHashFilter,
        getTxUrl(hash) {
            return getEvmTxUrl(this.hubNetworkData?.chainId, hash);
        },
        getAddressUrl(address) {
            return getEvmAddressUrl(this.hubNetworkData?.chainId, address);
        },
        getBlockUrl(blockNumber) {
            return getEvmBlockUrl(this.hubNetworkData?.chainId, blockNumber);
        },
        fetchRelayTxStatus() {
            const hash = this.isToRelayTxViaApi ? this.payloadParsed.smartWalletTx : this.tx.hash;
            getRelayTxStatus(hash)
                .then((result) => {
                    this.relayTxStatus = result;
                })
                .catch((e) => {
                    console.log('Unable to get Relay tx status', e);
                });
        },
    },
};

</script>

<template>
    <div v-if="isFromRelayTx || isToRelayTx" style="display: contents;">
        <dt>Purpose</dt>
        <dd>
            <template v-if="isFromRelayTx">Refund from Relay</template>
            <template v-if="isToRelayTx">Send to Relay</template>
        </dd>
        <dt v-if="isToRelayTx && relayTxParams">Smart wallet Relay info</dt>
        <dd v-if="isToRelayTx && relayTxParams">
            Status:
            <template v-if="relayTxStatus">
                {{ relayTxStatus.status }}
                <a v-if="relayTxStatus.txHash" class="link--default" :href="getTxUrl(relayTxStatus.txHash)" target="_blank">{{ shortHashFilter(relayTxStatus.txHash) }}</a>
                <template v-if="relayTxStatus.reason">
                    <br>
                    Reason:
                    {{ relayTxStatus.reason }}
                </template>
            </template>
            <template v-else-if="$fetchState.pending">Unable to get tx status</template>

            <br>
            Call destination:
            <a class="link--default" :href="getAddressUrl(callDestination)" target="_blank">{{ callDestination }}</a>

            <template v-if="callPayloadDecoded._owner">
                <br>
                Owner:
                <a class="link--default" :href="getAddressUrl(callPayloadDecoded._owner)" target="_blank">{{ callPayloadDecoded._owner }}</a>
            </template>

            <br>
            Timeout block:
            <a class="link--default" :href="getBlockUrl(callPayloadDecoded._timeout)" target="_blank">{{ callPayloadDecoded._timeout }}</a>

            <br>
            Gas price:
            {{ gasPriceGwei }} gwei

            <br>
            Gas limit:
            {{ gasLimit }}

            <div class="u-mt-10">Tx list:</div>
            <div class="u-mt-10" v-for="(tx, txIndex) in txList" :key="txIndex">
                Tx number: {{ txIndex + 1}}
                <br>
                To:
                <a class="link--default" :href="getAddressUrl(tx.to)" target="_blank">{{ tx.to }}</a>
                <br>
                Value:
                {{ tx.value }} BNB
                <br>
                Data:
                {{ tx.data}}
            </div>

            <details class="u-mt-10">
                <summary class="link link--main link--opacity u-fw-700" style="width: max-content;">
                    Call payload
                </summary>
                Parsed:
                <pre style="white-space: pre-wrap;">{{ prettyJson(callPayloadDecoded) }}</pre>
                Hex:
                {{ callPayload }}
                <br><br>
                Base64:
                {{ relayTxParams.d }}
            </details>
        </dd>
    </div>
</template>
