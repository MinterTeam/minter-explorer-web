import parseISO from 'date-fns/esm/parseISO';
import format from 'date-fns/esm/format';
import formatDistanceStrict from 'date-fns/esm/formatDistanceStrict';
import prettyNum, {PRECISION_SETTING} from 'pretty-num';
import stripZeros from 'pretty-num/src/strip-zeros';
import fromExponential from 'from-exponential';
import decode from 'entity-decode';
import {txTypeList} from 'minterjs-util/src/tx-types.js';
import {getTimeOffset} from '~/assets/time-offset.js';
import {ETHERSCAN_HOST} from '~/assets/variables.js';

function timeFormat(timestamp, pattern) {
    if (typeof timestamp === 'string') {
        timestamp = parseISO(timestamp);
    }
    const time = format(timestamp, pattern);

    return time && time !== 'Invalid Date' ? time : false;
}

export function getTimeZone(timestamp) {
    const formatted = timeFormat(timestamp, 'xxx');

    return formatted && 'UTC' + formatted;
}

export function getTimeDistance(timestamp, allowFuture) {
    if (typeof timestamp === 'string') {
        timestamp = parseISO(timestamp);
    }
    const now = new Date(Date.now() + getTimeOffset());
    // if timestamp from future
    if (timestamp > now && !allowFuture) {
        timestamp = now;
    }
    const distance = formatDistanceStrict(timestamp, now, {roundingMethod: 'floor'});

    return distance && distance !== 'Invalid Date' ? distance : false;
}

export function getTime(timestamp) {
    return timeFormat(timestamp, 'yyyy-MM-dd HH:mm:ss');
}

export function getTimeMinutes(timestamp) {
    return timeFormat(timestamp, 'yyyy-MM-dd HH:mm');
}

export function getDate(timestamp) {
    return timeFormat(timestamp, 'yyyy-MM-dd');
}

export function getDateHuman(timestamp) {
    return timeFormat(timestamp, 'd MMMM yyyy');
}

export function shortFilter(value, endLength = 6, minLengthToShort) {
    const startLength = endLength + 'Mx'.length - 1;
    minLengthToShort = minLengthToShort || startLength + endLength;
    value = value.toString();
    const isLong = value.length > minLengthToShort;

    return isLong ? value.substr(0, startLength) + '…' + value.substr(-endLength) : value;
}


export function txTypeFilter(value) {
    value = txTypeList[value].name; // get type name
    value = value.charAt(0).toUpperCase() + value.slice(1); // capitalize the first letter
    if (value === 'Remove liquidity from pool') {
        return 'Remove liquidity';
    }
    if (value === 'Add liquidity to pool') {
        return 'Add liquidity';
    }
    return value;
}

export function getExplorerAddressUrl(address) {
    return '/address/' + address;
}

export function getExplorerValidatorUrl(pubKey) {
    return '/validator/' + pubKey;
}

export function getEtherscanAddressUrl(hash) {
    return ETHERSCAN_HOST + '/address/' + hash;
}

/**
 * @param {string|number} value
 * @return {string}
 */
export function pretty(value) {
    if (!value && typeof value !== 'number') {
        return '';
    }
    const PRECISION = 2;
    if (value >= 0.1 || value <= -0.1 || Number(value) === 0) {
        return decode(prettyNum(value, {precision: PRECISION, precisionSetting: PRECISION_SETTING.FIXED, thousandsSeparator: '&#x202F;'}));
    } else {
        value = decode(prettyNum(value, {precision: PRECISION, precisionSetting: PRECISION_SETTING.REDUCE_SIGNIFICANT, thousandsSeparator: '&#x202F;'}));
        value = value.substr(0, 10);
        if (value === '0.00000000') {
            return '0.00';
        }
        return value;
    }
}

export function prettyUsd(value) {
    return decode(prettyNum(value, {precision: 2, thousandsSeparator: '&#x202F;'}));
}

export function prettyRound(value) {
    return decode(prettyNum(value, {precision: 0, thousandsSeparator: '&#x202F;'}));
}

/**
 * Ensure value to have from 2 to 8 decimal digits
 * @param {string|number} value
 * @return {string}
 */
export function prettyPrecise(value) {
    const parts = stripZeros(fromExponential(value)).split('.');
    const isReduced = parts[1] && parts[1].length > 2;
    if (isReduced) {
        return decode(prettyNum(value, {precision: 8, precisionSetting: PRECISION_SETTING.REDUCE, thousandsSeparator: '&#x202F;'}));
    } else {
        // ensure at least 2 decimal digits
        return decode(prettyNum(value, {precision: 2, precisionSetting: PRECISION_SETTING.FIXED, thousandsSeparator: '&#x202F;'}));
    }
}

/**
 * Ensure value to have minimum 2 decimal digits
 * @param {string|number} value
 * @return {string}
 */
export function prettyExact(value) {
    if (!value && typeof value !== 'number') {
        return '';
    }
    return decode(prettyNum(value, {precision: 2, precisionSetting: PRECISION_SETTING.INCREASE, thousandsSeparator: '&#x202F;'}));
}


/**
 * Round to power
 * @param {number} value
 * @param {number} power
 * @return {number}
 */
export function round(value, power) {
    let tenPower = Math.pow(10, power);
    return Math.round(value * tenPower) / tenPower;
}

export function padZero(value) {
    value = value.toString();
    if (value.length === 1) {
        value = '0' + value;
    }

    return value;
}


export function fromBase64(str) {
    //@TODO utf8 https://github.com/dankogai/js-base64/issues/130
    const asci = window.atob(str);
    try {
        return decodeURIComponent(escape(asci));
    } catch (e) {
        return asci;
    }
}
