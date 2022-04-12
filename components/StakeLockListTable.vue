<script>
    import {getTimeMinutes, getDate, getTimeZone, prettyPrecise, prettyRound, getExplorerValidatorUrl, snakeCaseToText} from '~/assets/utils.js';
    import {checkBlockTime} from '~/api/explorer.js';
    import TableLink from '~/components/TableLink.vue';


    export default {
        components: {
            TableLink,
        },
        props: {
            /** @type Array<StakeLockItem> */
            dataList: {
                type: Array,
                required: true,
                default: () => [],
            },
            isLoading: {
                type: Boolean,
                default: false,
            },
        },
        data() {
            return {
                blockTimestamp: {},
            };
        },
        computed: {
            lockList() {
                return this.dataList.map((item) => {
                    return {
                        ...item,
                        endTimestamp: this.blockTimestamp[item.endHeight],
                    };
                });
            },
        },
        watch: {
            dataList: {
                handler() {
                    this.dataList.forEach((stakeLockItem) => {
                        if (this.blockTimestamp[stakeLockItem.endHeight]) {
                            return;
                        }
                        checkBlockTime(stakeLockItem.endHeight, {forceFutureBlock: true})
                            .then(({timestamp}) => {
                                this.$set(this.blockTimestamp, stakeLockItem.endHeight, timestamp);
                            });
                    });
                },
            },
        },
        methods: {
            getTimeMinutes,
            getDate,
            getTimeZone,
            prettyPrecise,
            prettyRound,
            snakeCaseToText,
            getExplorerValidatorUrl,
            getValidatorName(item) {
                return item.validator.name;
            },
            getLabel(item) {
                const name = item.validator.name || item.validator.publicKey;
                return name.toString();
            },
        },
    };
</script>

<template>
    <div class="table-wrap">
        <div class="panel__content panel__section u-text-center" v-if="isLoading">
            <svg class="loader" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28">
                <circle class="loader__path" cx="14" cy="14" r="12"></circle>
            </svg>
        </div>
        <table class="u-text-nowrap" v-else-if="dataList.length">
            <thead>
            <tr>
                <th>Start block</th>
                <th>End block</th>
                <th>Lock type</th>
                <th>From validator</th>
                <th>To validator</th>
                <th>Value</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(dataItem, index) in lockList" :key="index">
                <!-- Time -->
                <!--<td>
                    <template v-if="dataType === $options.TYPE_REWARD">
                        {{ getDate(dataItem.timestamp) }}
                    </template>
                </td>-->
                <!-- block -->
                <td>
                    <nuxt-link class="link--default" :to="'/blocks/' + dataItem.startHeight">
                        {{ prettyRound(dataItem.startHeight) }}
                    </nuxt-link>
<!--                    ({{ getTimeMinutes(dataItem.createdAt) }}-->
<!--                    <span class="u-text-muted">{{ getTimeZone(dataItem.createdAt) }}</span>)-->
                </td>
                <td>
                    {{ prettyRound(dataItem.endHeight) }}
                    <template v-if="dataItem.endTimestamp">
                        (≈{{ getTimeMinutes(dataItem.endTimestamp) }}
                        <span class="u-text-muted">{{ getTimeZone(dataItem.endTimestamp) }}</span>)
                    </template>
                </td>
                <td>
                    {{ snakeCaseToText(dataItem.type) }}
                </td>
                <!-- public key -->
                <td>
                    <TableLink :link-text="getLabel(dataItem)"
                               :link-path="getExplorerValidatorUrl(dataItem.validator.publicKey)"
                               :should-not-shorten="!!dataItem.validator.name"
                    />
                </td>
                <!-- to validator -->
                <td>
                    <TableLink
                        v-if="dataItem.toValidator"
                        :link-text="getLabel(dataItem)"
                        :link-path="getExplorerValidatorUrl(dataItem.toValidator.publicKey)"
                        :should-not-shorten="!!dataItem.toValidator.name"
                    />
                    <span class="u-text-muted" v-else>—</span>
                </td>
                <!-- value -->
                <td>
                    {{ prettyPrecise(dataItem.value) }} {{ dataItem.coin.symbol }}
                </td>
            </tr>
            </tbody>
        </table>
        <div class="panel__content panel__section u-text-center" v-else>No locks</div>
    </div>
</template>
