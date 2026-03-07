/**
 * Vercel Serverless Function: semua request diarahkan ke sini.
 * Tidak pakai app.listen(); init DB lalu forward (req, res) ke Express app.
 */
require('dotenv').config();

const db = require('../src/db');
const initPromise = db.init();

let app;
function getApp() {
  if (!app) app = require('../src/server');
  return app;
}

module.exports = async (req, res) => {
  await initPromise;
  getApp()(req, res);
};
