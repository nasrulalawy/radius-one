const db = require('../db');

function list() {
  return db.getOdpPop();
}

function getById(id) {
  return db.getOdpPopById(id);
}

function save(row) {
  return db.saveOdpPop(row);
}

function remove(id) {
  return db.deleteOdpPop(id);
}

module.exports = {
  list,
  getById,
  save,
  remove,
};
