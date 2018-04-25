<script>
    import BackButton from '~/components/BackButton';

    export default {
        components: {
            BackButton,
        }
    }
</script>

<template>
    <div>
        <section class="panel u-section">
            <div class="panel__section panel__header">
                <h1 class="panel__title panel__header-title">
                    <BackButton/>
                    Blocks (#5372481 to #5372457) out&nbsp;of&nbsp;5372482 total blocks
                </h1>
                <div class="pagination pagination--header u-hidden-medium-down">
                    <button class="button button--white button--icon"> &lt;&lt; </button>
                    <button class="button button--white button--icon"> &lt; </button>
                    <div class="pagination__current">Page 1 of 214900</div>
                    <button class="button button--white button--icon"> > </button>
                    <button class="button button--white button--icon"> >> </button>
                </div>
            </div>
            <div class="table-wrap">
                <table class="u-text-nowrap">
                    <thead>
                    <tr>
                        <th>Height</th>
                        <th>Age</th>
                        <th>Validator</th>
                        <th>Tx</th>
                        <th>Reward</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="n in 10" :key="n">
                        <td><nuxt-link class="link--default" :to="'/blocks/' + n">{{ 5493390 + n }}</nuxt-link></td>
                        <td>35 secs ago</td>
                        <td><div class="table-overflow--large">MxcC16E3c00DBbe76603fa833Ec20A48f786dfE610</div></td>
                        <td><nuxt-link class="link--default" :to="'/blocks/' + n">114</nuxt-link></td>
                        <td>20 BIP</td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </section>
        <div class="pagination pagination--bottom u-section">
            <button class="button button--ghost-main button--icon"> &lt;&lt; </button>
            <button class="button button--ghost-main button--icon"> &lt; </button>
            <div class="pagination__current">Page 1 of 214900</div>
            <button class="button button--ghost-main button--icon"> > </button>
            <button class="button button--ghost-main button--icon"> >> </button>
        </div>
    </div>
</template>
