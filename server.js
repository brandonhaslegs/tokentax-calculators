const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 5174;
const ROOT = __dirname;
const HEARTBEAT_INTERVAL = 15000;

const clients = new Set();

function sendEvent() {
  for (const res of clients) {
    res.write('data: reload\n\n');
  }
}

function sendHeartbeat() {
  for (const res of clients) {
    res.write(': keep-alive\n\n');
  }
}

function serveFile(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType =
      ext === '.html'
        ? 'text/html'
        : ext === '.css'
          ? 'text/css'
          : ext === '.js'
            ? 'application/javascript'
            : 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url);

  if (parsed.pathname === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write('\n');
    clients.add(res);

    req.on('close', () => {
      clients.delete(res);
    });
    return;
  }

  let pathname = parsed.pathname === '/' ? '/index.html' : parsed.pathname;
  pathname = pathname.replace(/\.\.(\/|\\)/g, '');
  const filePath = path.join(ROOT, pathname);
  serveFile(filePath, res);
});

fs.watch(ROOT, { recursive: true }, (eventType, filename) => {
  if (!filename) return;
  if (filename.endsWith('.html') || filename.endsWith('.css') || filename.endsWith('.js')) {
    sendEvent();
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
