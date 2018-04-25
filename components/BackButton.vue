<script>
    export default {
        methods: {
            goBack() {
                if (this.$store.state.history.length) {
                    this.$router.go(-1);
                } else {
                    this.$router.push('/');
                }
            }
        },
    }
</script>

<template>
    <button class="u-semantic-button panel__header-title-icon" @click="goBack">
        <img class="u-display-block" src="/img/icon-back.svg" alt="Back">
    </button>
</template>
