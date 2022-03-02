<script>
import {getOracleCoinList, getOraclePriceList} from '@/api/hub.js';
import HubCoinList from '@/components/HubCoinList.vue';

export default {
    components: {
        HubCoinList,
    },
    fetch() {
        return Promise.all([getOracleCoinList(), getOraclePriceList()])
            .then(([coinList, priceList]) => {
                this.coinList = Object.freeze(coinList);
                this.priceList = Object.freeze(priceList);
            });
    },
    data() {
        return {
            /**
             * @type Array<HubCoinItem>
             */
            coinList: [],
            /**
             * @type Array<{name: string, value: string}>
             */
            priceList: [],
        };
    },
};
</script>

<template>
    <div>
        <HubCoinList :coin-list="coinList" :price-list="priceList" :is-loading="$fetchState.pending"/>
    </div>
</template>
