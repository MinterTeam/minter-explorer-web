import axios from 'axios';
import {EXPLORER_URL} from "~/assets/variables";

const instance = axios.create({
    baseURL: `${EXPLORER_URL}/api/v1/`,
});

export default instance;
