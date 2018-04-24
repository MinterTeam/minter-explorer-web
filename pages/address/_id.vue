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
                    Address Overview
                </h1>
            </div>
            <dl>
                <dt>Address</dt>
                <dd>0xe75c4ff8d7ace4085c2372b3b112f99a2e75f246</dd>

                <dt>BIP Balance</dt>
                <dd>1.434420 BIP</dd>

                <dt>BIP USD Value</dt>
                <dd>$1000.43</dd>

                <dt>#Transactions</dt>
                <dd>5</dd>
            </dl>
        </section>
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
