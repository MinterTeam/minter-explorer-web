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
    },
    computed: {

        amountParts() {
            const parts = this.amount.toString().split('.');
            return {
                whole:  parts[0] ? parts[0] : 0,
                decimal: parts[1] ? '.' + parts[1] : '',
            };
        },
    },
    methods: {
        prettyFn(value) {
            return this.exact ? prettyExact(value) : pretty(value);
        },
    },
};
</script>

<template>
    <component :is="tag">
        <span class="u-fw-500">{{ prettyFn(amount) }}</span> {{ coin }}
    </component>
</template>
