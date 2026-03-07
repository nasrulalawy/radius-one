const express = require('express');
const router = express.Router();
const db = require('../db');
const { loadUser } = require('../middleware/auth');

router.use(loadUser);

// Logout admin (clear session, redirect ke login - React akan handle /login)
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// ---------- Portal Pelanggan (EJS) ----------
function requireClientAuth(req, res, next) {
  if (!req.session || !req.session.clientCustomerId) {
    return res.redirect('/client/login');
  }
  next();
}

function loadClient(req, res, next) {
  if (req.session?.clientCustomerId) {
    req.clientCustomer = db.getCustomerById(req.session.clientCustomerId);
  }
  next();
}

router.get('/client/login', (req, res) => {
  if (req.session?.clientCustomerId) return res.redirect('/client');
  res.render('client/login', { title: 'Login Pelanggan', error: null });
});

router.post('/client/login', (req, res) => {
  const customer = db.getCustomerByUsernamePassword(req.body.username, req.body.password);
  if (!customer) {
    return res.render('client/login', { title: 'Login Pelanggan', error: 'Username atau password salah.' });
  }
  req.session.clientCustomerId = customer.id;
  req.session.save(() => res.redirect('/client'));
});

router.get('/client/logout', (req, res) => {
  req.session.clientCustomerId = null;
  req.session.save(() => res.redirect('/client/login'));
});

router.get('/client', loadClient, requireClientAuth, (req, res) => {
  const bills = db.getBillsByCustomerId(req.clientCustomer.id);
  const unpaid = bills.filter((b) => b.status === 'unpaid');
  const totalUnpaid = unpaid.reduce((s, b) => s + (b.amount || 0), 0);
  res.render('client/dashboard', {
    title: 'Portal Pelanggan',
    customer: req.clientCustomer,
    bills,
    unpaidCount: unpaid.length,
    totalUnpaid,
    paid: req.query.paid,
  });
});

router.get('/client/bills', loadClient, requireClientAuth, (req, res) => {
  const bills = db.getBillsByCustomerId(req.clientCustomer.id);
  res.render('client/bills', { title: 'Tagihan Saya', customer: req.clientCustomer, bills });
});

router.post('/client/bills/:id/pay', loadClient, requireClientAuth, async (req, res) => {
  const bill = db.getBillById(req.params.id);
  if (!bill || bill.customer_id !== req.clientCustomer.id) return res.redirect('/client');
  try {
    await db.payBill(bill.id, req.body.method || 'client');
  } catch (e) {
    return res.redirect('/client?error=' + encodeURIComponent(e.message || 'Gagal membayar'));
  }
  res.redirect('/client?paid=1');
});

module.exports = router;
