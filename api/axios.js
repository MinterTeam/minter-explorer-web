import axios from 'axios'

const instance = axios.create({
    baseURL: 'https://explorer.beta.minter.network/api/v1/',
});

export default instance;
