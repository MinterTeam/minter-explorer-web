<script>
    import {getStatus,} from "~/api";
    import Stats from '~/components/Stats';
    import HistoryChart from '~/components/HistoryChart';
    import PreviewBlocks from '~/components/PreviewBlocks';
    import PreviewTransactions from '~/components/PreviewTransactions';

    export default {
        components: {
            Stats,
            HistoryChart,
            PreviewBlocks,
            PreviewTransactions,
        },

    }
</script>

<template>
    <div class="u-grid u-grid--vertical-margin">
        <section class="u-cell u-cell--medium--1-2">
            <Stats :stats="stats"/>
        </section>
        <section class="u-cell u-cell--medium--1-2 history-cell">
            <HistoryChart/>
        </section>
        <section class="u-cell u-cell--medium--1-2">
            <PreviewBlocks/>
        </section>
        <section class="u-cell u-cell--medium--1-2">
            <PreviewTransactions/>
        </section>
    </div>
</template>
