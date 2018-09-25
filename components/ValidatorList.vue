<script>
    import debounce from 'lodash-es/debounce';
    import TableLink from '~/components/TableLink';

    export default {
        components: {
            TableLink,
        },
        props: {
            /** @type Array<Validator>*/
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
                window.addEventListener('resize', debounce(() => {
                    this.shouldShortenAddress = this.getShouldShortenAddress();
                    this.shouldShortenPublicKey = this.getShouldShortenPublicKey();
                }), 100);
            }
        },
        methods: {
            getShouldShortenAddress() {
                return process.client && window.innerWidth < 450;
            },
            getShouldShortenPublicKey() {
                return process.client && window.innerWidth < 960;
            },
        }
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
                    <!--<th>Name</th>-->
                    <th>Address</th>
                    <th>Public Key</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="validator in validatorList" :key="validator.address">
                    <!-- Name -->
                    <!--<td>{{ validator.name }}</td>-->
                    <!-- Address -->
                    <td>
                        <TableLink :link-text="validator.address"
                                   :link-path="'/address/' + validator.address"
                                   :should-not-shorten="!shouldShortenAddress"
                        />
                    </td>
                    <!-- Public Key -->
                    <td>
                        <TableLink :link-text="validator.publicKey"
                                   :link-path="'/validator/' + validator.publicKey"
                                   :should-not-shorten="!shouldShortenPublicKey"
                        />
                    </td>
                </tr>
                </tbody>
            </table>
        </div>
    </section>
</template>
