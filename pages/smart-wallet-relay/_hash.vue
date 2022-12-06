<script>
import getTitle from '~/assets/get-title';
import {getErrorText} from '~/assets/server-error';
import TxRelayInfo from '~/components/TxRelayInfo.vue';

export default {
    components: {
        TxRelayInfo,
    },
    asyncData({ params, error }) {
        if (params.hash?.length !== 64) {
            return error({
                statusCode: 404,
                message: 'Invalid hash',
            });
        }
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

};


</script>

<template>
    <div>
        <section class="panel u-section">
            <div class="panel__section panel__header">
                <h1 class="panel__header-title panel__title">
                    <BackButton/>
                    Transaction information
                </h1>
            </div>
            <dl>
                <dt>Hash</dt>
                <dd class="dd u-select-all">{{ $route.params.hash }}</dd>

                <TxRelayInfo :tx="undefined" :payloadParsed="{smartWalletTx: $route.params.hash}"/>
            </dl>
        </section>
    </div>
</template>
