# Travel Booking App

Local cab booking app with Telegram notifications. Customers submit bookings via a web form, and you receive Accept/Reject buttons on Telegram.

## Prerequisites

- Node.js 18+
- A Telegram Bot Token (from @BotFather)
- Your Telegram Chat ID

## Setup

### 1. Install dependencies

```bash
cd travel-booking
npm install
```

### 2. Create the database

```bash
node init-db.js
```

This creates `bookings.db` in the project root.

### 3. Configure environment

Edit `.env.local` and fill in your credentials:

```
BOT_TOKEN=your_bot_token_here
ADMIN_CHAT_ID=your_chat_id_here
```

#### How to get BOT_TOKEN

1. Open Telegram and search for **@BotFather**.
2. Send `/newbot` and follow the prompts.
3. Copy the token it gives you.

#### How to get ADMIN_CHAT_ID

1. Search for **@userinfobot** on Telegram.
2. Start the bot — it replies with your Chat ID.

## Running

You need **two terminals** running side by side:

**Terminal 1 — Web server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Terminal 2 — Telegram bot:**

```bash
node bot.js
```

## How it works

1. Customer fills out the booking form at `localhost:3000` and submits.
2. The booking is saved to SQLite with status `PENDING`.
3. The bot polls the database every 5 seconds for new bookings.
4. When it finds one, it sends you a Telegram message with **Accept** and **Reject** buttons.
5. You tap a button on your phone — the bot updates the database and edits the message to show the new status.

## Project Structure

```
travel-booking/
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Booking form (client component)
│   ├── globals.css          # Tailwind CSS
│   └── api/book/route.ts    # POST /api/book endpoint
├── lib/db.js                # Shared SQLite connection
├── bot.js                   # Telegram bot (polling mode)
├── init-db.js               # Database initializer
├── .env.local               # Your bot credentials (gitignored)
├── .env.example             # Template for .env.local
└── bookings.db              # SQLite database (created by init-db.js)
```
