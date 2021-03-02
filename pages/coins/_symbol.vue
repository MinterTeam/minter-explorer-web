<script>
    import {getCoinBySymbol} from "~/api/index.js";
    import {pretty, prettyPrecise, prettyExact} from "~/assets/utils.js";
    import getTitle from '~/assets/get-title.js';
    import {getErrorText} from '~/assets/server-error.js';
    import BackButton from '~/components/BackButton.vue';

    export default {
        components: {
            BackButton,
        },
        asyncData({ params, error }) {
            if (!params.symbol || params.symbol.length < 3) {
                return error({
                    statusCode: 404,
                    message: 'Invalid coin symbol',
                });
            }

            return getCoinBySymbol(params.symbol)
                .then((coinInfo) => {
                    return {
                        coinInfo,
                    };
                })
                .catch((e) => {
                    console.log({e});
                    let statusCode = e.request && e.request.status;
                    error({
                        statusCode,
                        message: statusCode === 404 ? 'Coin not found' : getErrorText(e),
                    });
                });
        },
        head() {
            const title = getTitle('Coin ' + this.$route.params.symbol);

            return {
                title: title,
                meta: [
                    { hid: 'og-title', name: 'og:title', content: title },
                ],
            };
        },
        data() {
            return {
                /** @type CoinInfo */
                coinInfo: {},
            };
        },
        computed: {
        },
        methods: {
            pretty,
            prettyExact,
            prettyPrecise,
        },
    };
</script>

<template>
    <div>
        <section class="panel u-section">
            <div class="panel__section panel__header">
                <h1 class="panel__header-title panel__title">
                    <BackButton/>
                    Coin information
                </h1>
            </div>
            <dl>
                <dt>ID</dt>
                <dd>{{ coinInfo.id }}</dd>

                <dt>Name</dt>
                <dd :class="{'u-text-muted': !coinInfo.name }">{{ coinInfo.name || 'Blank' }}</dd>

                <dt>Symbol</dt>
                <dd>{{ coinInfo.symbol }}</dd>

                <dt>CRR</dt>
                <dd>{{ coinInfo.crr }} %</dd>

                <dt>Volume</dt>
                <dd :title="prettyPrecise(coinInfo.volume)">{{ pretty(coinInfo.volume) }}</dd>

                <dt>Reserve</dt>
                <dd :title="prettyPrecise(coinInfo.reserveBalance)">{{ pretty(coinInfo.reserveBalance) }} {{ $store.getters.COIN_NAME }}</dd>

                <dt>Max supply</dt>
                <dd :title="prettyPrecise(coinInfo.maxSupply)">{{ pretty(coinInfo.maxSupply) }}</dd>

                <dt>Owner address</dt>
                <dd>
                    <nuxt-link class="link--default" :to="'/address/' + coinInfo.ownerAddress" v-if="coinInfo.ownerAddress">
                        {{ coinInfo.ownerAddress }}
                    </nuxt-link>
                    <span class="u-text-muted" v-else>Blank</span>

                </dd>
            </dl>
        </section>
    </div>
</template>
