require("dotenv").config({ path: ".env.local" });
const TelegramBot = require("node-telegram-bot-api");
const Database = require("better-sqlite3");
const path = require("path");

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

if (!BOT_TOKEN || !ADMIN_CHAT_ID) {
  console.error("Missing BOT_TOKEN or ADMIN_CHAT_ID in .env.local");
  process.exit(1);
}

const dbPath = path.join(__dirname, "bookings.db");
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log("Telegram bot started (polling mode)...");

// Poll for new bookings every 5 seconds
const POLL_INTERVAL = 5000;

function checkNewBookings() {
  const rows = db.prepare("SELECT * FROM bookings WHERE notified = 0").all();

  for (const booking of rows) {
    const text =
      `New Booking Request #${booking.id}\n\n` +
      `Name: ${booking.name}\n` +
      `Mobile: ${booking.mobile}\n` +
      `Pickup: ${booking.pickup_datetime}\n` +
      `Service: ${booking.service}\n` +
      `Car: ${booking.car}\n` +
      `Status: ${booking.status}`;

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Accept", callback_data: `accept_${booking.id}` },
            { text: "Reject", callback_data: `reject_${booking.id}` },
          ],
        ],
      },
    };

    bot
      .sendMessage(ADMIN_CHAT_ID, text, keyboard)
      .then(() => {
        db.prepare("UPDATE bookings SET notified = 1 WHERE id = ?").run(
          booking.id
        );
        console.log(`Notified admin about booking #${booking.id}`);
      })
      .catch((err) => {
        console.error(`Failed to send message for booking #${booking.id}:`, err.message);
      });
  }
}

setInterval(checkNewBookings, POLL_INTERVAL);

// Run once immediately on start
checkNewBookings();

// Handle Accept/Reject button clicks
bot.on("callback_query", (query) => {
  const data = query.data;
  if (!data) return;

  const [action, idStr] = data.split("_");
  const bookingId = parseInt(idStr, 10);

  if (!["accept", "reject"].includes(action) || isNaN(bookingId)) {
    bot.answerCallbackQuery(query.id, { text: "Invalid action." });
    return;
  }

  const newStatus = action === "accept" ? "CONFIRMED" : "REJECTED";

  db.prepare("UPDATE bookings SET status = ? WHERE id = ?").run(
    newStatus,
    bookingId
  );

  const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);

  if (booking) {
    const updatedText =
      `Booking #${booking.id} — ${newStatus}\n\n` +
      `Name: ${booking.name}\n` +
      `Mobile: ${booking.mobile}\n` +
      `Pickup: ${booking.pickup_datetime}\n` +
      `Service: ${booking.service}\n` +
      `Car: ${booking.car}`;

    bot.editMessageText(updatedText, {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
    });
  }

  bot.answerCallbackQuery(query.id, {
    text: `Booking ${newStatus.toLowerCase()}.`,
  });

  console.log(`Booking #${bookingId} updated to ${newStatus}`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\nShutting down bot...");
  bot.stopPolling();
  db.close();
  process.exit(0);
});
