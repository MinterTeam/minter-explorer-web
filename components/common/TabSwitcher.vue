<script>
//@TODO move fetchTab functions inside
export default {
    props: {
        /** @type {Array<TabSwitcherItem>} */
        tabs: {
            type: Array,
            required: true,
        },
    },
    data() {
        return {
            storedTabPages: {},
        };
    },
    computed: {
        defaultTabSlug() {
            if (!this.tabs[0]) {
                return '';
            }
            return this.tabs[0].isGroup ? this.tabs[0].tabs[0].slug : this.tabs[0].slug;
        },
        activeTabSlug() {
            return this.ensureTabSlug(this.$route.query.active_tab);
        },
        // filled when active tab is group
        activeGroup() {
            return this.tabs.find((item) => {
                return item.isGroup && item.tabs.some((innerItem) => innerItem.slug === this.activeTabSlug);
            });
        },
        activeGroupSlug() {
            return this.getGroupSlug(this.activeGroup);
        },
        flatTabTypes() {
            const result = [];
            this.tabs.forEach((item) => {
                if (item.isGroup) {
                    item.tabs.forEach((innerItem) => {
                        result.push(innerItem.slug);
                    });
                } else {
                    result.push(item.slug);
                }
            });
            return result;
        },
    },
    methods: {
        ensureTabSlug(val) {
            return this.flatTabTypes.includes(val) ? val : this.defaultTabSlug;
        },
        switchTab(newTabItem) {
            //@TODO check if current active tab already belongs to this group
            const newTab = newTabItem.isGroup ? newTabItem.tabs[0].slug : newTabItem.slug;
            // save previous page
            if (this.$route.query.active_tab) {
                this.storedTabPages[this.$route.query.active_tab] = this.$route.query.page;
            }
            // restore saved page
            let newTabPage;
            if (this.storedTabPages[newTab]) {
                newTabPage = this.storedTabPages[newTab];
            }

            let newQuery = {
                page: newTabPage,
                active_tab: undefined, // fix: uncaught exception: Object
            };
            if (newTab !== this.defaultTabSlug) {
                newQuery.active_tab = newTab;
            }

            // update route
            this.$router.replace({
                // path: this.$route.path,
                query: newQuery,
            });

            // wait for rewards chart to disappear
            this.$nextTick(this.checkPanelPosition);
        },
        checkPanelPosition() {
            const panelEl = document.querySelector('[data-tab-panel]');
            if (panelEl && window.pageYOffset > panelEl.offsetTop) {
                window.scrollTo(0, panelEl.offsetTop - 15);
            }
        },
        getGroupSlug(groupItem) {
            if (!groupItem || !groupItem.isGroup) {
                return '';
            }
            return groupItem.tabs.map((item) => item.slug).join();
        },
    },
};

/**
 * @typedef {Object} TabSwitcherItem
 * @property {string} slug
 * @property {string} caption
 * @property {string} iconName
 * @property {boolean} [isGroup]
 * @property {Array<TabSwitcherItem>} tabs
 */
</script>

<template>
    <div class="panel__section panel__section--wrap">
        <div class="panel__switcher">
            <button class="panel__switcher-item panel__switcher-item--small panel__title panel__header-title u-semantic-button"
                    v-for="tab in tabs"
                    :key="tab.isGroup ? getGroupSlug(tab) : tab.slug"
                    :class="{'is-active': tab.isGroup ? activeGroupSlug === getGroupSlug(tab) : activeTabSlug === tab.slug}"
                    @click="switchTab(tab)"
            >
                <img class="panel__header-title-icon u-hidden-large-down" :src="`/img/icon-${tab.iconName}.svg`" width="40" height="40" alt="" role="presentation">
                {{ tab.caption }}
            </button>
        </div>
        <div class="panel__tabs" v-if="activeGroup">
            <button class="panel__tabs-item button"
                    v-for="tab in activeGroup.tabs"
                    :key="tab.slug"
                    :class="{'is-active': activeTabSlug === tab.slug}"
                    @click="switchTab(tab)"
            >
                {{ tab.caption }}
            </button>
        </div>
    </div>
</template>
