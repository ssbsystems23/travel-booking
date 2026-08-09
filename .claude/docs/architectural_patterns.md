# Architectural Patterns

## Two-Process Architecture

The app runs as two independent processes sharing a single SQLite database:

1. **Next.js web server** (`npm run dev`) — serves the React frontend and API routes
2. **Telegram bot** (`node bot.js`) — standalone Node.js script that polls the database and communicates with the Telegram API

These processes have no direct communication channel; the database is the only shared state. This is intentional: the bot can be restarted independently without affecting the web server.

Reference: bot.js:14-18 (bot's own DB connection), lib/db.js:1-9 (web server's DB singleton)

## Database as Message Queue

Instead of using a dedicated message broker, the `bookings` table doubles as a work queue via the `notified` column:

- New bookings are inserted with `notified = 0` (init-db.js:18)
- The bot polls for `notified = 0` rows every 5 seconds (bot.js:23-26)
- After sending the Telegram notification, it sets `notified = 1` (bot.js:52-54)

This polling pattern (bot.js:63-66) avoids the complexity of webhooks or pub/sub while being sufficient for low-volume traffic.

## Booking Status State Machine

Bookings follow a simple linear state flow managed across the two processes:

```
PENDING → CONFIRMED  (admin taps Accept on Telegram)
PENDING → REJECTED   (admin taps Reject on Telegram)
```

- Initial state set on insert: app/api/book/route.ts:20
- State transitions: bot.js:81-86
- Status values are plain strings, not enums — `"PENDING"`, `"CONFIRMED"`, `"REJECTED"`

## SQLite WAL Mode for Concurrent Access

Since two separate processes (Next.js + bot) access the same database file, WAL (Write-Ahead Logging) is enabled in every connection point:

- lib/db.js:7
- bot.js:16
- init-db.js:7

WAL allows concurrent reads while a write is in progress, preventing lock contention between the web server handling form submissions and the bot polling for new bookings.

## Singleton Database Connection (Web Server)

The Next.js server uses a single shared database instance exported from lib/db.js:5. This module is `require()`'d by API routes (app/api/book/route.ts:4), ensuring one connection is reused across all requests within the same server process.

The bot creates its own separate connection (bot.js:14-15) since it runs as a different process.

## Client-Server API Contract

All API responses follow a consistent JSON envelope:

**Success:** `{ success: true, bookingId: <number> }` (app/api/book/route.ts:25-28)
**Validation error:** `{ success: false, error: "<message>" }` with HTTP 400 (app/api/book/route.ts:12-15)
**Server error:** `{ success: false, error: "<message>" }` with HTTP 500 (app/api/book/route.ts:31-34)

The client checks `data.success` to determine outcome (app/page.tsx:36-43), not HTTP status codes.

## Controlled Form with State Reset

The booking form uses React controlled components with a single state object (app/page.tsx:9-15). On successful submission, the form resets to initial values (app/page.tsx:39), providing immediate visual feedback that the action completed.

UI status is tracked as a union type: `"idle" | "loading" | "success" | "error"` (app/page.tsx:16).

## Telegram Inline Keyboard for Admin Actions

The bot uses Telegram's inline keyboard buttons (bot.js:38-47) instead of text commands for admin decisions. Callback data follows the format `<action>_<bookingId>` (e.g., `accept_5`, `reject_5`), parsed via string splitting (bot.js:73-74).

After an admin acts, the original message is edited in-place (bot.js:99-102) rather than sending a new message, keeping the chat clean.

## Prepared Statements for All Queries

Every database query uses parameterized prepared statements:

- bot.js:26, bot.js:52, bot.js:83, bot.js:88
- app/api/book/route.ts:18-21

This prevents SQL injection and is consistent across both processes.

## Graceful Shutdown (Bot)

The bot handles SIGINT (bot.js:113-118) to stop polling and close the database connection cleanly, preventing WAL file corruption or dangling locks.

## Environment Variable Validation (Fail-Fast)

The bot validates required environment variables at startup (bot.js:9-12) and exits immediately if they're missing, rather than failing later at runtime with cryptic errors.

## Native Module Exclusion

`better-sqlite3` is a native C++ addon that cannot be bundled by Next.js's webpack. It's excluded via `serverExternalPackages` in next.config.ts:4, ensuring it's loaded at runtime from `node_modules` instead of being bundled.
