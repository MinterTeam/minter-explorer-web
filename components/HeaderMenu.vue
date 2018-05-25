<script>
    export default {
        computed: {
            isMain() {
                console.log('main', process.env.APP_ENV === 'production')
                console.log(process.env.APP_MAINNET_URL);
                console.log(process.env.APP_TESTNET_URL);
                return process.env.APP_ENV === 'production';
            },
            mainnetUrl() {
                return this.isMain ? false : process.env.APP_MAINNET_URL;
            },
            testnetUrl() {
                return !this.isMain ? false : process.env.APP_TESTNET_URL;
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
