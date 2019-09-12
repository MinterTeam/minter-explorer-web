<script>
    import debounce from 'lodash-es/debounce';
    import InlineSvg from 'vue-inline-svg';
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
                });
                window.addEventListener('resize', resizeHandler);
            }
        },
        destroyed() {
            if (resizeHandler) {
                window.removeEventListener('resize', resizeHandler);
            }
        },
        methods: {
            getIsCollapsed() {
                return process.client && window.innerWidth < 960;
            },
            getName(validator) {
                return validator.validator_meta && validator.validator_meta.name;
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
                    <th>{{ isCollapsed ? 'Validator' : 'Public Key' }}</th>
                    <th>Block Sign</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="validator in validatorList" :key="validator.publicKey">
                    <td v-show="!isCollapsed">
                        <span v-if="getName(validator)">{{ getName(validator) }}</span>
                    </td>
                    <td>
                        <TableLink class="u-text-tabular-nums"
                                   :link-text="isCollapsed && getName(validator) ? getName(validator) : validator.publicKey"
                                   :link-path="'/validator/' + validator.publicKey"
                                   :should-not-shorten="!isCollapsed || getName(validator)"
                        />
                    </td>
                    <td>
                        <InlineSvg class="u-vertical-top" role="img"
                            src="/img/icon-sign.svg"
                            :aria-label="validator.signed ? 'Signed' : 'Not signed'"
                            width="26px"
                            height="26px"
                            :fill="validator.signed ? '#6ECA2C' : false"
                        />
                    </td>
                </tr>
                </tbody>
            </table>
        </div>
    </section>
</template>
