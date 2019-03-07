<script>
    import debounce from 'lodash-es/debounce';
    import {SimpleSVG} from 'vue-simple-svg';
    import TableLink from '~/components/TableLink';

    let resizeHandler;

    export default {
        components: {
            TableLink,
            SimpleSvg: SimpleSVG,
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
                shouldShortenAddress: this.getShouldShortenAddress(),
                shouldShortenPublicKey: this.getShouldShortenPublicKey(),
            };
        },
        mounted() {
            if (process.client) {
                resizeHandler = debounce(() => {
                    this.shouldShortenAddress = this.getShouldShortenAddress();
                    this.shouldShortenPublicKey = this.getShouldShortenPublicKey();
                });
                window.addEventListener('resize', resizeHandler, 100);
            }
        },
        destroyed() {
            if (resizeHandler) {
                window.removeEventListener('resize', resizeHandler);
            }
        },
        methods: {
            getShouldShortenAddress() {
                return process.client && window.innerWidth < 450;
            },
            getShouldShortenPublicKey() {
                return process.client && window.innerWidth < 960;
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
                    <th>Public Key</th>
                    <th>Block Sign</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="validator in validatorList" :key="validator.publicKey">
                    <td>
                        <TableLink :link-text="validator.publicKey"
                                   :link-path="'/validator/' + validator.publicKey"
                                   :should-not-shorten="!shouldShortenPublicKey"
                        />
                    </td>
                    <td>
                        <SimpleSvg role="img"
                            filepath="/img/icon-sign.svg"
                            :aria-label="validator.signed ? 'Signed' : 'Not signed'"
                            width="26px"
                            height="26px"
                            :fill="validator.signed ? '#6ECA2C' : ''"
                        />
                    </td>
                </tr>
                </tbody>
            </table>
        </div>
    </section>
</template>
