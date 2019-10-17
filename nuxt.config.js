// register env before other imports @see https://www.npmjs.com/package/dotenv#how-do-i-use-dotenv-with-import-
import 'dotenv/config';
import dotenv from 'dotenv';
import webpack from 'webpack';
const path = require('path');
const fs = require('fs');

const dotEnvConfig = dotenv.config();
const dotEnv = dotEnvConfig.error ? {} : dotEnvConfig.parsed;
const dotEnvExample = dotenv.parse(fs.readFileSync(path.resolve(process.cwd(), '.env.example')));
const processEnv = {};
// copy process.env values by .env.example keys
Object.keys(dotEnvExample).forEach((key) => {
    processEnv[key] = process.env[key];
});

import {BASE_TITLE, BASE_DESCRIPTION} from "./assets/variables";

module.exports = {
    /*
    ** Headers of the page
    */
    head: {
        title: BASE_TITLE,
        meta: [
            { charset: 'utf-8' },
            { name: 'viewport', content: 'width=device-width, initial-scale=1' },
            { hid: 'description', name: 'description', content: BASE_DESCRIPTION },
            { hid: 'og-title', name: 'og:title', content: BASE_TITLE },
            { hid: 'og-description', name: 'og:description', content: BASE_DESCRIPTION },
            { hid: 'og-image', name: 'og:image', content: '/social-share.png' },
        ],
        link: [
            { rel: 'icon', href: '/favicon.png' },
            { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        ],
    },
    css: [
        './static/css/style.min.css',
    ],
    /*
    ** Customize the progress bar color
    */
    loading: { color: '#cf5c2c' },
    router: {
        linkActiveClass: '',
        linkExactActiveClass: 'is-active',
        middleware: [
            'hash-lowercase',
            'validator-meta',
        ],
    },
    plugins: [
        { src: '~/plugins/click-blur.js', ssr: false },
        { src: '~/plugins/seo-gtag.js', ssr: false },
        // { src: '~/plugins/seo-ym.js', ssr: false },
        // { src: '~/plugins/seo-fb.js', ssr: false },
        // { src: '~/plugins/seo-vk.js', ssr: false },
        // { src: '~/plugins/seo-tw.js', ssr: false },
        { src: '~/plugins/history.js', ssr: false },
    ],
    env: Object.assign({}, processEnv, dotEnv),
    modern: 'client',
    /*
    ** Build configuration
    */
    build: {
        extractCSS: true,
        // optimization: {
        //     splitChunks: {
        //         name: true
        //     }
        // },
        watch: [
            './api/',
            // `./lang/`, // this watcher dont-work yet
        ],
        /*
        ** Run ESLint on save
        */
        extend(config, { isDev, isClient, isServer }) {
            /*
            ** Run ESLint on save
            */
            // if (isDev && isClient) {
            //     config.module.rules.push({
            //         enforce: 'pre',
            //         test: /\.(js|vue)$/,
            //         loader: 'eslint-loader',
            //         exclude: /(node_modules)/,
            //     });
            // }
            if (!config.resolve) {
                config.resolve = {};
            }
            config.resolve.mainFields =  ['module', 'browser', 'main'];
        },
        plugins: [
            new webpack.ContextReplacementPlugin(/moment[/]locale$/, /^\.\/(en|ru)$/),
        ],
        babel: {
            presets: ['@nuxt/babel-preset-app'],
            // prevent @babel/plugin-transform-runtime from inserting `import` statement into commonjs files (bc. it breaks webpack)
            sourceType: 'unambiguous',
        },
        transpile: [
            /es6-promise|\.(?!(?:js|json)$).{1,5}$/i,
            '/base-x/',
            '@material/',
            'date-fns/esm',
            'lodash-es',
            'centrifuge/src',
            // 'autonumeric/src',
            // 'vue-autonumeric/src',
            // 'nuxt-i18n/src',
            'clipbrd/src',
            'pretty-num/src',
            'from-exponential/src',
            'minterjs-util/src',
            'minterjs-tx/src',
            'minterjs-wallet/src',
            'minter-js-sdk/src',
            'minter-js-org/src',
        ],
    },
};
