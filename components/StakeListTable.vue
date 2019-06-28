<script>
    import debounce from 'lodash-es/debounce';
    import {pretty, prettyPrecise} from '~/assets/utils';
    import TableLink from "~/components/TableLink";

    let resizeHandler;

    export default {
        name: 'StakeListTable',
        components: {
            TableLink,
        },
        filters: {
            pretty,
        },
        props: {
            /** @type Array<StakeItem> */
            stakeList: {
                type: Array,
                required: true,
            },
            stakeItemType: {
                type: String,
                default: 'validator',
            },
        },
        data() {
            return {
                shouldShortenAddress: this.getShouldShortenAddress(),
                sort: {
                    // 0 - no sort, -1 - ascending, 1 - descending
                    hash: 0,
                    value: -1,
                    coin: 0,
                },
            };
        },
        computed: {
            hashName() {
                if (this.stakeItemType === 'validator') {
                    return 'Public Key';
                }
                if (this.stakeItemType === 'delegator') {
                    return 'Address';
                }
                return '';
            },
            /** @type Array<StakeItem> */
            stakeListSorted() {
                return this.stakeList.slice(0).sort(makeSortQueue([
                    makeOrderedSortFn(this.sort.hash, this.hashSortFn),
                    makeOrderedSortFn(this.sort.value, valueSortFn),
                    makeOrderedSortFn(this.sort.coin, coinSortFn),
                ]));
            },
        },
        mounted() {
            if (process.client) {
                resizeHandler = debounce(() => {
                    this.shouldShortenAddress = this.getShouldShortenAddress();
                });
                window.addEventListener('resize', resizeHandler, 100);
            }
        },
        destroyed() {
            if (resizeHandler) {
                window.removeEventListener('resize', resizeHandler);
            }
        },
        methods: {
            prettyPrecise,
            getHash(stakeItem) {
                if (this.stakeItemType === 'validator') {
                    return stakeItem.pub_key;
                }
                if (this.stakeItemType === 'delegator') {
                    return stakeItem.address;
                }
            },
            getUrl(stakeItem) {
                if (this.stakeItemType === 'validator') {
                    return '/validator/' + stakeItem.pub_key;
                }
                if (this.stakeItemType === 'delegator') {
                    return '/address/' + stakeItem.address;
                }
            },
            getShouldShortenAddress() {
                if (this.stakeItemType === 'validator') {
                    return process.client && window.innerWidth < 700;
                }
                if (this.stakeItemType === 'delegator') {
                    return process.client && window.innerWidth < 600;
                }
            },
            toggleSort(field, inverseDirection) {
                // remove other fields from sort
                Object.keys(this.sort).forEach((key) => {
                    if (key !== field && this.sort[key] !== 0) {
                        this.sort[key] = 0;
                    }
                });
                const step = inverseDirection ? -1 : 1;
                // change field sort order between -1, 0, 1
                if (this.sort[field] === step) {
                    this.sort[field] = -1 * step;
                } else {
                    this.sort[field] += step;
                }
            },
            getSortClass(field) {
                switch (this.sort[field]) {
                    case 1:
                        return 'table__sort-button-icon--ascending';
                    case -1:
                        return 'table__sort-button-icon--descending';
                    case 0:
                        return '';
                }
            },
            /**
             * Default ascending: A -> B
             */
            hashSortFn(a, b) {
                if (this.stakeItemType === 'validator') {
                    return ('' + a.pub_key).localeCompare(b.pub_key);
                }
                if (this.stakeItemType === 'delegator') {
                    return ('' + a.address).localeCompare(b.address);
                }
            },
        },
    };

    /**
     * Default ascending: A -> B
     */
    function coinSortFn(a, b) {
        return ('' + a.coin).localeCompare(b.coin);
    }

    /**
     * Default ascending: 1 -> 2
     */
    function valueSortFn(a, b) {
        return a.bip_value - b.bip_value;
    }


    /**
     * Change sort order direction depending on `order` (-1, 0, 1)
     * @param {number} order - 0: no sort, 1: default, -1: inverse
     * @param {Function} sortFn
     */
    function makeOrderedSortFn(order, sortFn) {
        return function(a, b) {
            return order * sortFn(a, b);
        };
    }

    /**
     * Make sort function, which will apply every sortFn from array of sort functions, next sortFn applies only if previous returned `0`
     * @param {Array<Function>} fnArray
     * @return {Function} sort function
     */
    function makeSortQueue(fnArray) {
        return function(a, b) {
            return fnArray.reduce((result, sortFnItem) => {
                // if result === 0 => apply sortFnItem
                return result || sortFnItem(a, b);
            }, 0);
        };
    }
</script>

<template>
    <div class="table-wrap">
        <table class="u-text-nowrap table--vertical-top">
            <thead>
            <tr>
                <th>
                    <button class="table__sort-button u-semantic-button link--hover" @click="toggleSort('hash')">
                        <span class="table__sort-button-text">{{ hashName }}</span>
                        <img class="table__sort-button-icon" src="/img/icon-sort.svg" alt="Sort" :class="getSortClass('hash')">
                    </button>
                </th>
                <th class="u-hidden-medium-down">
                    <button class="table__sort-button u-semantic-button link--hover" @click="toggleSort('coin')">
                        <span class="table__sort-button-text">Coin</span>
                        <img class="table__sort-button-icon" src="/img/icon-sort.svg" alt="Sort" :class="getSortClass('coin')">
                    </button>
                </th>
                <th>
                    <button class="table__sort-button u-semantic-button link--hover" @click="toggleSort('value', true)">
                        <span class="table__sort-button-text">Amount</span>
                        <img class="table__sort-button-icon" src="/img/icon-sort.svg" alt="Sort" :class="getSortClass('value')">
                    </button>
                </th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="stakeItem in stakeListSorted" :key="getHash(stakeItem) + stakeItem.coin">
                <td>
                    <TableLink :link-text="getHash(stakeItem)"
                               :link-path="getUrl(stakeItem)"
                               :should-not-shorten="!shouldShortenAddress"
                    />
                </td>
                <td class="u-hidden-medium-down">{{ stakeItem.coin }}</td>
                <td>
                    <span class="u-hidden-medium-up">{{ stakeItem.coin }}</span>

                    <span :title="prettyPrecise(stakeItem.value)">{{ stakeItem.value | pretty }}</span>

                    <div class="u-text-muted" :title="prettyPrecise(stakeItem.bip_value)" v-if="stakeItem.coin !== $store.getters.COIN_NAME">{{ $store.getters.COIN_NAME }} {{ stakeItem.bip_value | pretty }}</div>
                </td>
            </tr>
            </tbody>
        </table>
    </div>
</template>
