<script>
    export default {
        props: {
            basePath: {
                type: String,
                default() {
                    return this.$route.path;
                },
            },
            paginationInfo: {
                type: Object,
                required: true,
                default: () => ({
                    current_page: null,
                    last_page: null,
                }),
            },
            paginationClass: {
                type: String,
                default: 'pagination--bottom u-section',
            },
            buttonClass: {
                type: String,
                default: 'button--ghost-main',
            },
            buttonDisabledClass: {
                type: String,
                default: 'u-visually-hidden',
            },
            activeTab: {
                type: String,
            },
        },
        computed: {
            hasPrev() {
                return this.paginationInfo.current_page > 1;
            },
            hasNext() {
                return this.paginationInfo.current_page < this.paginationInfo.last_page;
            },
            buttonClassPrev() {
                let classList = this.buttonClass.split(' ');
                if (!this.hasPrev) {
                    classList = classList.concat(this.buttonDisabledClass.split(' '));
                }
                return classList;
            },
            buttonClassNext() {
                let classList = this.buttonClass.split(' ');
                if (!this.hasNext) {
                    classList = classList.concat(this.buttonDisabledClass.split(' '));
                }
                return classList;
            },
        },
        methods: {
            getPageHref(page) {
                let location = {
                    path: this.basePath,
                    query: {},
                };
                if (page && page !== 1) {
                    location.query.page = page;
                }
                if (this.activeTab) {
                    location.query.active_tab = this.activeTab;
                }

                return location;
            },
        },
    };
</script>

<template>
    <div class="pagination" :class="paginationClass" v-if="paginationInfo.current_page && paginationInfo.last_page > 1">
        <nuxt-link class="button button--icon"
                   :class="buttonClassPrev"
                   :to="getPageHref(1)"
                   :event="!hasPrev ? '' : 'click'"
        > &lt;&lt;</nuxt-link>
        <nuxt-link class="button button--icon"
                   :class="buttonClassPrev"
                   :to="getPageHref(paginationInfo.current_page - 1)"
                   :event="!hasPrev ? '' : 'click'"
        > &lt;</nuxt-link>
        <div class="pagination__current">Page {{ paginationInfo.current_page }} of {{ paginationInfo.last_page }}</div>
        <nuxt-link class="button button--icon"
                   :class="buttonClassNext"
                   :to="getPageHref(paginationInfo.current_page + 1)"
                   :event="!hasNext ? '' : 'click'"
        > ></nuxt-link>
        <nuxt-link class="button button--icon"
                   :class="buttonClassNext"
                   :to="getPageHref(paginationInfo.last_page)"
                   :event="!hasNext ? '' : 'click'"
        > >></nuxt-link>
    </div>
</template>
