<script>
    export default {
        props: {
            transactionList: {
                //@TODO пока что принием number, потом будет array
                type: Number|Array,
                required: true,
            },
        },
    }
</script>

<template>
    <div class="table-wrap">
        <table class="u-text-nowrap">
            <thead>
            <tr>
                <th>TxHash</th>
                <th>Block</th>
                <th>Age</th>
                <th>From</th>
                <th>To</th>
                <th>Value</th>
                <th>TxFee</th>
            </tr>
            </thead>
            <tbody>
            <!--@TODO скрыть ссылки на текущий блок и на текущий адрес-->
            <tr v-for="n in transactionList" :key="n">
                <td><nuxt-link class="link--default table-overflow" :to="'/transactions/1' + n">0xb5ac9dd2e6e304bbe7fa1140fc45c9ca7265868c0bffd7fdc8f3828e21109422</nuxt-link></td>
                <td><nuxt-link class="link--default table-overflow" :to="'/blocks/' + n">{{ 5493393 + n }}</nuxt-link></td>
                <td>3 d 22 h</td>
                <td><nuxt-link class="link--default table-overflow" :to="'/address/1'">0x2edf1db11cf04961abf508aed5d36b3d8c0df0ff</nuxt-link></td>
                <td><nuxt-link class="link--default table-overflow" :to="'/address/2'">0x2edf1db11cf04961abf508aed5d36b3d8c0df0ff</nuxt-link></td>
                <td>0.14424 BIP</td>
                <td class="u-text-muted">0.0002 BIP</td>
            </tr>
            </tbody>
        </table>
    </div>
</template>
