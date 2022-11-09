<script>
import InlineSvg from 'vue-inline-svg';
import ButtonCopy from '~/components/common/ButtonCopy.vue';
import {BASE_URL_PREFIX} from '~/assets/variables.js';

export default {
    BASE_URL_PREFIX,
    components: {
        InlineSvg,
        ButtonCopy,
    },
    props: {
        copyText: {
            type: String,
            required: true,
        },
    },
};
</script>

<template functional>
    <component
        :is="$options.components.ButtonCopy"
        class="u-icon u-icon--copy--right u-semantic-button link--opacity" aria-label="Copy"
        :class="[data.staticClass, data.class]"
        v-bind="data.attrs"
        :copy-text="props.copyText"
    >
        <component :is="$options.components.InlineSvg" :src="`${$options.BASE_URL_PREFIX}/img/icon-copy.svg`"/>
    </component>
</template>
