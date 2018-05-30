export const BASE_TITLE = 'Minter Explorer';
export const COIN_NAME = process.env.APP_ENV === 'production' ? 'BIP' : 'MNT';
export const MAINNET_URL = 'https://explorer.minter.network';
export const TESTNET_URL = 'https://testnet.explorer.minter.network';
export const CURRENT_URL = process.env.APP_ENV === 'production' ? MAINNET_URL : TESTNET_URL;
