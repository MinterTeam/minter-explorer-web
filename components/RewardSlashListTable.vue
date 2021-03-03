<script>
    import {getTimeMinutes, getDate, getTimeZone, prettyPrecise} from '~/assets/utils';
    import TableLink from '~/components/TableLink';

    const TYPE_REWARD = 'reward';
    const TYPE_SLASH = 'slash';

    export default {
        ideFix: null,
        TYPE_REWARD,
        TYPE_SLASH,
        getTimeMinutes,
        getDate,
        getTimeZone,
        prettyPrecise,
        components: {
            TableLink,
        },
        props: {
            /** @type Array<Reward|Slash> */
            dataList: {
                type: Array,
                required: true,
            },
            dataType: {
                type: String,
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
                <th v-if="dataType === $options.TYPE_SLASH">Block</th>
                <th v-if="dataType === $options.TYPE_REWARD">Reward Type</th>
                <th>{{ itemType === 'validator' ? 'Validator' : 'Address' }}</th>
                <th>Value</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(dataItem, index) in dataList" :key="index">
                <!-- Time -->
                <td>
                    <template v-if="dataType === $options.TYPE_REWARD">
                        {{ $options.getDate(dataItem.timestamp) }}
                    </template>
                    <template v-else>
                        {{ $options.getTimeMinutes(dataItem.timestamp) }}
                        <span class="u-text-muted">{{ $options.getTimeZone(dataItem.timestamp) }}</span>
                    </template>
                </td>
                <!-- block -->
                <td v-if="dataType === $options.TYPE_SLASH">
                    <TableLink :link-text="dataItem.height" :link-path="'/blocks/' + dataItem.height"/>
                </td>
                <!-- type -->
                <td v-if="dataType === $options.TYPE_REWARD">
                    {{ dataItem.role }}
                </td>
                <!-- public key -->
                <td>
                    <TableLink
                        v-if="itemType === 'validator'"
                        :link-text="getLabel(dataItem)"
                        :link-path="'/validator/' + dataItem.validator.publicKey"
                        :should-not-shorten="!!dataItem.validator.name"
                    />
                    <TableLink
                        v-else
                        :link-text="dataItem.address"
                        :link-path="'/address/' + dataItem.address"
                    />
                </td>
                <!-- value -->
                <td>
                    {{ dataType === $options.TYPE_REWARD ? $store.state.COIN_NAME : dataItem.coin.symbol }} {{ $options.prettyPrecise(dataItem.amount) }}
                </td>
            </tr>
            </tbody>
        </table>
        <div class="panel__content panel__section u-text-center" v-else>No {{ dataType === $options.TYPE_REWARD ? 'Rewards' : 'Slashes' }}</div>
    </div>
</template>
