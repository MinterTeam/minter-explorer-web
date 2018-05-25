<script>
    import {MAINNET_HOST, TESTNET_HOST, CURRENT_HOST} from "~/assets/variables";

    export default {
        computed: {
            isMain() {
                return CURRENT_HOST === MAINNET_HOST;
            },
            mainnetUrl() {
                return this.isMain ? false : MAINNET_HOST;
            },
            testnetUrl() {
                return !this.isMain ? false : TESTNET_HOST;
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
