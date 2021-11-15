<script>
    import {getTimeMinutes, getTimeZone, prettyPrecise, getExplorerValidatorUrl} from '~/assets/utils.js';
    import TableLink from '~/components/TableLink';

    export default {
        getTimeMinutes,
        getTimeZone,
        prettyPrecise,
        components: {
            TableLink,
        },
        props: {
            /** @type Array<Ban|Slash> */
            dataList: {
                type: Array,
                required: true,
            },
            itemType: {
                type: String,
                default: 'validator',
            },
            isLoading: {
                type: Boolean,
                default: false,
            },
        },
        methods: {
            getExplorerValidatorUrl,
            getValidatorName(item) {
                return item.validator?.name;
            },
            getLabel(item) {
                const name = item.validator?.name || item.validator?.publicKey;
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
                <!--<th>Name</th>-->
                <th>Time</th>
                <th>Block</th>
                <th>Event</th>
<!--                <th>{{ itemType === 'validator' ? 'Validator' : 'Address' }}</th>-->
<!--                <th>Value</th>-->
            </tr>
            </thead>
            <tbody>
            <tr v-for="(dataItem, index) in dataList" :key="index">
                <!-- Time -->
                <td>
                    {{ $options.getTimeMinutes(dataItem.timestamp) }}
                    <span class="u-text-muted">{{ $options.getTimeZone(dataItem.timestamp) }}</span>
                </td>
                <!-- block -->
                <td>
                    <TableLink :link-text="dataItem.height" :link-path="'/blocks/' + dataItem.height"/>
                </td>
                <!-- event -->
                <td>
                    {{ dataItem.type === 'ban' ? 'Ban' : 'Slash' }}
                    <template v-if="dataItem.toBlockId">
                        until {{ dataItem.toBlockId }}
                    </template>

                    <TableLink
                        v-if="dataItem.validator"
                        :link-text="getLabel(dataItem)"
                        :link-path="getExplorerValidatorUrl(dataItem.validator.publicKey)"
                        :should-not-shorten="!!dataItem.validator.name"
                        style="margin-left: 4px;"
                    />
                    <TableLink
                        v-else-if="dataItem.address"
                        :link-text="dataItem.address"
                        :link-path="'/address/' + dataItem.address"
                        style="margin-left: 4px;"
                    />

                    <span v-if="dataItem.amount">
                        {{ dataItem.coin.symbol }} {{ $options.prettyPrecise(dataItem.amount) }}
                    </span>
                </td>
            </tr>
            </tbody>
        </table>
        <div class="panel__content panel__section u-text-center" v-else>No penalties</div>
    </div>
</template>
