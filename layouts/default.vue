<script>
    import Snackbar from '~/components/common/Snackbar';
    import HeaderMenu from '~/components/HeaderMenu';
    import Search from '~/components/Search';
    import Footer from '~/layouts/_footer.vue';

    export default {
        components: {
            Snackbar,
            HeaderMenu,
            Search,
            Footer,
        },
        data() {
            return {
                isSearchFocused: false,
            };
        },
        computed: {
        },
        methods: {
            inputFocus() {
                this.isSearchFocused = true;
            },
            inputBlur() {
                this.isSearchFocused = false;
            },

        },
    };
</script>

<template>
    <div class="main-wrap">
        <header class="header">
            <div class="header__container u-container">
                <nuxt-link class="header__logo no-link" to="/" :class="{'header__logo--collapsed': isSearchFocused}">
                    <img class="header__logo-image" src="/img/minter-logo-circle.svg" alt="Minter" width="36" height="36">
                    <div class="header__logo-text">Explorer</div>
                </nuxt-link>
                <HeaderMenu class="u-hidden-large-down"/>
                <Search :class="{'header__search--expanded': isSearchFocused}" @input-focus="inputFocus" @input-blur="inputBlur"/>
            </div>
        </header>
        <HeaderMenu class="u-hidden-large-up"/>

        <main class="main-content u-container">
            <nuxt/>
        </main>

        <Footer/>

        <Snackbar/>
    </div>
</template>

