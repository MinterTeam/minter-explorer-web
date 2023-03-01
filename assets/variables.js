export const MAINNET = 'mainnet';
export const TESTNET = 'testnet';
export const NETWORK = process.env.APP_ENV === MAINNET ? MAINNET : TESTNET;
export const PURPOSE = process.env.APP_PURPOSE;
export const BASE_TITLE_NETWORK = NETWORK === MAINNET ? '' : 'Testnet ';
export const BASE_TITLE_END = ' — Minter';
export const BASE_TITLE = BASE_TITLE_NETWORK + 'Explorer' + BASE_TITLE_END;
export const BASE_DESCRIPTION = '';
export const BASE_COIN = NETWORK === MAINNET ? 'BIP' : 'MNT';
export const BASE_URL_PREFIX = '';
/**
 * @deprecated
 * @type {string}
 */
export const COIN_NAME = BASE_COIN;
export const CHAIN_ID = NETWORK === MAINNET ? 1 : 2;
// @see https://github.com/MinterTeam/minter-go-node/blob/aa9eef308ae192cd5d899d4f0c5b6be3d1b04695/coreV2/types/constants.go#L21
export const UNBOND_PERIOD = NETWORK === MAINNET ? 518400 : 2920;
// @see https://github.com/MinterTeam/minter-go-node/blob/aa9eef308ae192cd5d899d4f0c5b6be3d1b04695/coreV2/types/constants.go#L32
export const JAIL_PERIOD = NETWORK === MAINNET ? 8640 * 2 : 2920 * 2;
/* 3 year mainnet, 2 days testnet */
export const LOCK_STAKE_PERIOD = NETWORK === MAINNET ? 18921600 : 17280 * 2;
export const MAINNET_WEB_URL = 'https://explorer.minter.network';
export const HISTORY_WEB_URL = 'https://v1-history.explorer.minter.network';
export const EXPLORER_API_URL = process.env.APP_EXPLORER_API_URL;
export const EXPLORER_RTM_URL = process.env.APP_EXPLORER_RTM_URL;
export const EXPLORER_STATIC_HOST = process.env.APP_EXPLORER_STATIC_HOST;
export const GATE_API_URL = process.env.APP_GATE_API_URL;
export const ACCOUNTS_API_URL = process.env.APP_ACCOUNTS_API_URL;
export const CHAINIK_API_URL = 'https://chainik.io/json/';
export const HUB_MINTER_MULTISIG_ADDRESS = process.env.APP_HUB_MINTER_MULTISIG_ADDRESS;
export const SMART_WALLET_RELAY_MINTER_ADDRESS = "Mxc9b1b39f4c94b1bcbf68c1beba97ab84f7763cf0";
export const SMART_WALLET_FACTORY_CONTRACT_ADDRESS = "0x324718b3cE9906fcf5cE140342146Eb16970d889";
export const SMART_WALLET_FACTORY_LEGACY_BSC_CONTRACT_ADDRESS = "0x7F3C8d5363B44875001Fa2A63A7dB6FCb8BEE989";
export const SMART_WALLET_RELAY_BROADCASTER_ADDRESS = '0x64e51D5930CDBbf99f3cB27654A03b18f7060C5E';
export const SMART_WALLET_RELAY_API_URL = process.env.APP_HUB_API_URL + 'smart-wallet-relay/';
export const HUB_API_URL = process.env.APP_HUB_API_URL;
export const FARM_API_URL = process.env.APP_FARM_API_URL;
export const ETHEREUM_CHAIN_ID = NETWORK === MAINNET ? 1 : 3;
export const BSC_CHAIN_ID = NETWORK === MAINNET ? 56 : 97;
export const ETHERSCAN_HOST = NETWORK === MAINNET ? 'https://etherscan.io' : 'https://ropsten.etherscan.io';
export const BSCSCAN_HOST = NETWORK === MAINNET ? 'https://bscscan.com' : 'https://testnet.bscscan.com';
export const WETH_CONTRACT_ADDRESS = NETWORK === MAINNET ? '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' : '0x0a180a76e4466bf68a7f86fb029bed3cccfaaac5';// '0xc778417e063141139fce010982780140aa0cd5ab';
export const WBNB_CONTRACT_ADDRESS = NETWORK === MAINNET ? '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' : '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd';


