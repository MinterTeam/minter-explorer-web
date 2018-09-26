<script>
    import {getTimeUTC, pretty} from '~/assets/utils';
    import TableLink from '~/components/TableLink';

    export default {
        components: {
            TableLink,
        },
        filters: {
            pretty,
            time: getTimeUTC,
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
            isLoading: {
                type: Boolean,
                default: false,
            },
        },
    };
</script>

<template>
    <div class="table-wrap">
        <table class="u-text-nowrap" v-if="dataList.length">
            <thead>
            <tr>
                <!--<th>Name</th>-->
                <th>Time</th>
                <th>Block</th>
                <th v-if="dataType === 'reward'">Reward Type</th>
                <th>Validators' Public Key</th>
                <th>Value</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(dataItem, index) in dataList" :key="index">
                <!-- Time -->
                <td>{{ dataItem.timestamp | time }}</td>
                <!-- block -->
                <td>
                    <TableLink :link-text="dataItem.block" :link-path="'/blocks/' + dataItem.block"/>
                </td>
                <!-- type -->
                <td v-if="dataType === 'reward'">
                    {{ dataItem.role }}
                </td>
                <!-- public key -->
                <td>
                    <TableLink :link-text="dataItem.validator"
                               :link-path="'/validator/' + dataItem.validator"
                    />
                </td>
                <!-- value -->
                <td>
                    {{ dataItem.amount | pretty }} {{ dataType === 'reward' ? $store.state.COIN_NAME : dataItem.coin }}
                </td>
            </tr>
            </tbody>
        </table>
        <div class="panel__content panel__section u-text-center" v-else-if="isLoading">
            <svg class="loader" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28">
                <circle class="loader__path" cx="14" cy="14" r="12"></circle>
            </svg>
        </div>
        <div class="panel__content panel__section u-text-center" v-else>No {{ dataType === 'reward' ? 'Rewards' : 'Slashes' }}</div>
    </div>
</template>
