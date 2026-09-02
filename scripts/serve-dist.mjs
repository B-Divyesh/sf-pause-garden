import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const root = new URL('../dist/', import.meta.url).pathname;
const port = Number(process.env.PORT || 4173);
const appRoutes = new Set(['/', '/demo', '/play', '/privacy', '/terms']);
const types = {
  '.avif': 'image/avif', '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8', '.webp': 'image/webp', '.xml': 'application/xml; charset=utf-8',
};

createServer((request, response) => {
  const pathname = new URL(request.url || '/', 'http://127.0.0.1').pathname.replace(/\/$/, '') || '/';
  const relative = normalize(decodeURIComponent(pathname)).replace(/^(\.\.(\/|\\|$))+/, '').replace(/^\/+/, '');
  let file = join(root, relative);
  let status = 200;
  if (appRoutes.has(pathname)) file = join(root, 'index.html');
  else if (!relative || !existsSync(file) || !statSync(file).isFile()) {
    file = join(root, '404.html');
    status = 404;
  }
  response.statusCode = status;
  response.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1', () => console.log(`Pause Garden static server listening on ${port}`));
