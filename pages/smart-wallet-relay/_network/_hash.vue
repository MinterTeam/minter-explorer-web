<script>
import getTitle from 'assets/get-title.js';
import {getErrorText} from '~/assets/server-error.js';
import {HUB_NETWORK_SLUG} from 'assets/variables.js';
import TxRelayInfo from '~/components/TxRelayInfo.vue';


export default {
    components: {
        TxRelayInfo,
    },
    asyncData({ params, error }) {
        let {network, hash} = params;
        // support old style bsc-only links
        if (network.length === 64 && !hash) {
            hash = network;
            network = HUB_NETWORK_SLUG.BSC;
        }
        if (!Object.values(HUB_NETWORK_SLUG).includes(network)) {
            return error({
                statusCode: 404,
                message: 'Invalid network',
            });
        }
        if (hash?.length !== 64) {
            return error({
                statusCode: 404,
                message: 'Invalid hash',
            });
        }

        return {
            network,
            hash,
        };
    },
    head() {
        const title = getTitle('Smart Wallet transaction');

        return {
            title: title,
            meta: [
                { hid: 'og-title', name: 'og:title', content: title },
            ],
        };
    },
    data() {
        return {
            network: '',
            hash: '',
        };
    },
};


</script>

<template>
    <div>
        <section class="panel u-section">
            <div class="panel__section panel__header">
                <h1 class="panel__header-title panel__title">
                    <!--<BackButton/>-->
                    Transaction information
                </h1>
            </div>
            <dl>
                <dt>Hash</dt>
                <dd class="dd u-select-all">{{ hash }}</dd>

                <TxRelayInfo
                    :tx="undefined"
                    :payloadParsed="{smartWalletTx: hash, type: `send_to_${network}`}"
                />
            </dl>
        </section>
    </div>
</template>
