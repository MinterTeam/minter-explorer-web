const GTM_ID = 'GTM-KRDL5BW';

export default ({ app }) => {
    /*
    ** Only run on client-side and only in production mode
    */
    if (process.env.NODE_ENV !== 'production' || typeof window === 'undefined') {
        return;
    }


    window['dataLayer'] = window['dataLayer'] || [];
    window['dataLayer'].push({
        'gtm.start': new Date().getTime(), event: 'gtm.js',
    });

    /*
    ** Include GTM Script
    */
    let script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtm.js?id=' + GTM_ID;
    document.body.appendChild(script);


    app.router.afterEach((to, from) => {
        /*
        ** We tell Google Analytics to add a `pageview`
        */
        window['dataLayer'].push({ event: 'nuxtRoute', pageType: 'PageView', pageUrl: to.fullPath, routeName: to.name });
    });
};
