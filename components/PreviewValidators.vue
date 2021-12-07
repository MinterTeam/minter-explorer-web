<script>
import {getValidatorList} from '@/api/explorer.js';
import {getExplorerValidatorUrl, prettyRound, shortHashFilter} from '~/assets/utils.js';
import TableLink from '~/components/TableLink.vue';

const VALIDATOR_LIST_LENGTH = 5;

export default {
    components: {
        TableLink,
    },
    fetch() {
        getValidatorList()
            .then((validatorList) => {
                this.validatorList = validatorList;
            });
    },
    data() {
        return {
            /** @type {Array<Validator>} */
            validatorList: [],
        };
    },
    computed: {
        validatorListPrepared() {
            return this.validatorList
                // keep only active validators
                .filter((validator) => validator.status === 2)
                .slice(0, VALIDATOR_LIST_LENGTH);
        },
    },
    methods: {
        prettyRound,
        shortHashFilter,
        getExplorerValidatorUrl,
    },
};
</script>

<template>
    <div class="panel preview">
        <div class="preview__header panel__section panel__header">
            <h2 class="panel__header-title panel__title">
                <img class="panel__header-title-icon" src="/img/icon-validator.svg" width="40" height="40" alt="" role="presentation">
                Validators
            </h2>
            <nuxt-link class="button button--ghost-main button--small" to="/validators">View all</nuxt-link>
        </div>
        <transition name="v-transition-fade">
            <table class="preview-table">
                <tbody>
                <tr v-for="validator in validatorListPrepared" :key="validator.publicKey">
                    <td>
                        <nuxt-link
                            class="u-icon-wrap link--default-wrap"
                            v-if="validator.name"
                            :to="getExplorerValidatorUrl(validator.publicKey)"
                        >
                            <img
                                class="preview-table__icon u-icon--coin"
                                width="40" height="40" alt="" role="presentation"
                                v-if="validator.iconUrl"
                                :src="validator.iconUrl"
                            >
                            <div>
                                <div class="link--default-inner u-text-medium">
                                    {{ validator.name }}
                                </div>
                                <div class="u-text-muted u-text-tabular-nums">{{ shortHashFilter(validator.publicKey) }}</div>
                            </div>
                        </nuxt-link>
                        <TableLink
                            v-else
                            class="u-text-tabular-nums"
                            :link-text="validator.publicKey"
                            :link-path="getExplorerValidatorUrl(validator.publicKey)"
                        />
                    </td>
                    <td>
                        <div class="u-text-muted">Stake</div>
                        <div class="u-fw-500">{{ prettyRound(validator.stake) }} {{ $store.state.COIN_NAME }}</div>
                    </td>
                    <td>
                        <div class="u-text-muted">Fee</div>
                        <div class="u-fw-500">{{ validator.commission }}&thinsp;%</div>
                    </td>
                </tr>
                </tbody>
            </table>
        </transition>
    </div>
</template>
