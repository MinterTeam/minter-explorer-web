<script>
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
            };
        },
    };
</script>

<template>
    <section class="panel u-section">
        <div class="panel__section panel__header">
            <h1 class="panel__title panel__header-title">
                <img class="panel__header-title-icon" src="/img/icon-validator.svg" alt="" role="presentation">
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
                                   :should-not-shorten="true"
                        />
                    </td>
                    <!-- Public Key -->
                    <td>{{ validator.publicKey }}</td>
                </tr>
                </tbody>
            </table>
        </div>
    </section>
</template>
