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
                <h1 class="panel__title panel__header-title">
                    <BackButton/>
                    Transactions
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


