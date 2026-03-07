const db = require('../db');
const supabaseAuth = require('../services/supabaseAuth');

function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.redirect('/login');
  }
  next();
}

function optionalAuth(req, res, next) {
  if (req.session?.userId) {
    req.user = db.getUserById(req.session.userId);
  }
  next();
}

function loadUser(req, res, next) {
  if (req.session?.userId) {
    const u = db.getUserById(req.session.userId);
    if (u) req.user = { id: u.id, username: u.username, role: u.role };
  }
  next();
}

async function login(username, password) {
  return supabaseAuth.signInAdmin(username, password);
}

module.exports = { requireAuth, optionalAuth, loadUser, login };
