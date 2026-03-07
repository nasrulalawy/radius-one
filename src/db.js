/**
 * Database layer: Supabase only.
 */
try {
  require('dotenv').config();
} catch (e) {}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
if (!url || !key) {
  const err = new Error('SUPABASE_URL dan SUPABASE_SERVICE_KEY (atau SUPABASE_ANON_KEY) wajib diisi. Set di Vercel: Project → Settings → Environment Variables.');
  module.exports = {
    init: () => Promise.reject(err),
    getData: () => ({}),
  };
} else {
  module.exports = require('./db-supabase');
}
