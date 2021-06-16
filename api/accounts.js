import {ACCOUNTS_API_URL} from "~/assets/variables.js";



export function getCoinIconUrl(coinSymbol) {
    return `${ACCOUNTS_API_URL}avatar/by/coin/${coinSymbol}`;
}
