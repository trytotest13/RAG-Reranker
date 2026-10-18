'use strict';

// Static file server + POST /api/rerank + GET /api/corpus. Node stdlib only.

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { rerank, CORPUS } = require('./lib/score.js');

const PORT = Number(process.env.PORT) || 3915;
const ROOT = __dirname;
const BODY_CAP = 1024 * 1024;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
};

function send(res, code, body, type = 'application/json') {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(body);
}

const json = (res, code, obj) => send(res, code, JSON.stringify(obj));

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => {
      raw += c;
      if (raw.length > BODY_CAP) {
        reject(new Error('body too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(raw));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    if (url.pathname === '/api/health' && req.method === 'GET') {
      return json(res, 200, { ok: true });
    }

    if (url.pathname === '/api/corpus' && req.method === 'GET') {
      return json(res, 200, { corpus: CORPUS });
    }

    if (url.pathname === '/api/rerank' && req.method === 'POST') {
      let body;
      try {
        body = JSON.parse((await readBody(req)) || '{}');
      } catch {
        return json(res, 400, { error: 'invalid JSON body' });
      }
      const query = typeof body.query === 'string' ? body.query : '';
      if (!query.trim()) return json(res, 400, { error: 'query is required' });
      if (query.length > 500) return json(res, 400, { error: 'query is limited to 500 characters' });
      return json(res, 200, rerank(query));
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return json(res, 405, { error: 'method not allowed' });
    }

    const rel = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    const file = path.normalize(path.join(ROOT, rel));
    if (file !== ROOT && !file.startsWith(ROOT + path.sep)) {
      return json(res, 403, { error: 'forbidden' });
    }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      return json(res, 404, { error: 'not found' });
    }
    send(res, 200, fs.readFileSync(file), MIME[path.extname(file)] || 'application/octet-stream');
  } catch (err) {
    json(res, 500, { error: String((err && err.message) || err) });
  }
});

server.listen(PORT, () => {
  console.log(`Jev RAG Reranker on http://localhost:${PORT}`);
});
