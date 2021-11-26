<script>
    import {getValidatorList} from '~/api/explorer.js';
    import {pretty, getExplorerValidatorUrl} from '~/assets/utils.js';
    import {VALIDATOR_STATUS} from '~/assets/variables.js';
    import getTitle from '~/assets/get-title.js';
    import BackButton from '~/components/BackButton.vue';
    import TableLink from '~/components/TableLink.vue';

    export default {
        VALIDATOR_STATUS,
        components: {
            BackButton,
            TableLink,
        },
        // watchQuery: ['page'],
        // key: (to) => to.fullPath,
        asyncData() {
            return getValidatorList()
                .then((validatorList) => {
                    return {
                        validatorList: validatorList,
                    };
                });
        },
        head() {
            const title = getTitle('Validators');

            return {
                title: title,
                meta: [
                    { hid: 'og-title', name: 'og:title', content: title },
                ],
            };
        },
        data() {
            return {
                /** @type Array<Validator> */
                validatorList: [],
            };
        },
        computed: {
        },
        methods: {
            pretty,
            getExplorerValidatorUrl,
        },
    };
</script>

<template>
    <div>
        <section class="panel u-section">
            <div class="panel__section panel__header">
                <h1 class="panel__title panel__header-title">
                    <BackButton/>
                    <span>
                        Validators
                    </span>
                </h1>
            </div>
            <div class="table-wrap">
                <table class="u-text-nowrap">
                    <thead>
                    <tr>
                        <th>Validator</th>
                        <th>Status</th>
                        <th>Total stake</th>
                        <th>Commission</th>
                        <th>#Delegators</th>
                        <th>Minimal stake</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="validator in validatorList" :key="validator.publicKey">
                        <td>
                            <nuxt-link class="link--default u-icon-wrap" v-if="validator.name" :to="getExplorerValidatorUrl(validator.publicKey)">
                                <img v-if="validator.iconUrl" :src="validator.iconUrl" class="u-icon--coin" width="24" height="24" alt="" role="presentation">
                                {{ validator.name }}
                            </nuxt-link>
                            <TableLink
                                v-else
                                class="u-text-tabular-nums"
                                :link-text="validator.publicKey"
                                :link-path="getExplorerValidatorUrl(validator.publicKey)"
                            />
                        </td>
                        <td :class="validator.status === 2 ? 'tx__success u-fw-500' : ''">{{ $options.VALIDATOR_STATUS[validator.status || 0] }}</td>
                        <td>
                            {{ pretty(validator.stake) }} {{ $store.state.COIN_NAME }}
                            <span class="u-text-muted" v-if="validator.part > 0">({{ pretty(validator.part || 0) }}&thinsp;%)</span>
                        </td>
                        <td>{{ validator.commission }}&thinsp;%</td>
                        <td>{{ validator.delegatorCount }}</td>
                        <td>
                            <template v-if="validator.minStake > 0">
                                {{ pretty(validator.minStake) }} {{ $store.state.COIN_NAME }}
                            </template>
                            <template v-else>—</template>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </section>
    </div>
</template>
