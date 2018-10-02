export const BASE_TITLE_NETWORK = process.env.APP_ENV === 'production' ? '' : 'Testnet ';
export const BASE_TITLE_END = ' — Minter';
export const BASE_TITLE = BASE_TITLE_NETWORK + 'Explorer' + BASE_TITLE_END;
export const BASE_DESCRIPTION = '';
export const NETWORK = process.env.APP_ENV === 'production' ? 'mainnet' : 'testnet';
export const COIN_NAME = process.env.APP_ENV === 'production' ? 'BIP' : 'MNT';
export const MAINNET_WEB_URL = 'https://explorer.minter.network';
export const TESTNET_WEB_URL = 'https://testnet.explorer.minter.network';
export const EXPLORER_URL = process.env.APP_EXPLORER_URL || 'https://explorer.minter.network';
export const EXPLORER_RTM_URL = process.env.APP_EXPLORER_RTM_URL || 'https://rtm.explorer.minter.network';
export const TX_TYPES = {
    SEND: 'send',
    SELL_COIN: 'sellCoin',
    SELL_ALL_COIN: 'sellAllCoin',
    BUY_COIN: 'buyCoin',
    CREATE_COIN: 'createCoin',
    DECLARE_CANDIDACY: 'declareCandidacy',
    DELEGATE: 'delegate',
    UNBOND: 'unbond',
    REDEEM_CHECK: 'redeemCheckData',
    SET_CANDIDATE_ONLINE: 'setCandidateOnData',
    SET_CANDIDATE_OFFLINE: 'setCandidateOffData',
};
export const REWARD_CHART_TYPES = {
    MONTH: 'month',
    WEEK: 'week',
    DAY: 'day',
};
