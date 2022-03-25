<script>
    import {getTimeMinutes, getDate, getTimeZone, prettyPrecise, getExplorerValidatorUrl} from '~/assets/utils';
    import TableLink from '~/components/TableLink';


    export default {
        ideFix: null,
        getTimeMinutes,
        getDate,
        getTimeZone,
        prettyPrecise,
        components: {
            TableLink,
        },
        props: {
            /** @type Array<StakeLockItem> */
            dataList: {
                type: Array,
                required: true,
            },
            isLoading: {
                type: Boolean,
                default: false,
            },
        },
        methods: {
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
                <th>Block</th>
<!-- @TODO end block, end time -->
                <th>Lock type</th>
                <th>From validator</th>
                <th>To validator</th>
                <th>Value</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(dataItem, index) in dataList" :key="index">
                <!-- Time -->
                <!--<td>
                    <template v-if="dataType === $options.TYPE_REWARD">
                        {{ $options.getDate(dataItem.timestamp) }}
                    </template>
                </td>-->
                <!-- block -->
                <td>
                    <nuxt-link class="link--default" :to="'/blocks/' + dataItem.height">
                        {{ dataItem.height }}
                    </nuxt-link>
                    ({{ $options.getTimeMinutes(dataItem.createdAt) }}
                    <span class="u-text-muted">{{ $options.getTimeZone(dataItem.createdAt) }}</span>)
                </td>
                <td>
                    {{ dataItem.type }}
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
                    {{ $options.prettyPrecise(dataItem.value) }} {{ dataItem.coin.symbol }}
                </td>
            </tr>
            </tbody>
        </table>
        <div class="panel__content panel__section u-text-center" v-else>No locks</div>
    </div>
</template>
