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
    methods: {
        getPoolUrl(pool) {
            return EXPLORER_HOST + '/pools/' + getCoinSymbol(pool.coin0) + '/' + getCoinSymbol(pool.coin1);
        },
        getCoinSymbol,
    },
};

/**
 * Accept coin object from explorer or coin string from txParams
 * @param {Coin|string} coin
 * @return {string}
 */
function getCoinSymbol(coin) {
    return coin?.symbol || coin;
}
</script>

<template functional>
    <nuxt-link
        class="link--default"
        :class="[data.staticClass, data.class]"
        v-bind="data.attrs"
        :to="$options.methods.getPoolUrl(props.pool)"
    >
        {{ $options.methods.getCoinSymbol(props.pool.coin0) }}
        /
        {{ $options.methods.getCoinSymbol(props.pool.coin1) }}
    </nuxt-link>
</template>
