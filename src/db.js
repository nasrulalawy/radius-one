/**
 * Database layer: Supabase only.
 */
require('dotenv').config();

if (!process.env.SUPABASE_URL || !(process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY)) {
  throw new Error('SUPABASE_URL dan SUPABASE_SERVICE_KEY (atau SUPABASE_ANON_KEY) wajib diisi. Lowdb sudah dinonaktifkan.');
}

module.exports = require('./db-supabase');
