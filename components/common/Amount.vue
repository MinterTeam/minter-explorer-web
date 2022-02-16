<script>
import {pretty, prettyExact, decreasePrecisionSignificant} from '~/assets/utils.js';

export default {
    props: {
        amount: {
            type: [String, Number],
            required: true,
        },
        coin: {
            type: String,
            default: '',
        },
        tag: {
            type: String,
            default: 'span',
        },
        exact: {
            type: Boolean,
            default: false,
        },
        significant: {
            type: Boolean,
            default: false,
        },
        coinFirst: {
            type: Boolean,
            default: false,
        },
        // false to disable usd price
        priceUsd: {
            type: [Number, Boolean],
            default: 0,
        },
    },
    computed: {
        amountUsd() {
            if (this.priceUsd === false || this.amount <= 0) {
                return 0;
            }
            let priceUsd = Number(this.priceUsd) || 0;
            if (!priceUsd && this.coin === this.$store.getters.BASE_COIN) {
                priceUsd = this.$store.getters['explorer/bipPriceUsd'];
            }

            return this.amount * priceUsd;
        },
    },
    methods: {
        pretty,
        prettyExact,
        prettyAmount(value) {
            if (this.exact) {
                return prettyExact(value);
            }
            return this.significant ? decreasePrecisionSignificant(value) : pretty(value);
        },
    },
};
</script>

<template>
    <component :is="tag">
        <template v-if="coinFirst">{{ coin }} </template><!--
     --><span class="u-fw-500" :title="exact ? '' : prettyExact(amount)">{{ prettyAmount(amount) }}</span><!--
     --><template v-if="!coinFirst"> {{ coin }}</template>
        <span class="u-text-muted" v-if="amountUsd">(${{ pretty(amountUsd) }})</span>
    </component>
</template>
