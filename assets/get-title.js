import {BASE_TITLE_NETWORK, BASE_TITLE_END} from '~/assets/variables';

export default function getTitle(text) {
    const explorer = 'Explorer';
    if (text) {
        return BASE_TITLE_NETWORK + explorer + '. ' + text + BASE_TITLE_END;
    } else {
        return BASE_TITLE_NETWORK + explorer + BASE_TITLE_END;
    }
}
