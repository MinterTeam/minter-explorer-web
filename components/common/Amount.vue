<script>
import {pretty, prettyExact} from '~/assets/utils.js';

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
        coinFirst: {
            type: Boolean,
            default: false,
        },
        disableUsd: {
            type: Boolean,
            default: false,
        },
    },
    computed: {
        amountUsd() {
            if (this.disableUsd || this.coin !== this.$store.getters.BASE_COIN || this.amount <= 0) {
                return 0;
            }

            return this.amount * this.$store.getters['explorer/bipPriceUsd'];
        },
    },
    methods: {
        pretty,
        prettyExact,
        prettyAmount(value) {
            return this.exact ? prettyExact(value) : pretty(value);
        },
    },
};
</script>

<template>
    <component :is="tag">
        <template v-if="coinFirst">{{ coin }}</template> <span class="u-fw-500" :title="exact ? '' : prettyExact(amount)">{{ prettyAmount(amount) }}</span> <template v-if="!coinFirst">{{ coin }}</template>
        <span class="u-text-muted" v-if="amountUsd">(${{ pretty(amountUsd) }})</span>
    </component>
</template>
