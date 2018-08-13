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
            }
        }
    }
</script>

<template>
    <div class="header__menu">
        <a class="header__link" :href="mainnetUrl" v-if="mainnetUrl">Mainnet</a>
        <span class="header__link is-active" v-else>Mainnet</span>
        <a class="header__link" :href="testnetUrl" v-if="testnetUrl">Testnet</a>
        <span class="header__link is-active" v-else>Testnet</span>
    </div>
</template>
