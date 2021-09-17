<script>
import {pretty} from '~/assets/utils.js';
import TableLink from '@/components/TableLink.vue';

const ITEM_TYPE = {
    ORDER_ADDRESS: 'address',
    ORDER_POOL: 'pool',
};

export default {
    ITEM_TYPE,
    components: {
        TableLink,
    },
    props: {
        /** @type Array<LimitOrder> */
        orderList: {
            type: Array,
            required: true,
        },
        itemType: {
            type: String,
            default: ITEM_TYPE.ORDER_POOL,
        },
        isLoading: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
        };
    },
    computed: {
        orderListFormatted() {
            return this.orderList;
        },
    },
    methods: {
        pretty,
        formatStatus(status) {
            status = status.replaceAll('_', ' ');
            return status[0].toUpperCase() + status.substring(1);
        },
        getCoinIconUrl(coin) {
            return this.$store.getters['explorer/getCoinIcon'](coin);
        },
        shouldShowInitial(volume, initialVolume) {
            if (volume <= 0) {
                return false;
            }
            return volume !== initialVolume;
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
        <table class="u-text-nowrap" v-else-if="orderListFormatted.length">
            <thead>
            <tr>
                <th>ID</th>
                <th v-if="itemType === $options.ITEM_TYPE.ORDER_ADDRESS">
                    Owner
                </th>
                <th>Want to sell</th>
                <th>Want to buy</th>
                <th>Sell price</th>
                <th>Buy price</th>
                <th>Status</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="order in orderListFormatted" :key="order.id">
                <td>{{ order.id }}</td>
                <td v-if="itemType === $options.ITEM_TYPE.ORDER_ADDRESS">
                    <TableLink :link-text="order.address"
                               :link-path="'/address/' + order.address"
                               :should-not-shorten="false"
                    />
                </td>
                <td>
                    <span class="u-fw-500">
                        {{ pretty(order.coinToSellVolume > 0 ? order.coinToSellVolume : order.initialCoinToSellVolume) }}
                    </span>
                    <span class="u-text-muted" v-if="shouldShowInitial(order.coinToSellVolume, order.initialCoinToSellVolume)">
                        ({{ pretty(order.initialCoinToSellVolume) }})
                    </span>
                    {{ order.coinToSell.symbol }}
                </td>
                <td>
                    <span class="u-fw-500">
                        {{ pretty(order.coinToBuyVolume > 0 ? order.coinToBuyVolume : order.initialCoinToBuyVolume) }}
                    </span>
                    <span class="u-text-muted" v-if="shouldShowInitial(order.coinToBuyVolume, order.initialCoinToBuyVolume)">
                        ({{ pretty(order.initialCoinToSellVolume) }})
                    </span>
                    {{ order.coinToBuy.symbol }}
                </td>
                <td>
                    {{ pretty(order.coinToSellPrice) }} {{ order.coinToBuy.symbol }}
                </td>
                <td>
                    {{ pretty(order.coinToBuyPrice) }} {{ order.coinToSell.symbol }}
                </td>
                <td :class="order.status === 'active' ? 'u-text-success u-fw-500' : ''">{{ formatStatus(order.status) }}</td>
            </tr>
            </tbody>
        </table>
        <div class="panel__content panel__section u-text-center" v-else>
            No orders
        </div>
    </div>
</template>
