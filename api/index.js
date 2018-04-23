import axios from 'axios';

export function getPriceHistory() {
    return axios.get('https://min-api.cryptocompare.com/data/histoday?fsym=ETH&tsym=USD&limit=14')
        .then((response) => {
            if (response.data.Response !== 'Success') {
                throw new Error('Error in response: ' + response.data.Message);
            }

            // format data for line chart.js
            return response.data.Data.reduce((accum, item) => {
                accum.data.push(item.close); // close price in usd
                accum.labels.push(item.time * 1000); // timestamp in milliseconds
                return accum;
            }, {data: [], labels: []});
        })
}

export function getTxHistory() {
    return axios.get('https://www.etherchain.org/charts/transactionsPerDay/data')
        .then((response) => {
            if (!response.data[0] || !response.data[1]) {
                throw new Error('Not valid response from api');
            }

            let lastData = response.data.length > 14 ? response.data.slice(response.data.length - 14 - 1) : response.data;

            // format data for line chart.js
            return lastData.reduce((accum, item) => {
                accum.data.push(Math.round(item.value / 1000)); // tx count in thousands
                accum.labels.push(item.time * 1000); // timestamp in milliseconds
                return accum;
            }, {data: [], labels: []});
        })
}


