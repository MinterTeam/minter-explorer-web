<script>
import {getFarmList, fillFarmWithPoolData} from '@/api/farm.js';
import {pretty, getDateHuman, getApy} from '~/assets/utils.js';
import getTitle from '~/assets/get-title.js';
import BackButton from '~/components/BackButton.vue';
// import {getFarmingPair} from '@/api/uniswap.js';

export default {
    components: {
        BackButton,
    },
    fetch() {
        // const uniswapFarmPromise = getFarmingPair()
        //     .then((pairDayData) => {
        //         this.uniswapPair = pairDayData;
        //     });

        const farmListPromise = fillFarmWithPoolData(getFarmList(), {skipLowLiquidity: true})
            .then((farmList) => {
                this.farmList = farmList;
            });

        return Promise.all([/*uniswapFarmPromise, */farmListPromise]);
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
            /** @type UniswapPairDailyData */
            uniswapPair: {},
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
            .sort((a, b) => {
                // first sort by apr
                // if (b.apr - a.apr !== 0) {
                //     return b.apr - a.apr;
                // }

                // then sort by liquidity
                return b.liquidityBip - a.liquidityBip;
            });
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
                        <a class="button button--ghost-main button--small" href="https://www.minter.network/earn/farm" target="_blank">What is yield farming?</a>
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
                <!--
                <div class="u-cell u-cell--small--1-2 u-cell--medium--1-3">
                    <div class="panel farm__uniswap-bg">
                        <div class="panel__section panel__header">
                            <a class="pool-pair link--hover" href="https://v2.info.uniswap.org/pair/0xb1700c93ddc26ce1d59441c24daef1035444d7b7" target="_blank">
                                <div class="pool-pair__figure pool-pair__figure--farming">
                                    <img class="pool-pair__icon" :src="getCoinIconUrl('USDTE')" width="24" height="24" alt="" role="presentation">
                                    <img class="pool-pair__icon pool-pair__icon1" src="/img/icon-coin-bipx.svg" width="24" height="24" alt="" role="presentation">
                                </div>
                                <div class="u-fw-700">
                                    USDT / BIPx
                                </div>
                            </a>
                            <a class="farm__uniswap-title link--hover u-fw-700" href="https://v2.info.uniswap.org/pair/0xb1700c93ddc26ce1d59441c24daef1035444d7b7" target="_blank">
                                Uniswap
                                <img src="/img/icon-uniswap.png" srcset="/img/icon-uniswap@2x.png 2x, /img/icon-uniswap@3x.png 3x" alt="Uniswap" width="24" height="24">
                            </a>
                        </div>
                        <div class="panel__content panel__section">
                            <dl class="farm__dl">
                                <dt class="farm__dt">End date</dt>
                                <dd class="farm__dd">
                                    15 August 2021
                                </dd>

                                <dt class="farm__dt" title="Total value locked">TVL</dt>
                                <dd class="farm__dd">${{ pretty(uniswapPair.reserveUSD) }}</dd>

                                <dt class="farm__dt">Reward type</dt>
                                <dd class="farm__dd">BIPx + USDT</dd>

                                <dt class="farm__dt u-fw-700" title="Based on 24hr rate annualized">Farming APR</dt>
                                <dd class="farm__dd u-fw-700">{{ pretty(73) }}%</dd>

                                <dt class="farm__dt u-fw-700" title="Based on 24hr volume annualized">Staking APY</dt>
                                <dd class="farm__dd u-fw-700">{{ pretty(uniswapPair.stakingApy) }}%</dd>
                            </dl>
                        </div>
                    </div>
                </div>
                -->
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
                                <dd class="farm__dd">
                                    <div v-for="date in pool.finishDateList" :key="date">{{ getDateHuman(date) }}</div>
                                </dd>

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
