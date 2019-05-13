export const MAINNET = 'mainnet';
export const TESTNET = 'testnet';
export const NETWORK = process.env.APP_ENV === MAINNET ? MAINNET : TESTNET;
export const BASE_TITLE_NETWORK = NETWORK === MAINNET ? '' : 'Testnet ';
export const BASE_TITLE_END = ' — Minter';
export const BASE_TITLE = BASE_TITLE_NETWORK + 'Explorer' + BASE_TITLE_END;
export const BASE_DESCRIPTION = '';
export const NETWORK_EXPLORER_CHANNEL = NETWORK === MAINNET ? 'mainnet' : '';
export const COIN_NAME = NETWORK === MAINNET ? 'BIP' : 'MNT';
export const UNBOND_PERIOD = NETWORK === MAINNET ? 518400 : 720;
export const MAINNET_WEB_URL = 'https://explorer.minter.network';
export const TESTNET_WEB_URL = 'https://testnet.explorer.minter.network';
export const EXPLORER_API_URL = process.env.APP_EXPLORER_API_URL;
export const EXPLORER_RTM_URL = process.env.APP_EXPLORER_RTM_URL;
export const REWARD_CHART_TYPES = {
    MONTH: 'month',
    WEEK: 'week',
    DAY: 'day',
};
