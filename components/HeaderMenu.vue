<script>
    import {MAINNET_URL, TESTNET_URL, CURRENT_URL} from "~/assets/variables";

    export default {
        computed: {
            isMain() {
                return CURRENT_URL === MAINNET_URL;
            },
            mainnetUrl() {
                return this.isMain ? false : MAINNET_URL;
            },
            testnetUrl() {
                return !this.isMain ? false : TESTNET_URL;
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
