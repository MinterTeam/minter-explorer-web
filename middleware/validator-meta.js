let isFetched = false;

export default function({store}) {
    if (process.server) {
        return Promise.resolve();
    }

    // fetch only once
    if (isFetched) {
        return Promise.resolve();
    }

    // don't wait
    store.dispatch('FETCH_VALIDATOR_META_LIST')
        .then(() => {
            isFetched = true;
        })
        .catch((e) => {
            console.log(e);
        });

    return Promise.resolve();
}
