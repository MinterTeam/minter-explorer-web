import parseISO from 'date-fns/esm/parseISO';
import format from 'date-fns/esm/format';
import formatDistanceStrict from 'date-fns/esm/formatDistanceStrict';
import prettyNum from 'pretty-num';
import decode from 'entity-decode';
import {txTypeList} from 'minterjs-tx/src/tx-types';

export function getTimeDistance(timestamp) {
    const distance = formatDistanceStrict(parseISO(timestamp), new Date(), {roundingMethod: 'floor'});

    return distance && distance !== 'Invalid Date' ? distance : false;
}

export function getTimeUTC(timestamp) {
    const time = format(parseISO(timestamp), 'yyyy-MM-dd HH:mm:ss O');

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
    if (value > 0.001 || value < -0.001 || Number(value) === 0) {
        return decode(prettyNum(value, {precision: 4, rounding: 'fixed', thousandsSeparator: '&#x202F;'}));
    } else {
        return decode(prettyNum(value, {precision: 2, rounding: 'significant', thousandsSeparator: '&#x202F;'}));
    }
}

export function prettyUsd(value) {
    return decode(prettyNum(value, {precision: 2, thousandsSeparator: '&#x202F;'}));
}

export function prettyRound(value) {
    return decode(prettyNum(value, {precision: 0, thousandsSeparator: '&#x202F;'}));
}

/**
 * Ensure value to have minimum 4 decimal digits
 * @param {string|number} value
 * @return {string}
 */
export function prettyExact(value) {
    return decode(prettyNum(value, {precision: 4, rounding: 'increase', thousandsSeparator: '&#x202F;'}));
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
