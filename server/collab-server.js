#!/usr/bin/env node
/**
 * Espada3D Collaboration Server
 *
 * A y-websocket server with optional Firebase Auth token verification.
 * Clients send their Firebase ID token as a query parameter (?token=xxx) and
 * the server validates it before allowing the WebSocket upgrade.
 *
 * Environment variables:
 *   PORT                       – listen port (default 1234)
 *   FIREBASE_PROJECT_ID        – Firebase project ID for token verification
 *   GOOGLE_APPLICATION_CREDENTIALS – path to service account JSON (optional)
 *   REQUIRE_AUTH               – set to "true" to reject unauthenticated connections
 *   CORS_ORIGINS               – comma-separated allowed origins (default "*")
 *   RATE_LIMIT_WINDOW_MS       – rate-limit sliding window in ms (default 60000)
 *   RATE_LIMIT_MAX             – max WebSocket upgrades per IP per window (default 30)
 *   TLS_CERT_PATH              – path to TLS certificate file (enables HTTPS)
 *   TLS_KEY_PATH               – path to TLS private key file (enables HTTPS)
 *
 * TLS / HTTPS:
 *   When both TLS_CERT_PATH and TLS_KEY_PATH are set the server starts as
 *   HTTPS + WSS instead of plain HTTP + WS.  For production deployments a
 *   reverse proxy (e.g. nginx, Caddy, or a cloud load-balancer) that
 *   terminates TLS is generally recommended over built-in TLS.
 *
 * Usage:
 *   node server/collab-server.js
 *
 * Or with environment variables:
 *   REQUIRE_AUTH=true PORT=1234 FIREBASE_PROJECT_ID=my-project node server/collab-server.js
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const { URL } = require('url');

// y-websocket provides a setupWSConnection utility
let setupWSConnection;
try {
  setupWSConnection = require('y-websocket/bin/utils').setupWSConnection;
} catch {
  console.error(
    'Error: y-websocket not found. Install it with: npm install y-websocket'
  );
  process.exit(1);
}

const WebSocket = require('ws');

const PORT = parseInt(process.env.PORT || '1234', 10);
const REQUIRE_AUTH = process.env.REQUIRE_AUTH === 'true';
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || '';
const CORS_ORIGINS = process.env.CORS_ORIGINS || '*';
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '30', 10);
const TLS_CERT_PATH = process.env.TLS_CERT_PATH || '';
const TLS_KEY_PATH = process.env.TLS_KEY_PATH || '';

// ---------- Optional Firebase Admin SDK for token verification ----------

let firebaseAdmin = null;
let firebaseAuth = null;

if (REQUIRE_AUTH && FIREBASE_PROJECT_ID) {
  try {
    firebaseAdmin = require('firebase-admin');

    if (!firebaseAdmin.apps.length) {
      firebaseAdmin.initializeApp({
        projectId: FIREBASE_PROJECT_ID,
      });
    }

    firebaseAuth = firebaseAdmin.auth();
    console.log(`[Auth] Firebase Admin initialized for project: ${FIREBASE_PROJECT_ID}`);
  } catch (err) {
    console.warn(
      '[Auth] firebase-admin not available. Install it for token verification:',
      'npm install firebase-admin'
    );
  }
}

/**
 * Verify a Firebase ID token.
 * Returns the decoded token (with uid, email, etc.) or null on failure.
 */
async function verifyToken(token) {
  if (!firebaseAuth) return null;
  try {
    return await firebaseAuth.verifyIdToken(token);
  } catch {
    return null;
  }
}

// ---------- CORS helpers ----------

/**
 * Return CORS headers based on the request origin and CORS_ORIGINS config.
 * CORS_ORIGINS can be "*" (allow all) or a comma-separated list of origins.
 */
function corsHeaders(reqOrigin) {
  const headers = {
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };

  if (CORS_ORIGINS === '*') {
    headers['Access-Control-Allow-Origin'] = '*';
  } else {
    const allowed = CORS_ORIGINS.split(',').map((o) => o.trim());
    if (reqOrigin && allowed.includes(reqOrigin)) {
      headers['Access-Control-Allow-Origin'] = reqOrigin;
      headers['Vary'] = 'Origin';
    }
  }
  return headers;
}

// ---------- In-memory IP-based rate limiter ----------

/** @type {Map<string, { count: number, resetAt: number }>} */
const rateLimitMap = new Map();

