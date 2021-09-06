<script>
    import {getDate, getTimeZone, prettyPrecise} from '~/assets/utils.js';
    import TableLink from '~/components/TableLink';

    export default {
        getDate,
        getTimeZone,
        prettyPrecise,
        components: {
            TableLink,
        },
        props: {
            /** @type Array<Reward> */
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
                <th>Reward type</th>
                <th>{{ itemType === 'validator' ? 'Validator' : 'Address' }}</th>
                <th>Value</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(dataItem, index) in dataList" :key="index">
                <!-- Time -->
                <td>
                    {{ $options.getDate(dataItem.timestamp) }}
                </td>
                <!-- block -->
<!--                <td>-->
<!--                    <TableLink :link-text="dataItem.height" :link-path="'/blocks/' + dataItem.height"/>-->
<!--                </td>-->
                <!-- reward type -->
                <td>
                    {{ dataItem.role }}
                </td>
                <!-- public key -->
                <td>
                    <TableLink
                        v-if="dataItem.validator"
                        :link-text="getLabel(dataItem)"
                        :link-path="'/validator/' + dataItem.validator.publicKey"
                        :should-not-shorten="!!dataItem.validator.name"
                    />
                    <TableLink
                        v-else-if="dataItem.address"
                        :link-text="dataItem.address"
                        :link-path="'/address/' + dataItem.address"
                    />
                </td>
                <!-- value -->
                <td>
                    {{ $store.state.COIN_NAME }} {{ $options.prettyPrecise(dataItem.amount) }}
                </td>
            </tr>
            </tbody>
        </table>
        <div class="panel__content panel__section u-text-center" v-else>No rewards</div>
    </div>
</template>
