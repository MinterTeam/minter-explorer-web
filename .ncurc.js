module.exports = {
  format: [
      'group',
      'repo',
      'ownerChanged',
  ],
  reject: [
      // requires backend update
      'centrifuge',
      // vue 3
      'nuxt',
      'vuex',
      '@nuxt/content',
      'qrcode.vue',
      // nuxt 3 (webpack5)
      'less-loader',
      // es modules
      'beeper',
      'camelcase-keys',
      'del',
      'gulp-imagemin',
      'imagemin-mozjpeg',
  ],
};
