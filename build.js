const path = require('path');
const esbuild = require('esbuild');

// --bundle --minify --platform=node src/index.ts --outdir=dist --sourcemap=inline",

const rs = esbuild.buildSync({
  bundle: true,
  platform: 'node',
  loader: {
    '.node': 'file',
  },
  banner: {
    js: '#!/usr/bin/env node \n'
  },
  minify: true,
  // sourcemap: 'inline',
  external: [],
  outdir: 'dist',
  entryPoints: ['src/app.ts'],
});

if(rs.errors.length > 1) {
  rs.errors.forEach(i=>{
    console.error(e);
  });
  process.exit(1);
}

if(rs.warnings.length > 1) {
  rs.warnings.forEach(i=>{
    console.warn(i);
  });
}

// console.log(rs);
// const outFiles = rs.outputFiles;
// outFiles.forEach(file=>{
//   const fpath = path.basename(fpath);
//   const [total, fmt] = byteConvert(file.contents.byteLength);
//   console.log(`${fpath}: ${total} ${fmt}B`);
// });
// console.log('finished!');
