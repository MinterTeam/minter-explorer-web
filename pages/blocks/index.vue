<template>
    <main class="u-container">
        <section class="panel u-section">
            <div class="panel__section panel__header">
                <h1 class="panel__title panel__header-title">
                    <img class="panel__header-title-icon" src="/img/icon-back.svg" alt="Back">
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
                <table>
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
                        <td><a class="link--main link--hover u-fw-700" href="#">{{ 5493390 + n }}</a></td>
                        <td class="u-text-nowrap">35 secs ago</td>
                        <td><div class="table-overflow table-overflow--large u-text-overflow">MxcC16E3c00DBbe76603fa833Ec20A48f786dfE610</div></td>
                        <td><a class="link--main link--hover u-fw-700" href="#">114</a></td>
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
    </main>
</template>
