<script>
    import {getBlockList} from "~/api";
    import {getTimeDistance, roundMoney} from '~/assets/utils';
    import BackButton from '~/components/BackButton';
    import Pagination from "~/components/Pagination";

    export default {
        components: {
            Pagination,
            BackButton,
        },
        filters: {
            money: (value) => roundMoney(value),
        },
        watchQuery: ['page'],
        key: (to) => to.fullPath,
        asyncData ({ query }) {
            return getBlockList(query)
                .then((blockListInfo) => {
                    return {
                        paginationInfo: blockListInfo.meta,
                        blockList: blockListInfo.data,
                    };
                });
        },
        data() {
            return {
                paginationInfo: {},
                /** @type Array<Block> */
                blockList: [],
            }
        },
        computed: {
            blockListFormatted() {
                return this.blockList.map((block) => {
                    return {
                        ...block,
                        timeDistance: getTimeDistance(block.timestamp),
                    };
                });
            },
            blockListFromHeight() {
                return this.blockList.length ? this.blockList[0].height : false;
            },
            blockListToHeight() {
                return this.blockList.length ? this.blockList[this.blockList.length - 1].height : false;
            },
        }
    }
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
                <Pagination :pagination-info="paginationInfo"
                            pagination-class="pagination--header u-hidden-medium-down"
                            button-class="button--white"
                            button-disabled-class="u-hidden"
                />
            </div>
            <div class="table-wrap">
                <table class="u-text-nowrap">
                    <thead>
                    <tr>
                        <th>Height</th>
                        <th>Age</th>
                        <th>Validator</th>
                        <th>Tx</th>
                        <th>Reward</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="block in blockListFormatted" :key="block.height">
                        <td><nuxt-link class="link--default" :to="'/blocks/' + block.height">{{ block.height }}</nuxt-link></td>
                        <td>{{ block.timeDistance}} ago</td>
                        <td><div class="table-overflow--large">{{ block.validators.length && block.validators[0].address }}</div></td>
                        <td><nuxt-link class="link--default" :to="'/blocks/' + block.height">{{ block.txCount }}</nuxt-link></td>
                        <td>{{ block.reward | money }} {{ $store.state.COIN_NAME }}</td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </section>
        <Pagination :pagination-info="paginationInfo"/>
    </div>
</template>
