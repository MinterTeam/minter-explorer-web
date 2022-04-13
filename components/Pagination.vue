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
                    currentPage: null,
                    lastPage: null,
                }),
            },
            paginationClass: {
                type: String,
                default: 'pagination--bottom',
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
        data() {
            return {
                currentPage: this.paginationInfo.currentPage,
                inputPage: this.paginationInfo.currentPage,
            };
        },
        watch: {
            'paginationInfo.currentPage': function(newVal) {
                this.currentPage = newVal;
                this.inputPage = newVal;
            },
        },
        computed: {
            hasPrev() {
                return this.currentPage > 1;
            },
            hasNext() {
                return this.currentPage < this.paginationInfo.lastPage;
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
            firstNumber() {
                return (this.currentPage - 1) * this.paginationInfo.perPage + 1;
            },
            lastNumber() {
              const displayedAmount = this.currentPage === this.paginationInfo.lastPage ? this.paginationInfo.total % this.paginationInfo.perPage : this.paginationInfo.perPage;

              return this.firstNumber - 1 + displayedAmount;
            },
        },
        methods: {
            getPageHref(page) {
                let location = {
                    path: this.basePath,
                    query: Object.assign({}, this.$route.query),
                };
                if (page && page !== 1) {
                    location.query.page = page;
                } else {
                    delete location.query.page;
                }
                if (this.activeTab) {
                    location.query.active_tab = this.activeTab;
                }

                return location;
            },
            handleBlur() {
                // revert input on blur
                setTimeout(() => {
                    this.inputPage = this.currentPage;
                }, 0);
            },
            submit() {
                this.currentPage = this.inputPage;
                this.$router.push(this.getPageHref(this.currentPage));
                if (this.$refs.pageInput) {
                    this.$refs.pageInput.blur();
                }
            },
            handlePrev(page) {
                if (this.hasPrev) {
                    this.currentPage = page;
                    this.inputPage = page;
                }
            },
            handleNext(page) {
                if (this.hasNext) {
                    this.currentPage = page;
                    this.inputPage = page;
                }
            },
        },
    };
</script>

<template>
    <div class="pagination-wrap">
        <div class="pagination" :class="paginationClass" v-if="currentPage && paginationInfo.lastPage > 1">
            <nuxt-link class="button button--icon"
                       :class="buttonClassPrev"
                       :to="getPageHref(1)"
                       :event="!hasPrev ? '' : 'click'"
                       @click.native="handlePrev(1)"
            > &lt;&lt;</nuxt-link>
            <nuxt-link class="button button--icon"
                       :class="buttonClassPrev"
                       :to="getPageHref(currentPage - 1)"
                       :event="!hasPrev ? '' : 'click'"
                       @click.native="handlePrev(currentPage - 1)"
            > &lt;</nuxt-link>
            <form class="pagination__current" novalidate @submit.prevent="submit">
                <input class="pagination__current-input" type="text" ref="pageInput"
                       v-model="inputPage"
                       @blur="handleBlur"
                >
                of {{ paginationInfo.lastPage }}
            </form>
            <nuxt-link class="button button--icon"
                       :class="buttonClassNext"
                       :to="getPageHref(currentPage + 1)"
                       :event="!hasNext ? '' : 'click'"
                       @click.native="handleNext(currentPage + 1)"
            > ></nuxt-link>
            <nuxt-link class="button button--icon"
                       :class="buttonClassNext"
                       :to="getPageHref(paginationInfo.lastPage)"
                       :event="!hasNext ? '' : 'click'"
                       @click.native="handleNext(paginationInfo.lastPage)"
            > >></nuxt-link>
        </div>
        <div class="pagination__meta u-text-muted u-text-small u-text-center" v-if="firstNumber && lastNumber">Displayed {{ firstNumber }}-{{ lastNumber }} of total {{ paginationInfo.total }} items</div>
    </div>
</template>
