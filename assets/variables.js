export const BASE_TITLE = 'Minter Explorer';
export const NETWORK = process.env.APP_ENV === 'production' ? 'mainnet' : 'testnet';
export const COIN_NAME = process.env.APP_ENV === 'production' ? 'BIP' : 'MNT';
export const MAINNET_URL = 'https://explorer.minter.network';
export const TESTNET_URL = 'https://testnet.explorer.minter.network';
export const CURRENT_URL = process.env.APP_ENV === 'production' ? MAINNET_URL : TESTNET_URL;
export const TX_TYPES = {
    SEND: 'send',
    SELL_COIN: 'sellCoin',
    BUY_COIN: 'buyCoin',
    CREATE_COIN: 'createCoin',
    DECLARE_CANDIDACY: 'declareCandidacy',
    DELEGATE: 'delegate',
    UNBOUND: 'unbond',
    REDEEM_CHECK: 'redeemCheckData',
    SET_CANDIDATE_ONLINE: 'setCandidateOnData',
    SET_CANDIDATE_OFFLINE: 'setCandidateOffData',
};
