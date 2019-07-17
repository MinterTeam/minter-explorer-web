import {COIN_NAME} from "~/assets/variables";

export default function() {
    return {
        COIN_NAME,
        // chain of previous pages, FILO
        history: [],
        // history chain detached from main chain by popstate
        detachedHistory: [],
    };
}
