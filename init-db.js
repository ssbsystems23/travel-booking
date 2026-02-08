const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "bookings.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    pickup_datetime TEXT NOT NULL,
    service TEXT NOT NULL,
    car TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    notified INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

console.log(`Database created at: ${dbPath}`);
console.log("Table 'bookings' is ready.");

db.close();
