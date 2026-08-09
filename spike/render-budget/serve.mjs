// THROWAWAY (ticket 04). Static server for the spike. No caching, no cleverness.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PORT = 4399;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.bin': 'application/octet-stream' };

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const rel = url.pathname === '/' ? '/index.html' : url.pathname;
  const file = path.join(HERE, decodeURIComponent(rel));
  if (!file.startsWith(HERE)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404).end('no'); return; }
    res.writeHead(200, {
      'content-type': TYPES[path.extname(file)] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    res.end(buf);
  });
}).listen(PORT, '127.0.0.1', () => console.log(`spike: http://127.0.0.1:${PORT}/`));
