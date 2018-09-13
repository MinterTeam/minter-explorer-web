<script>
    import footerLinksData from 'minter-footer-links';
    import HeaderMenu from '~/components/HeaderMenu';
    import Search from '~/components/Search';

    export default {
        footerLinkList: footerLinksData,
        components: {
            HeaderMenu,
            Search,
        },
        data() {
            return {
                isSearchFocused: false,
            };
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
                <Search :class="{'header__search--expanded': isSearchFocused}" @inputFocus="inputFocus" @inputBlur="inputBlur"/>
            </div>
        </header>
        <HeaderMenu class="u-hidden-large-up"/>

        <main class="main-content u-container">
            <nuxt/>
        </main>

        <footer class="footer">
            <div class="footer__container u-container u-container--large">
                <img class="footer__logo" src="/img/minter-logo-white.svg" alt="Minter">
                <div class="footer__menu">
                    <div class="footer__menu-item" v-for="link in $options.footerLinkList" :key="link.slug">
                        <a class="footer__link link--hover" :href="link.url" target="_blank" rel="nofollow noopener">{{ link.title }}</a>
                    </div>
                </div>
            </div>
        </footer>
    </div>
</template>

