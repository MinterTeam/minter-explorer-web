<script>
import {prettyRound} from '~/assets/utils.js';

const COIN_LIST_LENGTH = 5;

export default {
    data() {
        return {
        };
    },
    computed: {
        coinListPrepared() {
            return this.$store.state.explorer.coinList
                .slice(0, COIN_LIST_LENGTH);
        },
    },
    methods: {
        prettyRound,
    },
};
</script>

<template>
    <div class="panel preview">
        <div class="preview__header panel__section panel__header">
            <h2 class="panel__header-title panel__title">
                <img class="panel__header-title-icon" src="/img/icon-coins.svg" width="40" height="40" alt="" role="presentation">
                Coins
            </h2>
            <nuxt-link class="button button--ghost-main button--small" to="/coins">View all</nuxt-link>
        </div>
        <transition name="v-transition-fade">
            <table class="preview-table">
                <tbody>
                <tr v-for="coin in coinListPrepared" :key="coin.id">
                    <td>
                        <nuxt-link
                            class="u-icon-wrap link--default-wrap"
                            :to="`/coins/${coin.symbol}`"
                        >
                            <img
                                class="preview-table__icon u-icon--coin"
                                width="40" height="40" alt="" role="presentation"
                                :src="$store.getters['explorer/getCoinIcon'](coin.symbol)"
                            >
                            <div>
                                <div class="link--default-inner u-text-medium">
                                    {{ coin.symbol }}
                                </div>
                                <div class="u-text-muted">{{ coin.name }}</div>
                            </div>
                        </nuxt-link>
                    </td>
                    <td>
                        <div class="u-text-muted">Volume</div>
                        <div class="u-fw-500">{{ prettyRound(coin.volume) }}</div>
                    </td>
                    <td>
                        <div class="u-text-muted">CRR</div>
                        <div class="u-fw-500" v-if="coin.crr">{{ coin.crr }}&thinsp;%</div>
                        <div v-else>—</div>
                    </td>
                </tr>
                </tbody>
            </table>
        </transition>
    </div>
</template>
