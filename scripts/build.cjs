const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const vendor = path.join(root, 'vendor');
fs.mkdirSync(vendor, {recursive:true});
for (const name of ['three.module.js', 'three.core.js']) fs.copyFileSync(path.join(root, 'node_modules/three/build', name), path.join(vendor, name));
for (const name of ['utils/BufferGeometryUtils.js', 'geometries/RoundedBoxGeometry.js']) {
  const dest = path.join(vendor, 'addons', name);
  fs.mkdirSync(path.dirname(dest), {recursive:true});
  fs.copyFileSync(path.join(root, 'node_modules/three/examples/jsm', name), dest);
}
fs.copyFileSync(path.join(root, 'node_modules/three/LICENSE'), path.join(vendor, 'LICENSE'));
if (!process.argv.includes('--vendor-only')) {
  const out = path.join(root, 'dist');
  fs.rmSync(out, {recursive:true, force:true}); fs.mkdirSync(out);
  for (const name of ['index.html', 'styles.css', 'retro-bruma.css', 'src', 'vendor', 'fonts']) fs.cpSync(path.join(root, name), path.join(out, name), {recursive:true});
  console.log('Alborada: distribución estática preparada en dist/');
}
