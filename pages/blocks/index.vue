<script>
    import {getBlockList} from '~/api/explorer.js';
    import {getTime, pretty, prettyRound} from '~/assets/utils';
    import getTitle from '~/assets/get-title';
    import BackButton from '~/components/BackButton';
    import Pagination from "~/components/Pagination";

    export default {
        components: {
            Pagination,
            BackButton,
        },
        filters: {
            pretty,
            prettyRound,
        },
        watchQuery: ['page'],
        key: (to) => to.fullPath,
        asyncData({ query }) {
            return getBlockList(query)
                .then((blockListInfo) => {
                    return {
                        paginationInfo: blockListInfo.meta,
                        blockList: blockListInfo.data,
                    };
                });
        },
        head() {
            const title = getTitle('Blocks');

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
                /** @type Array<Block> */
                blockList: [],
            };
        },
        computed: {
            blockListFormatted() {
                return this.blockList.map((block) => {
                    return {
                        ...block,
                        timeLocal: getTime(block.timestamp),
                    };
                });
            },
            blockListFromHeight() {
                return this.blockList.length ? this.blockList[0].height : false;
            },
            blockListToHeight() {
                return this.blockList.length ? this.blockList[this.blockList.length - 1].height : false;
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
                        Blocks
                        <span v-if="blockList.length">
                            (#{{ blockListFromHeight }} to #{{ blockListToHeight }}) out&nbsp;of&nbsp;{{ paginationInfo.total }} total blocks
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
            <div class="table-wrap">
                <table class="u-text-nowrap">
                    <thead>
                    <tr>
                        <th>Height</th>
                        <th>Time</th>
                        <th>Validators</th>
                        <th>Txns</th>
                        <th>Block size</th>
                        <th>Reward</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="block in blockListFormatted" :key="block.height">
                        <td><nuxt-link class="link--default" :to="'/blocks/' + block.height">{{ block.height | prettyRound }}</nuxt-link></td>
                        <td>{{ block.timeLocal}}</td>
                        <td>{{ block.validatorsCount }}</td>
                        <td>
                            <nuxt-link class="link--default" :to="'/blocks/' + block.height" v-if="block.transactionCount">{{ block.transactionCount }}</nuxt-link>
                            <span v-else>{{ block.transactionCount }}</span>
                        </td>
                        <td>{{ block.size | prettyRound }} bytes</td>
                        <td>{{ $store.state.COIN_NAME }} {{ block.reward | pretty }}</td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </section>
        <Pagination class="u-section" :pagination-info="paginationInfo"/>
    </div>
</template>
