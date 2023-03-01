import web3Utils from 'web3-utils';
import web3Abi from 'web3-eth-abi';
import smartWalletBin from '~/assets/abi-smartwallet-bin.js';
import {SMART_WALLET_FACTORY_CONTRACT_ADDRESS, SMART_WALLET_FACTORY_LEGACY_BSC_CONTRACT_ADDRESS} from '~/assets/variables.js';




// index to derive wallet
const SMART_WALLET_INDEX = 0;

/**
 * @pure
 * @nosideeffects
 * @param {string} evmAccountAddress
 * @param {object} [options]
 * @param {boolean} [options.isLegacy]
 * @param {number} [options.walletIndex]
 * @return {string}
 */
// @ts-expect-error @TODO https://github.com/microsoft/TypeScript/issues/50286
export function getSmartWalletAddress(evmAccountAddress, {isLegacy, walletIndex = SMART_WALLET_INDEX} = {}) {
    if (!evmAccountAddress) {
        return '';
    }
    const factoryContractAddress = isLegacy ? SMART_WALLET_FACTORY_LEGACY_BSC_CONTRACT_ADDRESS : SMART_WALLET_FACTORY_CONTRACT_ADDRESS;
    const salt = web3Utils.keccak256(web3Abi.encodeParameters(["address", "uint256"], [evmAccountAddress, walletIndex]));
    const byteCode = smartWalletBin + web3Abi.encodeParameter('address', evmAccountAddress).slice(2);
    return buildCreate2Address(factoryContractAddress, salt, byteCode);

    /**
     * @param {string} creatorAddress
     * @param {string} saltHex
     * @param {string} byteCode
     * @return {string}
     */
    function buildCreate2Address(creatorAddress, saltHex, byteCode) {
        const parts = [
            'ff',
            creatorAddress.slice(2),
            saltHex.slice(2),
            web3Utils.keccak256(byteCode).slice(2),
        ];

        const partsHash = web3Utils.keccak256(`0x${parts.join('')}`);
        return `0x${partsHash.slice(-40)}`.toLowerCase();
    }
}

/**
 * @typedef {object} SmartWalletTxParams
 * @property {string} to
 * @property {string} data
 * @property {string} value
 */

