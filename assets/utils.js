import toDate from 'date-fns/esm/toDate';
import format from 'date-fns/esm/format';
import formatDistanceStrict from 'date-fns/esm/formatDistanceStrict';

export function getTimeDistance(timestamp) {
    const distance = formatDistanceStrict(toDate(timestamp), new Date());

    return distance && distance !== 'Invalid Date' ? distance : false;
}

export function getTimeUTC(timestamp) {
    const time = format(toDate(timestamp), 'YYYY-MM-DD HH:mm:ss O');

    return time && time !== 'Invalid Date' ? time : false;
}
