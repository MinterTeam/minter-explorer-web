<script>
    import {getTimeDistance, pretty} from '~/assets/utils';

    export default {
        filters: {
            pretty,
        },
        props: {
            /** @type Array<Block> */
            blockList: {
                type: Array|null,
                required: true,
            },
        },
        computed: {
            blockListFormatted() {
                return this.blockList ? this.blockList.map((block) => {
                    const validator = block.validators[0] || {};
                    return {
                        ...block,
                        url: '/blocks/' + block.height,
                        validatorName: validator.name || validator.address,
                        validatorUrl: '/address/' + validator.address,
                        timeDistance: getTimeDistance(block.timestamp),
                    };
                }) : [];
            },
        },
    };
</script>

<template>
    <div class="panel preview">
        <div class="preview__header panel__section panel__header">
            <h2 class="panel__header-title panel__title">
                <img class="panel__header-title-icon" src="/img/icon-block.svg" width="40" height="40" alt="" role="presentation">
                Blocks
            </h2>
            <nuxt-link class="button button--ghost-main button--small" to="/blocks">View All</nuxt-link>
        </div>
        <transition name="v-transition-fade">
            <div class="preview__content" v-if="blockListFormatted.length">
                <div class="preview__block panel__section" v-for="block in blockListFormatted" :key="block.height">
                    <div class="u-grid">
                        <div class="u-cell u-cell--1-3">
                            <div class="preview__block-id"><nuxt-link class="link--hover" :to="block.url">{{ block.height }}</nuxt-link></div>
                            <div class="preview__block-time">{{ block.timeDistance }} ago</div>
                        </div>
                        <div class="u-cell u-cell--2-3">
                            <!--Mined by <nuxt-link class="link&#45;&#45;default" :to="block.validatorUrl">{{ block.validatorName }}</nuxt-link>-->
                            <div class="preview__block-reward">
                                <nuxt-link class="link--default" :to="block.url">{{ block.txCount }} txns</nuxt-link> in {{ block.blockTime }} secs
                                <br>
                                Block Reward {{ block.reward | pretty }} {{ $store.state.COIN_NAME }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>
