

export default function({app, store}) {
    if (process.server) {
        return;
    }

    // current pages fired by popstate not yet handled by router's afterEach callback, FIFO
    const popList = [];


    window.addEventListener('popstate', (event) => {
        // push items to `popList` on popstate event
        // `popList` is array, because multiple popstate can be fired before router callback
        popList.push({
            name: app.router.app.$route.name,
            fullPath: app.router.app.$route.fullPath,
            key: event.state.key,
        });
    });


    app.router.afterEach((to, from) => {
        // initial page load
        if (!from.name) {
            return;
        }
        // here `from` corresponds to `history.state`

        // no popstate fired, check name to prevent same page with different query params
        if (!popList.length && from.name !== to.name) {
            store.commit('PUSH_HISTORY', {
                // url странцы, с которой производится переход
                name: from.name,
                fullPath: from.fullPath,
                // ключ страницы с которой производится переход
                // при popstate (например Назад), history будет содержать состоянии страницы, куда произодится переход
                // т.к. история меняется позже, чем отрабатывает эта функция,
                key: window.history.state.key,
            });
        }

        // popstate fired
        while (popList.length) {
            const popItem = popList.shift();
            const historyItem = store.state.history[store.state.history.length - 1];
            if (popItem.key === historyItem.key) {
                // popstate back
                store.commit('POP_HISTORY');
            } else {
                // popstate forward
                store.commit('POP_HISTORY', {isForward: true});
            }
        }
    });

}
