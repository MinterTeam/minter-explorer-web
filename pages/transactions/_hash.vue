<script>
    import TransactionList from '~/components/TransactionList';

    export default {
        components: {
            TransactionList,
        }
    }
</script>

<template>
    <div>
        <section class="panel u-section">
            <div class="panel__section panel__header">
                <h1 class="panel__header-title panel__title">
                    <img class="panel__header-title-icon" src="/img/icon-back.svg" alt="Back">
                    Transaction Information
                </h1>
            </div>
            <dl>
                <dt>Hash</dt>
                <dd>0xd694ad99f7a3f58f538978abdeae20416dd3440358401c99e8634b5474ee898f</dd>

                <dt>Status</dt>
                <dd><strong class="tx__success">Success</strong></dd>

                <dt>Block</dt>
                <dd><nuxt-link class="link--default" :to="'/blocks/1'">5493393</nuxt-link></dd>

                <dt>From</dt>
                <dd><nuxt-link class="link--default" :to="'/address/1'">0x2edf1db11cf04961abf508aed5d36b3d8c0df0ff</nuxt-link></dd>

                <dt>To</dt>
                <dd><nuxt-link class="link--default" :to="'/address/1'">0x2edf1db11cf04961abf508aed5d36b3d8c0df0ff</nuxt-link></dd>

                <dt>Value</dt>
                <dd>1.434420 BIP</dd>

                <dt>Nonce</dt>
                <dd>2</dd>
            </dl>
        </section>
        <div class="u-section navigation">
            <nuxt-link class="button button--ghost-main" :to="'/transactions/1'">Prev Tx</nuxt-link>
            <nuxt-link class="button button--ghost-main" :to="'/transactions/3'">Next Tx</nuxt-link>
        </div>
    </div>
</template>