/**
 * Returns true if the given IP is within its rate limit, false if exceeded.
 * Cleans up stale entries lazily on each call.
 */
function rateLimitAllow(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= RATE_LIMIT_MAX;
}

// Periodically purge expired entries so the map doesn't grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now >= entry.resetAt) rateLimitMap.delete(ip);
  }
}, RATE_LIMIT_WINDOW_MS).unref();

// ---------- Room / connection tracking ----------

/** @type {Map<string, Set<import('ws')>>} */
const rooms = new Map();

function trackConnection(roomName, ws) {
  if (!rooms.has(roomName)) rooms.set(roomName, new Set());
  rooms.get(roomName).add(ws);

  ws.on('close', () => {
    const set = rooms.get(roomName);
    if (set) {
      set.delete(ws);
      if (set.size === 0) rooms.delete(roomName);
    }
  });
}

function getTotalConnections() {
  let total = 0;
  for (const set of rooms.values()) total += set.size;
  return total;
}

// ---------- HTTP + WebSocket Server ----------

/**
 * Build the HTTP(S) server.
 * When TLS_CERT_PATH and TLS_KEY_PATH are both provided the server uses the
 * built-in `https` module so it can accept WSS connections directly.
 * For most production setups a reverse proxy (nginx / Caddy / cloud LB) that
 * terminates TLS in front of a plain HTTP server is preferable.
 */
function createServer(handler) {
  if (TLS_CERT_PATH && TLS_KEY_PATH) {
    const tlsOptions = {
      cert: fs.readFileSync(TLS_CERT_PATH),
      key: fs.readFileSync(TLS_KEY_PATH),
    };
    console.log('[TLS] Starting server with TLS enabled');
    return https.createServer(tlsOptions, handler);
  }
  return http.createServer(handler);
}

const server = createServer((req, res) => {
  const origin = req.headers.origin || '';
  const cors = corsHeaders(origin);

  // Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors);
    res.end();
    return;
  }

  // Attach CORS headers to every response
  for (const [key, value] of Object.entries(cors)) {
    res.setHeader(key, value);
  }

  const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;

  if (pathname === '/health') {
    const body = JSON.stringify({
      status: 'ok',
      uptime: process.uptime(),
      connections: getTotalConnections(),
      rooms: rooms.size,
    });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(body);
    return;
  }

  if (pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Espada3D Collaboration Server\n');
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found\n');
});

const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', async (request, socket, head) => {
  const ip = request.headers['x-forwarded-for']
    ? request.headers['x-forwarded-for'].split(',')[0].trim()
    : request.socket.remoteAddress;

  // Rate-limit WebSocket upgrade attempts per IP
  if (!rateLimitAllow(ip)) {
    socket.write('HTTP/1.1 429 Too Many Requests\r\n\r\n');
    socket.destroy();
    return;
  }

  // Parse query parameters from the upgrade URL
  const url = new URL(request.url, `http://${request.headers.host}`);
  const token = url.searchParams.get('token');

  // Authenticate if required
  if (REQUIRE_AUTH) {
    if (!token) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    // Attach user info to the request for downstream use
    request.user = decoded;
    console.log(`[Auth] Authenticated user: ${decoded.uid} (${decoded.email || 'no email'})`);
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

wss.on('connection', (ws, req) => {
  const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;
  const roomName = pathname.slice(1) || 'default';
  trackConnection(roomName, ws);

  // The y-websocket setupWSConnection reads the room from the URL pathname
  setupWSConnection(ws, req);
});

server.listen(PORT, () => {
  const protocol = TLS_CERT_PATH && TLS_KEY_PATH ? 'https' : 'http';
  console.log(`[Server] Espada3D Collaboration Server running on ${protocol}://0.0.0.0:${PORT}`);
  console.log(`[Server] Auth required: ${REQUIRE_AUTH}`);
  console.log(`[Server] CORS origins: ${CORS_ORIGINS}`);
  console.log(`[Server] Rate limit: ${RATE_LIMIT_MAX} upgrades per ${RATE_LIMIT_WINDOW_MS}ms per IP`);
  if (REQUIRE_AUTH && !firebaseAuth) {
    console.warn('[Server] WARNING: Auth is required but firebase-admin is not available.');
    console.warn('[Server] All connections will be rejected. Install firebase-admin or set REQUIRE_AUTH=false.');
  }
});
