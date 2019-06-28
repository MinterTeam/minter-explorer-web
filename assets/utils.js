import parseISO from 'date-fns/esm/parseISO';
import format from 'date-fns/esm/format';
import formatDistanceStrict from 'date-fns/esm/formatDistanceStrict';
import prettyNum, {PRECISION_SETTING} from 'pretty-num';
import stripZeros from 'pretty-num/src/strip-zeros';
import fromExponential from 'from-exponential';
import decode from 'entity-decode';
import {txTypeList} from 'minterjs-tx/src/tx-types';

export function getTimeDistance(timestamp) {
    if (typeof timestamp === 'string') {
        timestamp = parseISO(timestamp);
    }
    const distance = formatDistanceStrict(timestamp, new Date(), {roundingMethod: 'floor'});

    return distance && distance !== 'Invalid Date' ? distance : false;
}

export function getTime(timestamp) {
    if (typeof timestamp === 'string') {
        timestamp = parseISO(timestamp);
    }
    const time = format(timestamp, 'yyyy-MM-dd HH:mm:ss O');

    return time && time !== 'Invalid Date' ? time : false;
}

export function getTimeMinutes(timestamp) {
    if (typeof timestamp === 'string') {
        timestamp = parseISO(timestamp);
    }
    const time = format(timestamp, 'yyyy-MM-dd HH:mm O');

    return time && time !== 'Invalid Date' ? time : false;
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
    return value;
}

/**
 * @param {string|number} value
 * @return {string}
 */
export function pretty(value) {
    const PRECISION = 2;
    if (value >= 1 || value <= -1 || Number(value) === 0) {
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
    //@TODO utf8 https://github.com/dankogai/js-base64
    const asci = window.atob(str);
    try {
        return decodeURIComponent(escape(asci));
    } catch (e) {
        return asci;
    }
}
