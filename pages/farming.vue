<script>
import {getFarmList, fillFarmWithPoolData} from '@/api/farm.js';
import {pretty, getDateHuman, getApy} from '~/assets/utils.js';
import getTitle from '~/assets/get-title.js';
import BackButton from '~/components/BackButton.vue';

export default {
    components: {
        BackButton,
    },
    fetch() {
        return fillFarmWithPoolData(getFarmList())
            .then((farmList) => {
                this.farmList = farmList;
            });

    },
    head() {
        const title = getTitle('Yield farming');

        return {
            title: title,
            meta: [
                { hid: 'og-title', name: 'og:title', content: title },
            ],
        };
    },
    data() {
        return {
            /** @type Array<FarmItem> */
            farmList: [],
        };
    },
    computed: {
        farmListFormatted() {
            return this.farmList.map((pool) => {
                const apr = pool.percent * 365;

                const stakingApy = getApy(pool.tradeVolumeBip1D, pool.liquidityBip);

                return {
                    ...pool,
                    liquidityUsd: pool.liquidityBip * this.$store.getters['explorer/bipPriceUsd'],
                    // volumeUsd: pool.tradeVolumeBip1D * this.$store.getters['explorer/bipPriceUsd'],
                    apr,
                    stakingApy,
                };
            })
            .sort((a, b) => b.apr - a.apr);
        },
    },
    methods: {
        pretty,
        getDateHuman,
        getCoinIconUrl(coin) {
            return this.$store.getters['explorer/getCoinIcon'](coin);
        },
        getRewardCoin(pool) {
            return pool.rewardCoinList.map((coin) => coin.symbol).join(' + ');
        },
    },
};
</script>

<template>
    <div>
        <section class="panel u-section">
            <div class="panel__section panel__header panel__header--wrap">
                <h1 class="panel__title panel__header-title">
                    <BackButton/>
                    <img class="panel__header-title-icon" src="/img/icon-farm.svg" width="40" height="40" alt="" role="presentation">
                    <span>
                        Yield farm programs
                    </span>
                </h1>
                <div class="panel__header-controls">
                    <div class="button-group">
                        <a class="button button--main button--small" href="https://console.minter.network/pool" target="_blank">Start farming</a>
                        <a class="button button--ghost-main button--small" href="https://www.minter.network/howto/minter-farming" target="_blank">What is yield farming?</a>
                    </div>
                </div>
            </div>
        </section>

        <div class="panel__content panel__section u-text-center" v-if="$fetchState.pending">
            <svg class="loader" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28">
                <circle class="loader__path" cx="14" cy="14" r="12"></circle>
            </svg>
        </div>

        <div class="u-section" v-else>
            <div class="u-grid u-grid--vertical-margin">
                <div class="u-cell u-cell--small--1-2 u-cell--medium--1-3" v-for="pool in farmListFormatted" :key="pool.poolId">
                    <div class="panel">
                        <div class="panel__section panel__header">
                            <div class="pool-pair">
                                <div class="pool-pair__figure pool-pair__figure--farming">
                                    <img class="pool-pair__icon" :src="getCoinIconUrl(pool.coin0.symbol)" width="24" height="24" alt="" role="presentation">
                                    <img class="pool-pair__icon pool-pair__icon1" :src="getCoinIconUrl(pool.coin1.symbol)" width="24" height="24" alt="" role="presentation">
                                </div>
                                <nuxt-link class="link--default" :to="`/pools/${pool.coin0.symbol}/${pool.coin1.symbol}`">
                                    {{ pool.coin0.symbol }} / {{ pool.coin1.symbol }}
                                </nuxt-link>
                            </div>
                        </div>
                        <div class="panel__content panel__section">
                            <dl class="farm__dl">
                                <dt class="farm__dt">End date</dt>
                                <dd class="farm__dd">{{ getDateHuman(pool.finishAt) }}</dd>

                                <dt class="farm__dt" title="Total value locked">TVL</dt>
                                <dd class="farm__dd">${{ pretty(pool.liquidityUsd) }}</dd>

                                <dt class="farm__dt">Reward type</dt>
                                <dd class="farm__dd">{{ getRewardCoin(pool) }}</dd>

                                <dt class="farm__dt u-fw-700" title="Based on 24hr rate annualized">Farming APR</dt>
                                <dd class="farm__dd u-fw-700">{{ pretty(pool.apr) }}%</dd>

                                <dt class="farm__dt u-fw-700" title="Based on 24hr volume annualized">Staking APY</dt>
                                <dd class="farm__dd u-fw-700">{{ pretty(pool.stakingApy) }}%</dd>
                            </dl>
                        </div>
                    </div>
                </div>
                <div class="u-cell u-cell--small--1-2 u-cell--medium--1-3 farm__coming-soon-cell">
                    <div class="panel farm__coming-soon-panel">
                        <div class="panel__section">
                            New pools coming soon…
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
