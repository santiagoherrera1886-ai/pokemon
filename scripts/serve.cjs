const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const types = {'.js':'text/javascript', '.html':'text/html', '.css':'text/css', '.png':'image/png', '.json':'application/json', '.woff2':'font/woff2'};
http.createServer((req, res) => {
  const name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(root, '.' + (name === '/' ? '/index.html' : name));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {res.writeHead(404); res.end(); return;}
  res.writeHead(200, {'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store'});
  fs.createReadStream(file).pipe(res);
}).listen(Number((process.argv.includes('--port') ? process.argv[process.argv.indexOf('--port') + 1] : null) || process.env.PORT || 3000), '0.0.0.0');
