<script>
    import {getTransaction} from "~/api";
    import TransactionList from '~/components/TransactionList';
    import BackButton from '~/components/BackButton';

    export default {
        components: {
            TransactionList,
            BackButton,
        },
        asyncData({ params, error }) {
            return getTransaction(params.hash)
                .then((tx) => {
                    return {tx};
                })
                .catch((e) => {
                    error({ statusCode: 404, message: 'Transaction not found' });
                });
        }
    }
</script>

<template>
    <div>
        <section class="panel u-section">
            <div class="panel__section panel__header">
                <h1 class="panel__header-title panel__title">
                    <BackButton/>
                    Transaction Information
                </h1>
            </div>
            <dl>
                <dt>Hash</dt>
                <dd>{{ tx.hash }}</dd>

                <dt>Status</dt>
                <dd><strong :class="tx.status === 'success' ? 'tx__success' : 'tx__fail'">{{ tx.status }}</strong></dd>

                <dt>Block</dt>
                <dd><nuxt-link class="link--default" :to="'/blocks/' + tx.block">{{ tx.block }}</nuxt-link></dd>

                <dt>From</dt>
                <dd><nuxt-link class="link--default" :to="'/address/' + tx.data.from">{{ tx.data.from }}</nuxt-link></dd>

                <dt>To</dt>
                <dd><nuxt-link class="link--default" :to="'/address/' + tx.data.to">{{ tx.data.to }}</nuxt-link></dd>

                <dt>Value</dt>
                <dd>{{ tx.data.amount }} BIP</dd>

                <dt>Nonce</dt>
                <dd>{{ tx.nonce }}</dd>
            </dl>
        </section>
        <div class="u-section navigation">
            <nuxt-link class="button button--ghost-main" :to="'/transactions/1'">Prev Tx</nuxt-link>
            <nuxt-link class="button button--ghost-main" :to="'/transactions/3'">Next Tx</nuxt-link>
        </div>
    </div>
</template>
