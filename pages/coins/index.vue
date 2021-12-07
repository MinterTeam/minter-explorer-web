<script>
    import {getValidatorList} from '~/api/explorer.js';
    import {pretty, prettyRound, getExplorerValidatorUrl} from '~/assets/utils.js';
    import {VALIDATOR_STATUS} from '~/assets/variables.js';
    import getTitle from '~/assets/get-title.js';
    import BackButton from '~/components/BackButton.vue';
    import TableLink from '~/components/TableLink.vue';

    export default {
        VALIDATOR_STATUS,
        components: {
            BackButton,
            TableLink,
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
        methods: {
            pretty,
            prettyRound,
            getExplorerValidatorUrl,
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
                        <th>Volume</th>
                        <th>Reserve</th>
                        <th>Crr</th>
                        <th>Owner</th>
                    </tr>
                    </thead>
                    <tbody>
                    <!-- @TODO pagination -->
                    <tr v-for="coin in $store.state.explorer.coinList.slice(0, 50)" :key="coin.id">
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
                        <td>{{ coin.type }}</td>
                        <td>{{ prettyRound(coin.volume) }}</td>
                        <td>{{ prettyRound(coin.reserveBalance) }} {{ $store.state.COIN_NAME }}</td>
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
    </div>
</template>
