import toDate from 'date-fns/esm/toDate';
import format from 'date-fns/esm/format';
import formatDistanceStrict from 'date-fns/esm/formatDistanceStrict';
import thousands from 'thousands';

export function getTimeDistance(timestamp) {
    const distance = formatDistanceStrict(toDate(timestamp), new Date());

    return distance && distance !== 'Invalid Date' ? distance : false;
}

export function getTimeUTC(timestamp) {
    const time = format(toDate(timestamp), 'YYYY-MM-dd HH:mm:ss O');

    return time && time !== 'Invalid Date' ? time : false;
}

export function thousandsFilter(value) {
    console.log(decode(thousands(value, '&thinsp;')))
    return decode(thousands(value, '&thinsp;'));
}


/**
 * @TODO separate module
 * from vue/src/compiler/parser/entity-decoder
 */
let decoder;
function decode(html) {
    decoder = decoder || document.createElement('div');
    decoder.innerHTML = html;
    return decoder.textContent;
}
