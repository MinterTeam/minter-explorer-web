<script>
    import TransactionList from '~/components/TransactionList';
    import BackButton from '~/components/BackButton';

    export default {
        components: {
            TransactionList,
            BackButton,
        }
    }
</script>

<template>
    <div>
        <section class="panel u-section">
            <div class="panel__section panel__header">
                <h1 class="panel__header-title panel__title">
                    <BackButton/>
                    Block Information
                </h1>
            </div>
            <dl>
                <dt>Height</dt>
                <dd>5349452</dd>

                <dt>TimeStamp</dt>
                <dd>3 days 21 hrs ago (Mar-30-2018 03:31:06 PM +UTC)</dd>

                <dt>Hash</dt>
                <dd>0xd694ad99f7a3f58f538978abdeae20416dd3440358401c99e8634b5474ee898f</dd>

                <dt>Validator</dt>
                <dd>MxcC16E3c00DBbe76603fa833Ec20A48f786dfE610</dd>

                <dt>Size</dt>
                <dd>31179 bytes</dd>

                <dt>Reward</dt>
                <dd>1.434420 BIP</dd>
            </dl>
        </section>
        <div class="u-section navigation">
            <nuxt-link class="button button--ghost-main" :to="'/blocks/1'">Prev Block</nuxt-link>
            <nuxt-link class="button button--ghost-main" :to="'/blocks/3'">Next Block</nuxt-link>
        </div>
        <section class="panel u-section">
            <div class="panel__section panel__header">
                <h2 class="panel__header-title panel__title">
                    <img class="panel__header-title-icon" src="/img/icon-transaction.svg" alt="" role="presentation">
                    Transactions
                </h2>
            </div>
            <TransactionList :transaction-list="5"/>
        </section>
    </div>
</template>
