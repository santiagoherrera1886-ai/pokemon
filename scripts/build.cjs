const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const crypto = require('node:crypto');
// Rebuild the original Bruma concept-art sprite sheet from ASCII parts.
// The authored images live in the repository as chunks for portability.
const retroDir = path.join(root,'src','art','retro-raw');
const retroB64 = [0,1,2,3].map(i=>fs.readFileSync(path.join(retroDir,i+'.b64'),'utf8').trim()).join('');
const retroPng = Buffer.from(retroB64,'base64');
const expectedHash = 'bbd65fb805c2caab38e70b84a55c66ae49858a0680f992d909bdb51d6245fb42';
const observedHash = crypto.createHash('sha256').update(retroPng).digest('hex');
if(observedHash !== expectedHash) throw new Error('Atlas retro de criaturas incorrecto. Esperado: '+expectedHash+', recibido: '+observedHash);
fs.writeFileSync(path.join(root,'src','art','retro-reference.png'),retroPng);

const vendor = path.join(root, 'vendor');
fs.mkdirSync(vendor, {recursive:true});
for (const name of ['three.module.js', 'three.core.js']) fs.copyFileSync(path.join(root, 'node_modules/three/build', name), path.join(vendor, name));
for (const name of ['utils/BufferGeometryUtils.js', 'geometries/RoundedBoxGeometry.js', 'loaders/GLTFLoader.js', 'utils/SkeletonUtils.js']) {
  const dest = path.join(vendor, 'addons', name);
  fs.mkdirSync(path.dirname(dest), {recursive:true});
  fs.copyFileSync(path.join(root, 'node_modules/three/examples/jsm', name), dest);
}
fs.copyFileSync(path.join(root, 'node_modules/three/LICENSE'), path.join(vendor, 'LICENSE'));
if (!process.argv.includes('--vendor-only')) {
  const out = path.join(root, 'dist');
  fs.rmSync(out, {recursive:true, force:true}); fs.mkdirSync(out);
  for (const name of ['index.html', 'styles.css', 'retro-bruma.css', 'src', 'vendor', 'fonts', 'assets']) fs.cpSync(path.join(root, name), path.join(out, name), {recursive:true});
  console.log('Puchamon: distribución estática preparada en dist/');
}