export const HISTORY_V1_BLOCK_COUNT = 5000000;
export const HISTORY_V1_1_BLOCK_COUNT = 4150000;
export const HISTORY_BLOCK_COUNT = NETWORK === MAINNET ? HISTORY_V1_BLOCK_COUNT + HISTORY_V1_1_BLOCK_COUNT : 0;
// export const HISTORY_V1_1_TRANSACTION_COUNT = 5405605;
// export const HISTORY_V1_2_TRANSACTION_COUNT = 12784024;
export const HISTORY_TRANSACTION_COUNT = NETWORK === MAINNET ? 12784024 : 0;

/**
 * @readonly
 * @enum {string}
 */
export const REWARD_CHART_TYPES = {
    MONTH: 'month',
    WEEK: 'week',
    DAY: 'day',
};
/**
 * @readonly
 * @enum {string}
 */
export const TAB_TYPES = {
    TX: 'tx',
    FAILED_TX: 'failed_tx',
    STAKE: 'stake',
    REWARD: 'reward',
    REWARD_CHART: 'reward_chart',
    SLASH: 'penalty',
    STAKE_LOCK: 'stake_lock',
    PROVIDER: 'provider',
    ORDER: 'order',
};
/**
 * @readonly
 * @enum {string}
 */
export const TX_STATUS = {
    SUCCESS: 'success',
    FAILURE: 'failure',
};

/**
 * @readonly
 * @enum
 */
export const VALIDATOR_STATUS = {
    0: 'Not declared',
    1: 'Set off',
    2: 'Set on',
};

/**
 * @readonly
 * @enum {string}
 */
export const HUB_NETWORK_SLUG = {
    ETHEREUM: 'ethereum',
    BSC: 'bsc',
    MINTER: 'minter',
};

/**
 * @deprecated
 * @type {typeof HUB_NETWORK_SLUG}
 */
export const HUB_CHAIN_ID = HUB_NETWORK_SLUG;

/**
 * @typedef {object} HubChainDataItem
 * @property {string} coinSymbol
 * @property {string} name
 * @property {string} shortName
 * @property {ChainId} chainId
 * @property {HUB_NETWORK_SLUG} hubNetworkSlug
 * @property {HUB_CHAIN_ID} hubChainId
 * @property {string} apiUrl
 * @property {string} explorerHost
 * @property {string} hubContractAddress
 * @property {string} wrappedNativeContractAddress
 */

/**
 * @readonly
 * @type {Record<HUB_NETWORK_SLUG, HubChainDataItem>}
 */
export const HUB_CHAIN_DATA = {
    [HUB_NETWORK_SLUG.ETHEREUM]: {
        name: 'Ethereum',
        shortName: 'Ethereum',
        coinSymbol: 'ETH',
        chainId: ETHEREUM_CHAIN_ID,
        hubNetworkSlug: HUB_NETWORK_SLUG.ETHEREUM,
        hubChainId: HUB_CHAIN_ID.ETHEREUM,
        // apiUrl: ETHEREUM_API_URL,
        explorerHost: ETHERSCAN_HOST,
        // hubContractAddress: HUB_ETHEREUM_CONTRACT_ADDRESS.toLowerCase(),
        wrappedNativeContractAddress: WETH_CONTRACT_ADDRESS.toLowerCase(),
    },
    [HUB_NETWORK_SLUG.BSC]: {
        name: 'BNB Chain',
        shortName: 'BSC',
        coinSymbol: 'BNB',
        chainId: BSC_CHAIN_ID,
        hubNetworkSlug: HUB_NETWORK_SLUG.BSC,
        hubChainId: HUB_CHAIN_ID.BSC,
        // apiUrl: BSC_API_URL,
        explorerHost: BSCSCAN_HOST,
        // hubContractAddress: HUB_BSC_CONTRACT_ADDRESS.toLowerCase(),
        wrappedNativeContractAddress: WBNB_CONTRACT_ADDRESS.toLowerCase(),
    },
};

/**
 * @readonly
 * @type {Record<ChainId, HubChainDataItem>}
 */
export const HUB_CHAIN_BY_ID = Object.fromEntries(Object.values(HUB_CHAIN_DATA).map((item) => [item.chainId, item]));

/**
 * @readonly
 * @enum {string}
 */
export const HUB_TRANSFER_STATUS = {
    not_found_long: 'not_found_long', // custom status
    not_found: 'TX_STATUS_NOT_FOUND',
    deposit_to_hub_received: "TX_STATUS_DEPOSIT_RECEIVED",
    batch_created: "TX_STATUS_BATCH_CREATED",
    batch_executed: "TX_STATUS_BATCH_EXECUTED",
    refund: "TX_STATUS_REFUNDED",
};

/**
 * @typedef {number} ChainId
 */
