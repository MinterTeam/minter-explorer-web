<script>
    import PoolList from '@/components/PoolList.vue';

    export default {
        components: {
            PoolList,
        },
        props: {
            /** @type Array<Pool> */
            poolList: {
                type: [Array, null],
                required: true,
            },
        },

    };
</script>

<template>
    <section class="panel u-section">
        <div class="panel__section panel__header">
            <h2 class="panel__header-title panel__title">
                <img class="panel__header-title-icon" src="/img/icon-pool.svg" width="40" height="40" alt="" role="presentation">
                Liquidity pools
            </h2>
            <nuxt-link class="button button--ghost-main button--small" to="/pools">View All</nuxt-link>
        </div>
        <PoolList :pool-list="poolList"/>
    </section>
<!--    <div class="panel preview">-->
<!--        <div class="preview__header panel__section panel__header">-->
<!--            -->
<!--        </div>-->
<!--        -->
<!--    </div>-->
</template>
