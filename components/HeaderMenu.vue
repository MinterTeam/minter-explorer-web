<script>
    import {MAINNET_WEB_URL, HISTORY_WEB_URL, PURPOSE, NETWORK, MAINNET} from "~/assets/variables";

    export default {
        computed: {
            isMainnet() {
                return NETWORK === MAINNET;
            },
            isHistory() {
                return PURPOSE === 'history';
            },
            externalMainnetUrl() {
                return this.isMainnet && !this.isHistory ? false : MAINNET_WEB_URL;
            },
            externalHistoryUrl() {
                return this.isHistory ? false : HISTORY_WEB_URL;
            },
        },
    };
</script>

<template>
    <div class="header__menu u-hidden-large-down">
        <a class="header__link" :href="externalMainnetUrl" v-if="externalMainnetUrl">Mainnet</a>
        <nuxt-link class="header__link is-active" to="/" v-else>Mainnet</nuxt-link>
        <a class="header__link" :href="externalHistoryUrl" v-if="externalHistoryUrl">History</a>
        <nuxt-link class="header__link is-active" to="/" v-else>History</nuxt-link>
    </div>
</template>
