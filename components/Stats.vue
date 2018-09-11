<script>
    import {pretty, prettyUsd, prettyRound, round} from "~/assets/utils";

    export default {
        filters: {
            pretty,
            prettyUsd,
            marketCap: (value) => {
                const ROUND_POWER = 3;
                if (value > Math.pow(10, 9)) {
                    return round(value / Math.pow(10, 9), ROUND_POWER) + ' billion';
                }
                if (value > Math.pow(10, 6)) {
                    return round(value / Math.pow(10, 6), ROUND_POWER) + ' million';
                }
                return prettyRound(value);
            }
        },
        props: {
            /** @type Status */
            stats: {
                type: Object,
                required: true,
            }
        },
    }
</script>

<template>
    <div class="index-stats panel">
        <div class="index-stats__section panel__section">
            <div class="u-grid u-grid--vertical-margin">
                <div class="u-cell">
                    <h3 class="index-stats__name panel__title">Market cap of ${{ stats.marketCap | marketCap }}</h3>
                    <div class="index-stats__value index-stats__value--primary">
                        <span class="index-stats__value-text">${{ stats.bipPriceUsd | prettyUsd }} <!--@&nbsp;{{ stats.bipPriceBtc | pretty }}&nbsp;{{ $store.state.COIN_NAME }}/BTC--></span>
                        <span class="index-stats__sub-value index-stats__sub-value--dynamic" :class="stats.bipPriceChange >= 0 ? 'index-stats__green' : 'index-stats__red'">
                            <img src="/img/icon-dynamic-up.svg" alt="Up" v-if="stats.bipPriceChange >= 0">
                            <img src="/img/icon-dynamic-down.svg" alt="Down" v-else>
                            {{ stats.bipPriceChange }}%
                        </span>
                    </div>
                </div>
                <div class="u-cell u-cell--small--1-2">
                    <h3 class="index-stats__name panel__title">Last block</h3>
                    <div class="index-stats__value index-stats__value--primary">
                        <span class="index-stats__value-text">{{ stats.latestBlockHeight | pretty }}</span>
                        <span class="index-stats__sub-value">({{ stats.averageBlockTime | pretty }}s)</span>
                    </div>
                </div>
                <div class="u-cell u-cell--small--1-2">
                    <h3 class="index-stats__name panel__title">Transactions</h3>
                    <div class="index-stats__value index-stats__value--primary">
                        <span class="index-stats__value-text">{{ stats.totalTransactions | pretty }}</span>
                        <span class="index-stats__sub-value">({{ stats.transactionsPerSecond | pretty }} TPS)</span>
                    </div>
                </div>
            </div>
        </div>
        <!--
        <div class="index-stats__section panel__section">
            <div class="u-grid u-grid--vertical-margin">
                <div class="u-cell u-cell--1-2">
                    <div class="index-stats__name">Hash Rate</div>
                    <div class="index-stats__value">252,399.66 GH/s</div>
                </div>
                <div class="u-cell u-cell--1-2">
                    <div class="index-stats__name">Network Difficulty</div>
                    <div class="index-stats__value">3,165.40 TH</div>
                </div>
            </div>
        </div>
        -->
    </div>
</template>
