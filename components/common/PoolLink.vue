<script>
export default {
    props: {
        pool: {
            type: Object,
            required: true,
        },
    },
};
</script>

<template>
    <nuxt-link class="link--default" :to="'/pools/' + pool.coin0.symbol + '/' + pool.coin1.symbol">
        {{ pool.coin0.symbol }} / {{ pool.coin1.symbol }}
    </nuxt-link>
</template>
