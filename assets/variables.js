export const COIN_NAME = process.env.APP_ENV === 'production' ? 'BIP' : 'MNT';
export const MAINNET_HOST = 'https://explorer.minter.network';
export const TESTNET_HOST = 'https://explorer.beta.minter.network';
export const CURRENT_HOST = process.env.APP_ENV === 'production' ? MAINNET_HOST : TESTNET_HOST;
