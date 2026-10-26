const Database = require('better-sqlite3');

function openDb(file = process.env.DB_FILE || 'cricketers.db') {
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS cricketers (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      jersey_no  INTEGER NOT NULL UNIQUE CHECK (jersey_no BETWEEN 0 AND 999),
      team       TEXT    NOT NULL,
      role       TEXT    NOT NULL CHECK (role IN ('Batsman','Bowler','All-rounder','Wicket-keeper')),
      matches    INTEGER NOT NULL DEFAULT 0 CHECK (matches >= 0),
      runs       INTEGER NOT NULL DEFAULT 0 CHECK (runs >= 0),
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
}

module.exports = { openDb };
