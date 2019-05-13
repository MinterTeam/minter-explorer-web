import axios from 'axios';
import {EXPLORER_API_URL, NETWORK_EXPLORER_CHANNEL} from "~/assets/variables";

const instance = axios.create({
    baseURL: EXPLORER_API_URL,
    headers: NETWORK_EXPLORER_CHANNEL ? {
        'X-Minter-Chain-Id': NETWORK_EXPLORER_CHANNEL,
    } : {},
});

export default instance;
