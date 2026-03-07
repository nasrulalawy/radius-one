require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const activityLog = require('./services/activityLog');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'radius-one-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 },
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// Public folder di root project (bukan src/public)
app.use(express.static(path.join(process.cwd(), 'public')));
// SPA (Vite build) - serve React app for non-API routes in production
const clientDist = path.join(process.cwd(), 'dist');
app.use(express.static(clientDist));

function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return {};
  const out = {};
  Object.keys(body).forEach((k) => {
    if (/password/i.test(k)) return;
    out[k] = body[k];
  });
  return out;
}

// Ringan: catat aksi admin non-GET untuk menu "Software Logs".
app.use((req, res, next) => {
  res.on('finish', () => {
    if (req.method === 'GET') return;
    if (!req.session || !req.session.userId) return;
    if (req.path === '/software-logs') return;
    Promise.resolve(activityLog.append({
      user_id: req.session.userId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      payload: sanitizeBody(req.body),
      ip: req.ip,
    })).catch(() => {});
  });
  next();
});

// REST API for Vite/React frontend
app.use('/api', require('./routes/api'));

app.use(routes);

// SPA fallback: admin hanya Vite/React; kirim index.html untuk path selain /api dan /client
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/client')) return next();
  const fs = require('fs');
  const indexHtml = path.join(clientDist, 'index.html');
  if (fs.existsSync(indexHtml)) res.sendFile(indexHtml);
  else next();
});

// Vercel: export app only (no listen). api/index.js will call db.init() and forward (req, res).
if (process.env.VERCEL === '1') {
  module.exports = app;
} else {
  const db = require('./db');
  (async function start() {
    await db.init();
    app.listen(PORT, () => {
      console.log(`Radius One Billing berjalan di http://localhost:${PORT}`);
      console.log('Database: Supabase (PostgreSQL)');
    });
  })();
}
