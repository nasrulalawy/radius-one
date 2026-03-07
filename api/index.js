/**
 * Vercel Serverless Function.
 * Semua request diarahkan ke sini. Init DB lalu forward ke Express app.
 */
const path = require('path');
try {
  require('dotenv').config();
} catch (e) {}

let db;
let initPromise;
let app;

function loadDb() {
  if (!db) {
    try {
      db = require('../src/db');
    } catch (e) {
      try {
        db = require(path.join(__dirname, '../src/db'));
      } catch (e2) {
        throw new Error('Cannot load db: ' + (e.message || e) + '; ' + (e2.message || e2));
      }
    }
    initPromise = db.init();
  }
  return initPromise;
}

function loadApp() {
  if (!app) {
    process.env.VERCEL = '1';
    try {
      app = require('../src/server');
    } catch (e) {
      try {
        app = require(path.join(__dirname, '../src/server'));
      } catch (e2) {
        throw new Error('Cannot load server: ' + (e.message || e));
      }
    }
  }
  return app;
}

module.exports = async (req, res) => {
  try {
    await loadDb();
    const expressApp = loadApp();
    if (typeof expressApp !== 'function') {
      throw new Error('Server did not export a function. Check server.js VERCEL export.');
    }
    expressApp(req, res);
  } catch (err) {
    console.error('Vercel function error:', err);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({
      error: 'FUNCTION_INVOCATION_FAILED',
      message: err.message || String(err),
      hint: 'Check Vercel env: SUPABASE_URL, SUPABASE_SERVICE_KEY. See logs in Vercel Dashboard.',
    });
  }
};
