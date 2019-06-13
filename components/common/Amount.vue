<script>
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
            decimalClass: {
                type: String,
                default: 'u-amount__decimal',
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
    };
</script>

<template>
    <span class="u-amount">
        <span class="u-amount__whole">{{ amountParts.whole }}</span><!--
     --><span :class="decimalClass"><!--
         --><template v-if="coin">{{ amountParts.decimal }} {{ coin }}</template><!--
         --><template>{{ amountParts.decimal }}</template>
        </span>
    </span>
</template>
