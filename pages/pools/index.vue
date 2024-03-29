<script>
    import {getPoolList} from '~/api/explorer.js';
    import getTitle from '~/assets/get-title.js';
    import BackButton from '~/components/BackButton.vue';
    import Pagination from "~/components/Pagination.vue";
    import PoolList from '@/components/PoolList.vue';

    export default {
        components: {
            Pagination,
            BackButton,
            PoolList,
        },
        watchQuery: ['page'],
        key: (to) => to.fullPath,
        asyncData({ query }) {
            const poolPromise = getPoolList(query, {filterBlocked: true});

            return Promise.all([poolPromise])
                .then(([poolListInfo]) => {
                    return {
                        paginationInfo: poolListInfo.meta,
                        poolList: poolListInfo.data,
                    };
                });
        },
        head() {
            const title = getTitle('Pools');

            return {
                title: title,
                meta: [
                    { hid: 'og-title', name: 'og:title', content: title },
                ],
            };
        },
        data() {
            return {
                paginationInfo: {},
                /** @type Array<Pool> */
                poolList: [],
            };
        },
        computed: {
            poolListFrom() {
                return this.poolList.length ? this.poolList[0].height : false;
            },
            poolListTo() {
                return this.poolList.length ? this.poolList[this.poolList.length - 1].height : false;
            },
        },
    };
</script>

<template>
    <div>
        <section class="panel u-section">
            <div class="panel__section panel__header">
                <h1 class="panel__title panel__header-title">
                    <BackButton/>
                    <span>
                        Pools
                        <span v-if="poolList.length">
                            ({{ poolList.length }} out&nbsp;of&nbsp;{{ paginationInfo.total }} total pools)
                        </span>
                    </span>
                </h1>
                <Pagination
                    :pagination-info="paginationInfo"
                    :hide-meta="true"
                    class="u-hidden-medium-down"
                    pagination-class="pagination--header"
                    button-class="button--white"
                    button-disabled-class="u-hidden"
                />
            </div>
            <PoolList :pool-list="poolList"/>
        </section>
        <Pagination class="u-section" :pagination-info="paginationInfo"/>
    </div>
</template>
