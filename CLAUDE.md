# Travel Booking App

Local cab booking web app with Telegram-based admin notifications. Customers submit a booking form, the request is saved to SQLite, and a Telegram bot notifies the admin who can Accept or Reject directly from the chat.

## Tech Stack

- **Frontend:** React 19 + Next.js 16 (App Router) + TypeScript 5 + Tailwind CSS 4
- **Backend:** Next.js API routes (TypeScript)
- **Database:** SQLite via better-sqlite3 (WAL mode for concurrent access)
- **Bot:** node-telegram-bot-api (polling mode, runs as separate Node.js process)
- **Linting:** ESLint 9 (Next.js + TypeScript config)

## Project Structure

```
app/
  page.tsx            # Client component — booking form UI
  layout.tsx          # Root layout with Geist font
  globals.css         # Tailwind imports + CSS variables (dark mode)
  api/book/route.ts   # POST /api/book — validates and saves booking
lib/
  db.js               # Singleton SQLite connection (shared by API routes)
bot.js                # Telegram bot — polls DB, sends notifications, handles callbacks
init-db.js            # One-time script to create the bookings table schema
```

## Key Concepts

- **Two processes:** Next.js server + Telegram bot run independently, sharing only the SQLite DB
- **Database as queue:** `notified` column (0/1) tracks which bookings the bot has sent to Telegram
- **Status flow:** `PENDING` → `CONFIRMED` or `REJECTED` (admin decides via Telegram buttons)
- **Single table:** `bookings` with 9 columns — see schema at init-db.js:9-21

## Commands

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `node init-db.js` | Create database and schema (run once) |
| `npm run dev` | Start Next.js dev server on localhost:3000 |
| `node bot.js` | Start Telegram bot (run in separate terminal) |
| `npm run build` | Production build |
| `npm start` | Run production server |
| `npm run lint` | Run ESLint |

No test framework is configured.

## Environment Variables

Defined in `.env.local` (see `.env.example` for template):

- `BOT_TOKEN` — Telegram bot token from @BotFather
- `ADMIN_CHAT_ID` — Telegram chat ID for the admin receiving notifications

## Key Files When Making Changes

- **Adding form fields:** app/page.tsx (form state at :9-15, UI starting at :60), app/api/book/route.ts (validation at :11, insert at :18-21), init-db.js (schema at :9-21), bot.js (message text at :29-36)
- **Changing booking statuses:** bot.js:81 (state transition), init-db.js:17 (default value)
- **Database schema changes:** init-db.js (schema definition), then re-run `node init-db.js`
- **API response format:** app/api/book/route.ts:25-28 (success), :12-15 (error)
- **Telegram message format:** bot.js:29-36 (new booking), bot.js:91-97 (status update)
- **Native module config:** next.config.ts:4 (serverExternalPackages for better-sqlite3)

## Naming Conventions

- **Database columns:** snake_case (`pickup_datetime`, `created_at`)
- **JS/TS variables:** camelCase (`pickupDatetime`, `bookingId`)
- **Constants:** UPPER_SNAKE_CASE (`SERVICES`, `CARS`, `POLL_INTERVAL`)
- **React components:** PascalCase function names (`BookingPage`, `RootLayout`)
- **Path alias:** `@/*` maps to project root (tsconfig.json:21-23)

## Additional Documentation

Check these files for deeper context when working on related areas:

- [.claude/docs/architectural_patterns.md](.claude/docs/architectural_patterns.md) — Two-process architecture, database-as-queue pattern, WAL mode rationale, API contract, Telegram inline keyboard design, prepared statements convention
