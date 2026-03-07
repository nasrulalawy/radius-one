const db = require('../db');

function list(status) {
  return db.getSupportTickets(status);
}

function getById(id) {
  return db.getSupportTicketById(id);
}

function save(row) {
  return db.saveSupportTicket(row);
}

function close(id) {
  return db.closeSupportTicket(id);
}

module.exports = {
  list,
  getById,
  save,
  close,
};
