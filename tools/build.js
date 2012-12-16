({
  appDir: '../www',
  baseUrl: 'lib',
  dir: '../www-built',
  paths: {
    app: '../app',
    prim: 'empty:'
  },

  // Do not keep around any combined files.
  // This holds for the JS and for any @import
  // inlining of CSS
  removeCombined: true,

  //Set to 'uglify' if want uglification
  optimize: 'none',

  modules: [
    {
      name: 'alameda',
      include: ['Deck', 'tmpl', 'mustache', 'events', 'IDB']
    }
  ]
})