import axios from 'axios';
import {EXPLORER_API_URL} from "~/assets/variables";
import toCamel from '~/assets/to-camel.js';

const instance = axios.create({
    baseURL: EXPLORER_API_URL,
});

// Add a response interceptor
instance.interceptors.response.use(function(response) {
    response.data = toCamel(response.data);
    return response;
}, function(error) {
    error.data = toCamel(error.data);
    return Promise.reject(error);
});

export default instance;
