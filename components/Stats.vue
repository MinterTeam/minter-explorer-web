<script>
    import prettyNum, {PRECISION_SETTING} from 'pretty-num';
    import {pretty, prettyUsd, prettyRound, round} from "~/assets/utils";

    export default {
        filters: {
            pretty,
            prettyUsd,
            prettyRound,
            coinPrice: (value) => prettyNum(value, {precision: 4, precisionSetting: PRECISION_SETTING.FIXED}),
            marketCap: (value) => {
                const ROUND_POWER = 3;
                if (value > Math.pow(10, 9)) {
                    return round(value / Math.pow(10, 9), ROUND_POWER) + ' billion';
                }
                if (value > Math.pow(10, 6)) {
                    return round(value / Math.pow(10, 6), ROUND_POWER) + ' million';
                }
                return prettyRound(value);
            },
        },
        props: {
            /** @type Status */
            stats: {
                type: Object,
                required: true,
            },
            latestBlockHeight: {
                type: [Number, String],
                required: true,
            },
            totalTransactions: {
                type: [Number, String],
                required: true,
            },
        },
    };
</script>

<template>
    <div class="index-stats panel">
        <div class="index-stats__section panel__section">
            <div class="u-grid u-grid--vertical-margin">
                <div class="u-cell u-cell--small--1-2">
                    <h3 class="index-stats__name panel__title">Last block</h3>
                    <div class="index-stats__value index-stats__value--primary">
                        <span class="index-stats__value-text">{{ latestBlockHeight | prettyRound }}</span> <br>
                    </div>
                </div>
                <div class="u-cell u-cell--small--1-2">
                    <h3 class="index-stats__name panel__title">Transactions</h3>
                    <div class="index-stats__value index-stats__value--primary">
                        <span class="index-stats__value-text">{{ totalTransactions | prettyRound }}</span> <br>
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
