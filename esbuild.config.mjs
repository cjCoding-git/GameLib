import esbuild from 'esbuild';
console.log("Starting build...");
var outfile = process.env.UNMINIFIED_OUT || 'dist/GameLib.js';
esbuild.build({
  entryPoints: ['src/index.js'],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  outfile: outfile,
  external: ['ws', 'crypto', 'path', 'fs'],
  loader: {
    '.glsl': 'text',
  },
}).catch(() => process.exit(1));
console.log("Build complete!");
