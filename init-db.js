// Database is now hosted on Supabase (PostgreSQL).
// Run the following SQL in the Supabase SQL Editor to create the bookings table:
//
// CREATE TABLE bookings (
//   id BIGSERIAL PRIMARY KEY,
//   name TEXT NOT NULL,
//   mobile TEXT NOT NULL,
//   email_id TEXT NOT NULL DEFAULT '',
//   pickup_datetime TEXT NOT NULL,
//   service TEXT NOT NULL,
//   car TEXT NOT NULL,
//   status TEXT DEFAULT 'PENDING',
//   notified BOOLEAN DEFAULT FALSE,
//   created_at TIMESTAMPTZ DEFAULT NOW()
// );

console.log("This app now uses Supabase instead of local SQLite.");
console.log("Create the bookings table in your Supabase SQL Editor.");
console.log("See the SQL above in this file (init-db.js).");
