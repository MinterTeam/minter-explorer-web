<script>
    export default {

    }
</script>

<template>
    <div class="panel">
        <div class="preview__header panel__section panel__header">
            <h2 class="panel__header-title panel__title">
                <img class="panel__header-title-icon" src="/img/icon-block.svg" alt="" role="presentation">
                Blocks
            </h2>
            <nuxt-link class="button button--ghost-main button--small" to="/blocks">View All</nuxt-link>
        </div>
        <div class="preview__content">
            <div class="preview__block panel__section" v-for="n in 10" :key="n">
                <div class="u-grid">
                    <div class="u-cell u-cell--1-3">
                        <div class="preview__block-id">5372230</div>
                        <div class="preview__block-time">> 45 secs ago</div>
                    </div>
                    <div class="u-cell u-cell--2-3">
                        Mined by <a class="link--main link--hover u-fw-700" href="#">f2pool_2</a>
                        <div class="preview__block-reward">
                            <a class="link--main link--hover u-fw-700" href="#">152 txns</a> in 26 secs
                            <br>
                            Block Reward 3.33474 Ether
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
