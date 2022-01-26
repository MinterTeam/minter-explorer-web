<script>
import {pretty, prettyRound, getExplorerValidatorUrl} from '~/assets/utils.js';
import {VALIDATOR_STATUS} from '~/assets/variables.js';
import getTitle from '~/assets/get-title.js';
import BackButton from '~/components/BackButton.vue';
import TableLink from '~/components/TableLink.vue';
import Pagination from "~/components/Pagination.vue";

const PER_PAGE = 50;

export default {
    VALIDATOR_STATUS,
    components: {
        BackButton,
        TableLink,
        Pagination,
    },
    head() {
        const title = getTitle('Coins');

        return {
            title: title,
            meta: [
                { hid: 'og-title', name: 'og:title', content: title },
            ],
        };
    },
    computed: {
        coinList() {
            const index = this.paginationInfo.currentPage - 1;
            return this.$store.state.explorer.coinList.slice(index * PER_PAGE, (index + 1) * PER_PAGE);
        },
        paginationInfo() {
            return {
                currentPage: this.$route.query.page > 1 ? Number(this.$route.query.page) : 1,
                lastPage: Math.ceil(this.$store.state.explorer.coinList.length / PER_PAGE),
            };
        },
    },
    methods: {
        pretty,
        prettyRound,
        getExplorerValidatorUrl,
        formatType(value) {
            value = value.replaceAll('_', ' ');
            return value.charAt(0).toUpperCase() + value.slice(1); // capitalize the first letter
        },
    },
};
</script>

<template>
    <div>
        <section class="panel u-section">
            <div class="panel__section panel__header">
                <h1 class="panel__title panel__header-title">
                    <BackButton/>
                    <span>
                        Coins
                    </span>
                </h1>
            </div>
            <div class="table-wrap">
                <table class="u-text-nowrap">
                    <thead>
                    <tr>
                        <th>Symbol</th>
                        <th>Type</th>
                        <th>Supply</th>
                        <th>Reserve</th>
                        <th>CRR</th>
                        <th>Owner</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="coin in coinList" :key="coin.id">
                        <td>
                            <!-- @TODO show icon as in preview -->
                            <nuxt-link class="link--default u-icon-wrap u-text-white-space-normal" :to="`/coins/${coin.symbol}`">
                                <img
                                    class="u-icon--coin"
                                    width="24" height="24" alt="" role="presentation"
                                    :src="$store.getters['explorer/getCoinIcon'](coin.symbol)"
                                >
                                {{ coin.symbol }}
                            </nuxt-link>
                        </td>
                        <td>{{ formatType(coin.type) }}</td>
                        <td>
                            <template v-if="coin.symbol !== $store.getters.BASE_COIN">
                                {{ prettyRound(coin.volume) }}
                            </template>
                            <template v-else>—</template>
                        </td>
                        <td>
                            <template v-if="coin.reserveBalance > 0">
                                {{ prettyRound(coin.reserveBalance) }} {{ $store.state.COIN_NAME }}
                            </template>
                            <template v-else>—</template>
                        </td>
                        <td>
                            <template v-if="coin.crr">{{ coin.crr }}&thinsp;%</template>
                            <template v-else>—</template>
                        </td>
                        <td>
                            <TableLink
                                v-if="coin.ownerAddress"
                                :link-path="'/address/' + coin.ownerAddress"
                                :link-text="coin.ownerAddress"
                            />
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </section>
        <Pagination :pagination-info="paginationInfo"/>
    </div>
</template>
