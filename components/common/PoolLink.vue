<script>
// import {EXPLORER_HOST} from '~/assets/variables.js';
const EXPLORER_HOST = '';

export default {
    props: {
        pool: {
            type: Object,
            required: true,
        },
    },
    computed: {
        poolUrl() {
            return EXPLORER_HOST + '/pools/' + this.getCoinSymbol(this.pool.coin0) + '/' + this.getCoinSymbol(this.pool.coin1);
        },
    },
    methods: {
        /**
         * Accept coin object from explorer or coin string from txParams
         * @param {Coin|string} coin
         * @return {string}
         */
        getCoinSymbol(coin) {
            return coin?.symbol || coin;
        },
    },
};
</script>

<template>
    <nuxt-link class="link--default" :to="poolUrl">
        {{ getCoinSymbol(pool.coin0) }} / {{ getCoinSymbol(pool.coin1) }}
    </nuxt-link>
</template>
