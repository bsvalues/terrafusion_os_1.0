module.exports = [
  {
    name: "Total Bundle Size",
    path: "dist/**/*.js",
    limit: "500 KB",
    webpack: false,
    gzip: true
  },
  {
    name: "Vendor Chunk",
    path: "dist/assets/vendor-*.js",
    limit: "300 KB",
    webpack: false,
    gzip: true
  },
  {
    name: "Main Bundle",
    path: "dist/assets/index-*.js",
    limit: "150 KB",
    webpack: false,
    gzip: true
  },
  {
    name: "CSS Bundle",
    path: "dist/assets/*.css",
    limit: "100 KB",
    webpack: false,
    gzip: true
  }
];
