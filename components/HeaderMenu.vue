<script>
    import {MAINNET_WEB_URL, TESTNET_WEB_URL, NETWORK} from "~/assets/variables";

    export default {
        computed: {
            isMain() {
                return NETWORK === 'mainnet';
            },
            mainnetUrl() {
                return this.isMain ? false : MAINNET_WEB_URL;
            },
            testnetUrl() {
                return !this.isMain ? false : TESTNET_WEB_URL;
            },
        },
    };
</script>

<template>
    <div class="header__menu">
        <a class="header__link" :href="mainnetUrl" v-if="mainnetUrl">Mainnet</a>
        <nuxt-link class="header__link is-active" to="/" v-else>Mainnet</nuxt-link>
        <a class="header__link" :href="testnetUrl" v-if="testnetUrl">Testnet</a>
        <nuxt-link class="header__link is-active" to="/" v-else>Testnet</nuxt-link>
    </div>
</template>
