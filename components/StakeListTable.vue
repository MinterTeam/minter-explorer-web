<script>
    import debounce from 'lodash-es/debounce';
    import {pretty} from '~/assets/utils';
    import TableLink from "~/components/TableLink";

    export default {
        name: 'StakeListTable',
        components: {
            TableLink,
        },
        filters: {
            pretty,
        },
        props: {
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
        },
        mounted() {
            if (process.client) {
                window.addEventListener('resize', debounce(() => {
                    this.shouldShortenAddress = this.getShouldShortenAddress();
                }), 100);
            }
        },
        methods: {
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
        },
    };
</script>

<template>
    <div class="table-wrap">
        <table class="u-text-nowrap">
            <thead>
            <tr>
                <th>{{ hashName }}</th>
                <th>Amount</th>
                <th class="u-hidden-medium-down">Coin</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="stake in stakeList" :key="getHash(stake) + stake.coin">
                <td>
                    <TableLink :link-text="getHash(stake)"
                               :link-path="getUrl(stake)"
                               :should-not-shorten="!shouldShortenAddress"
                    />
                </td>
                <td>
                    {{ stake.value | pretty }}
                    <span class="u-hidden-medium-up">{{ stake.coin }}</span>
                </td>
                <td class="u-hidden-medium-down">{{ stake.coin }}</td>
            </tr>
            </tbody>
        </table>
    </div>
</template>
