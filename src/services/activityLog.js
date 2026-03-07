const db = require('../db');

function append(entry) {
  if (db.addActivityLog) return db.addActivityLog(entry);
  return null;
}

function readRecent(limit = 200) {
  if (db.getActivityLogs) return db.getActivityLogs(limit);
  return [];
}

module.exports = {
  append,
  readRecent,
};
