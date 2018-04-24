<script>
    export default {

    }
</script>

<template>
    <div class="panel">
        <div class="preview__header panel__section panel__header">
            <h2 class="panel__header-title panel__title">
                <img class="panel__header-title-icon" src="/img/icon-transaction.svg" alt="" role="presentation">
                Transactions
            </h2>
            <a href="#" class="button button--ghost-main button--small">View All</a>
        </div>
        <div class="preview__content">
            <div class="preview__transaction panel__section" v-for="n in 10" :key="n">
                <div class="preview__transaction-row u-text-overflow">TX# <a class="link--main link--hover" href="#">0x8710a732ef25eeb40d7b3d36d108ed91d0010a5b104f9004eba7bebb8b33e839</a></div>
                <div class="preview__transaction-row u-grid">
                    <div class="u-cell u-cell--small--1-2 u-text-overflow">From <a class="link--main link--hover" href="#">0xd47e929bf8a997eaea5e13af7c5973968cd9be10</a></div>
                    <div class="u-cell u-cell--small--1-2 u-text-overflow">To <a class="link--main link--hover" href="#">0x8a7f9eacd68d154330f759aff08d6e406abb008e</a></div>
                </div>
                <div class="preview__transaction-row preview__transaction-meta">
                    <div>Amount 0.000507 BIP</div>
                    <div>> 45 secs ago</div>
                </div>
            </div>
        </div>
    </div>
</template>
