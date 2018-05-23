import axios from 'axios'

const HOST = process.env.APP_ENV === 'production' ? 'explorer.minter.network' : 'explorer.beta.minter.network';

const instance = axios.create({
    baseURL: `https://${HOST}/api/v1/`,
});

export default instance;
