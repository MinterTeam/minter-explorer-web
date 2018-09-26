<script>
    import Chart from 'chart.js/dist/Chart.min.js';
    import {getTxChartData} from "~/api";

    export default {
        data() {
            return {
                dataset: null,
            };
        },
        computed: {
            hasData() {
                return this.dataset && this.dataset.data && this.dataset.data.length > 1 && this.dataset.labels && this.dataset.labels.length > 1;
            },
        },
        mounted() {
            getTxChartData()
                .then((dataset) => {
                    this.dataset = dataset;

                    if (!dataset) {
                        return;
                    }
                    let ctx = this.$el.querySelector('[data-history-chart]').getContext('2d');
                    let myChart = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: dataset.labels,
                            datasets: [{
                                data: dataset.data,
                                borderColor: '#d15c22',
                                borderWidth: 2,
                                fill: false,
                                lineTension: 0,
                            }],
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                xAxes: [{
                                    display: true,
                                    ticks: {
                                        maxRotation: 0,
                                        autoSkipPadding: 4,
                                        callback: (value, index, values) => {
                                            let date = new Date(value);
                                            return date.getUTCDate() + '/' + (date.getUTCMonth() + 1);
                                        },
                                    },
                                }],
                                yAxes: [{
                                    ticks: {
                                        // callback: (value, index, values) => value + 'k',
                                        min: 0,
                                    },
                                }],
                            },
                            legend: {
                                display: false,
                            },
                            elements: {
                                point: {
                                    radius: 0,
                                    hitRadius: 10,
                                },
                            },
                            tooltips: {
                                displayColors: false,
                                bodyFontStyle: 'bold',
                                callbacks: {
                                    title: () => '',
                                },
                            },
                        },
                    });
                })
                .catch((e) => {
                    console.log('api error', 'txCountChartData', e);
                });
        },
    };
</script>

<template>
    <transition name="v-transition-fade">
        <div class="history panel panel__section" v-show="hasData">
            <div class="history__title panel__title">14 day <!--{{ $store.state.COIN_NAME }}--> Transaction History</div>
            <div class="history__chart-wrap">
                <canvas class="history__chart" data-history-chart></canvas>
            </div>
        </div>
    </transition>
</template>
