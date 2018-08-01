import toDate from 'date-fns/esm/toDate';
import format from 'date-fns/esm/format';
import formatDistanceStrict from 'date-fns/esm/formatDistanceStrict';
import prettyNum from 'pretty-num';
import decode from 'entity-decode';

export function getTimeDistance(timestamp) {
    const distance = formatDistanceStrict(toDate(timestamp), new Date());

    return distance && distance !== 'Invalid Date' ? distance : false;
}

export function getTimeUTC(timestamp) {
    const time = format(toDate(timestamp), 'YYYY-MM-dd HH:mm:ss O');

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
    value = value.replace(/Data$/, ''); // remove "Data" from the end
    value = value.replace( /([A-Z])/g, " $1" ); // add space before capital letters
    value = value.charAt(0).toUpperCase() + value.slice(1); // capitalize the first letter
    return value;
}

export function prettyRound(value) {
    return decode(prettyNum(value, {precision: 3, thousandsSeparator: '&thinsp;'}));
}

export function prettyRoundUsd(value) {
    return decode(prettyNum(value, {precision: 2, thousandsSeparator: '&thinsp;'}));
}

export function prettyExact(value) {
    return decode(prettyNum(value, {thousandsSeparator: '&thinsp;'}));
}

/**
 * @param {number} value
 * @param {number} power
 * @return {number}
 */
export function round(value, power) {
    let tenPower = Math.pow(10, power);
    return Math.round(value * tenPower) / tenPower;
}
