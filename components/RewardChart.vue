<script>
    import Vue from 'vue';
    import Chart from 'chart.js/dist/Chart.min.js';
    import {getRewardChartData} from '~/api';
    import {pretty} from '~/assets/utils';
    import {REWARD_CHART_TYPES} from '~/assets/variables';
    
    let chartInstance;

    export default {
        REWARD_CHART_TYPES,
        data() {
            return {
                rewardData: {},
                rewardRequest: {},
                chartType: REWARD_CHART_TYPES.MONTH,
                rewardLoading: {},
            };
        },
        computed: {
            dataset() {
                return this.rewardData[this.chartType];
            },
            isLoading() {
                return this.rewardLoading[this.chartType];
            },
            hasData() {
                return this.dataset && this.dataset.data && this.dataset.data.length > 1 && this.dataset.labels && this.dataset.labels.length > 1;
            },
            chartConfig() {
                return {
                    type: 'line',
                    data: {
                        labels: this.dataset.labels,
                        datasets: [{
                            data: this.dataset.data,
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
                                        if (this.chartType === REWARD_CHART_TYPES.MONTH || this.chartType === REWARD_CHART_TYPES.WEEK) {
                                            return date.getUTCDate() + '/' + (date.getUTCMonth() + 1);
                                        } else {
                                            return date.getHours();
                                        }

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
                                label: function(tooltipItem, data) {
                                    // let label = data.labels[tooltipItem.index];
                                    let value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
                                    return pretty(value); // &thinsp;
                                },
                            },
                        },
                    },
                };
            },
        },
        watch: {
            dataset: {
                handler(newVal) {
                    if (!newVal || !newVal.data || !(newVal.data.length > 1)) {
                        return;
                    }
                    this.initChart();
                },
                // deep: true,
            },
        },
        beforeMount() {
            this.ensureDataset(this.chartType)
                .then(() => {
                    // this.initChart();
                });
        },
        destroyed() {
            chartInstance = null;
        },
        methods: {
            initChart() {
                if (chartInstance) {
                    chartInstance.data = this.chartConfig.data;
                    chartInstance.options = this.chartConfig.options;
                    chartInstance.update();
                } else {
                    let ctx = this.$el.querySelector('[data-reward-chart]').getContext('2d');
                    chartInstance = new Chart(ctx, this.chartConfig);
                }
            },
            switchChart(type) {
                this.chartType = type;
                this.ensureDataset(type)
                    .then(() => {
                        // this.initChart();
                    });
            },
            ensureDataset(type) {
                if (this.rewardRequest[type]) {
                    return this.rewardRequest[type];
                } else {
                    Vue.set(this.rewardLoading, type, true);
                    const rewardPromise = getRewardChartData(this.$route.params.address, type)
                        .then((dataset) => {
                            Vue.set(this.rewardData, type, dataset);
                            // this.rewardData[type] = dataset;
                            this.rewardLoading[type] = false;
                            return dataset;
                        });
                    Vue.set(this.rewardRequest, type, rewardPromise);
                    return rewardPromise;
                }
            },
        },
    };
</script>

<template>
    <section class="panel u-section">
        <div class="panel__switcher-section panel__section">
            <div class="panel__section panel__header">
                <h1 class="panel__title panel__header-title">Total rewards by</h1>
            </div>
            <div class="panel__switcher">
                <button class="panel__switcher-item panel__switcher-item--auto panel__title panel__header-title u-semantic-button"
                        :class="{'is-active': chartType === $options.REWARD_CHART_TYPES.DAY}"
                        @click="switchChart($options.REWARD_CHART_TYPES.DAY)"
                >
                    Day
                </button>
                <button class="panel__switcher-item panel__switcher-item--auto panel__title panel__header-title u-semantic-button"
                        :class="{'is-active': chartType === $options.REWARD_CHART_TYPES.WEEK}"
                        @click="switchChart($options.REWARD_CHART_TYPES.WEEK)"
                >
                    Week
                </button>
                <button class="panel__switcher-item panel__switcher-item--auto panel__title panel__header-title u-semantic-button"
                        :class="{'is-active': chartType === $options.REWARD_CHART_TYPES.MONTH}"
                        @click="switchChart($options.REWARD_CHART_TYPES.MONTH)"
                >
                    Month
                </button>
            </div>
        </div>
        <div class="panel__section" v-show="hasData">
            <div class="reward__chart-wrap">
                <canvas class="reward__chart" data-reward-chart></canvas>
            </div>
        </div>
        <div class="panel__content panel__section u-text-center" v-if="!hasData && isLoading">
            <svg class="loader" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28">
                <circle class="loader__path" cx="14" cy="14" r="12"></circle>
            </svg>
        </div>
        <div class="panel__content panel__section u-text-center" v-else-if="!hasData && !isLoading">No Rewards</div>
    </section>
</template>
