<script>
    import debounce from 'lodash-es/debounce';
    import InlineSvg from 'vue-inline-svg';
    import {getExplorerValidatorUrl} from '~/assets/utils.js';
    import TableLink from '~/components/TableLink';

    let resizeHandler;

    export default {
        components: {
            TableLink,
            InlineSvg,
        },
        props: {
            /** @type Array<ValidatorListItem>*/
            validatorList: {
                type: Array,
                required: true,
            },
        },
        data() {
            return {
                isCollapsed: this.getIsCollapsed(),
            };
        },
        mounted() {
            if (process.client) {
                resizeHandler = debounce(() => {
                    this.isCollapsed = this.getIsCollapsed();
                }, 100);
                window.addEventListener('resize', resizeHandler);
            }
        },
        destroyed() {
            if (resizeHandler) {
                window.removeEventListener('resize', resizeHandler);
            }
        },
        methods: {
            getExplorerValidatorUrl,
            getIsCollapsed() {
                return process.client && window.innerWidth < 960;
            },
            getName(validatorListItem) {
                return validatorListItem.validator.name;
            },
        },
    };
</script>

<template>
    <section class="panel u-section">
        <div class="panel__section panel__header">
            <h1 class="panel__title panel__header-title">
                <img class="panel__header-title-icon" src="/img/icon-validator.svg" width="40" height="40" alt="" role="presentation">
                Validators
            </h1>
        </div>
        <div class="table-wrap">
            <table class="u-text-nowrap">
                <thead>
                <tr>
                    <th v-show="!isCollapsed">Name</th>
                    <th>{{ isCollapsed ? 'Validator' : 'Public key' }}</th>
                    <th>Block sign</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="item in validatorList" :key="item.validator.publicKey">
                    <td v-show="!isCollapsed">
                        <div v-if="item.validator.name" class="u-icon-wrap">
                            <img v-if="item.validator.iconUrl" :src="item.validator.iconUrl" class="u-icon--coin" width="24" height="24" alt="" role="presentation">
                            {{ item.validator.name }}
                        </div>
                    </td>
                    <td>
                        <nuxt-link class="link--default u-icon-wrap" v-if="isCollapsed && item.validator.name" :to="getExplorerValidatorUrl(item.validator.publicKey)">
                            <img v-if="item.validator.iconUrl" :src="item.validator.iconUrl" class="u-icon--coin" width="24" height="24" alt="" role="presentation">
                            {{ item.validator.name }}
                        </nuxt-link>
                        <TableLink class="u-text-tabular-nums"
                                   v-else
                                   :link-text="item.validator.publicKey"
                                   :link-path="getExplorerValidatorUrl(item.validator.publicKey)"
                                   :should-not-shorten="!isCollapsed"
                        />
                    </td>
                    <td>
                        <InlineSvg class="u-vertical-top" role="img"
                            src="/img/icon-sign.svg"
                            :aria-label="item.signed ? 'Signed' : 'Not signed'"
                            width="26px"
                            height="26px"
                            :fill="item.signed ? '#6ECA2C' : false"
                        />
                    </td>
                </tr>
                </tbody>
            </table>
        </div>
    </section>
</template>
