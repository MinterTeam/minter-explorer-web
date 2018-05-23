<script>
    export default {
        data() {
            return {
                query: '',
            }
        },
        methods: {
            submit() {
                if (!this.query.trim().length) {
                    return;
                }
            },
            inputFocus() {
                this.$emit('inputFocus');
            },
            inputBlur() {
                this.$emit('inputBlur');
            }
        }
    }
</script>

<template>
    <form class="header__search" @submit="submit">
        <img class="header__search-icon" src="/img/icon-search.svg" alt="" role="presentation">
        <div class="header__search-input-wrap">
            <input class="header__search-input" type="text" placeholder="Search by Address / Txhash / Block"
                   v-model="query"
                   @focus="inputFocus"
                   @blur="inputBlur"
            >
        </div>
        <transition name="v-transition-fade">
            <button class="header__search-button button button--main button--small" :disabled="!query.trim().length">Go</button>
        </transition>
    </form>
</template>
