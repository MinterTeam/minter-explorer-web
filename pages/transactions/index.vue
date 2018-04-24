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
                <h1 class="panel__title panel__header-title">
                    <img class="panel__header-title-icon" src="/img/icon-back.svg" alt="Back">
                    TRANSACTIONS
                </h1>
                <div class="pagination pagination--header u-hidden-medium-down">
                    <button class="button button--white button--icon"> &lt;&lt; </button>
                    <button class="button button--white button--icon"> &lt; </button>
                    <div class="pagination__current">Page 1 of 214900</div>
                    <button class="button button--white button--icon"> > </button>
                    <button class="button button--white button--icon"> >> </button>
                </div>
            </div>
            <TransactionList :transaction-list="50"/>
        </section>
        <div class="pagination pagination--bottom u-section">
            <button class="button button--ghost-main button--icon"> &lt;&lt; </button>
            <button class="button button--ghost-main button--icon"> &lt; </button>
            <div class="pagination__current">Page 1 of 214900</div>
            <button class="button button--ghost-main button--icon"> > </button>
            <button class="button button--ghost-main button--icon"> >> </button>
        </div>
    </div>
</template>


