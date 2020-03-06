<script>
    import {MAINNET_WEB_URL, HISTORY_WEB_URL, PURPOSE} from "~/assets/variables";

    export default {
        computed: {
            isMain() {
                return PURPOSE !== 'history';
            },
            isHistory() {
                return PURPOSE === 'history';
            },
            mainnetUrl() {
                return this.isMain ? false : MAINNET_WEB_URL;
            },
            historyUrl() {
                return this.isHistory ? false : HISTORY_WEB_URL;
            },
        },
    };
</script>

<template>
    <div class="header__menu u-hidden-large-down">
        <a class="header__link" :href="mainnetUrl" v-if="mainnetUrl">Mainnet</a>
        <nuxt-link class="header__link is-active" to="/" v-else>Mainnet</nuxt-link>
        <a class="header__link" :href="historyUrl" v-if="historyUrl">History</a>
        <nuxt-link class="header__link is-active" to="/" v-else>History</nuxt-link>
    </div>
</template>
