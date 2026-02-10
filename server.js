const path = require("path");

// Save root directory before standalone server changes cwd
const ROOT_DIR = __dirname;

// Load env vars BEFORE anything else so they're available to both
// Next.js and the Telegram bot. In the cloud, .env.local won't exist
// and dotenv silently no-ops — env vars come from the cloud provider.
require("dotenv").config({ path: path.join(ROOT_DIR, ".env.local") });

// --- Database logging: write all console output to Supabase logs table ---
const { createClient } = require("@supabase/supabase-js");

let logSupabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  logSupabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
}

function writeLogToDb(level, args) {
  if (!logSupabase) return;
  const message = args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ");
  // Fire-and-forget — never block the caller
  logSupabase.from("logs").insert({ level, message }).then(({ error }) => {
    if (error) originalError("[log-db] Failed to write log:", error.message);
  });
}

const originalLog = console.log.bind(console);
const originalError = console.error.bind(console);
const originalWarn = console.warn.bind(console);

console.log = (...args) => { originalLog(...args); writeLogToDb("LOG", args); };
console.error = (...args) => { originalError(...args); writeLogToDb("ERROR", args); };
console.warn = (...args) => { originalWarn(...args); writeLogToDb("WARN", args); };

// --- Nightly log cleanup: delete all logs every midnight IST ---
function scheduleNightlyCleanup() {
  if (!logSupabase) return;

  function msUntilMidnightIST() {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    const istMidnight = new Date(istNow);
    istMidnight.setUTCHours(0, 0, 0, 0);
    istMidnight.setUTCDate(istMidnight.getUTCDate() + 1);
    return istMidnight.getTime() - istNow.getTime();
  }

  async function deleteAllLogs() {
    // Supabase requires a filter for delete — use created_at is not null to match all
    const { error } = await logSupabase
      .from("logs")
      .delete()
      .not("created_at", "is", null);
    if (error) {
      originalError("[log-db] Nightly cleanup failed:", error.message);
    } else {
      originalLog("[log-db] Nightly cleanup complete — all logs deleted.");
    }
    // Schedule next cleanup in ~24h
    setTimeout(deleteAllLogs, 24 * 60 * 60 * 1000);
  }

  setTimeout(deleteAllLogs, msUntilMidnightIST());
  originalLog(`[log-db] Nightly cleanup scheduled in ${Math.round(msUntilMidnightIST() / 60000)} minutes.`);
}

scheduleNightlyCleanup();

// Bind to 0.0.0.0 so Railway (and other cloud platforms) can route traffic
process.env.HOSTNAME = "0.0.0.0";
console.log(process.env.HOSTNAME)

// Start Next.js server
require("./.next/standalone/server.js");

// --- Telegram Bot (runs in the same process) ---

const TelegramBot = require("node-telegram-bot-api");
const { Resend } = require("resend");

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM;

console.log("[bot] BOT_TOKEN:", BOT_TOKEN ? "set" : "MISSING");
console.log("[bot] ADMIN_CHAT_ID:", ADMIN_CHAT_ID ? "set" : "MISSING");
console.log("[bot] SUPABASE_URL:", process.env.SUPABASE_URL ? "set" : "MISSING");
console.log("[bot] SUPABASE_ANON_KEY:", process.env.SUPABASE_ANON_KEY ? "set" : "MISSING");

if (!BOT_TOKEN || !ADMIN_CHAT_ID) {
  console.warn("Missing BOT_TOKEN or ADMIN_CHAT_ID — Telegram bot will not start.");
} else {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY — bot cannot access database.");
  } else {
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!RESEND_API_KEY || !EMAIL_FROM) {
      console.warn("RESEND_API_KEY or EMAIL_FROM missing — email notifications will be skipped.");
    }

    const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

    async function sendBookingEmail(booking, status) {
      if (!resend || !EMAIL_FROM) return;

      const isConfirmed = status === "CONFIRMED";
      const subject = isConfirmed
        ? `Booking #${booking.id} Confirmed`
        : `Booking #${booking.id} Rejected`;

      const html = `
        <h2>Your booking has been ${isConfirmed ? "confirmed" : "rejected"}</h2>
        <p>Hi ${booking.name},</p>
        <p>Your booking request <strong>#${booking.id}</strong> has been <strong>${isConfirmed ? "confirmed" : "rejected"}</strong>.</p>
        <table style="border-collapse:collapse;">
          <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Pickup</td><td>${booking.pickup_datetime}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Service</td><td>${booking.service}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Car</td><td>${booking.car}</td></tr>
        </table>
        ${isConfirmed ? "<p>We look forward to serving you!</p>" : "<p>We apologize for the inconvenience. Please try again or contact us for assistance.</p>"}
        <br><p>Thank you,<br>Shri Hanumanth Tours And Travels</p>
      `;

      try {
        await resend.emails.send({
          from: EMAIL_FROM,
          to: booking.email_id,
          subject,
          html,
        });
        console.error(`Email sent to ${booking.email_id} for booking #${booking.id} (${status})`);
      } catch (err) {
        console.error(`Failed to send email for booking #${booking.id}:`, err.message);
      }
    }

    const bot = new TelegramBot(BOT_TOKEN, { polling: true });

    console.error("[bot] Telegram bot started (polling mode)...");

    bot.on("polling_error", (err) => {
      console.error("[bot] Telegram polling error:", err.message);
    });

    const POLL_INTERVAL = 5000;

    async function checkNewBookings() {
      const { data: rows, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("notified", false);

      if (error) {
        console.error("[bot] Error polling bookings:", error.message);
        return;
      }

      if (rows && rows.length > 0) {
        console.error(`[bot] Found ${rows.length} new booking(s) to notify.`);
      }

      for (const booking of rows) {
        const text =
          `New Booking Request #${booking.id}\n\n` +
          `Name: ${booking.name}\n` +
          `Mobile: ${booking.mobile}\n` +
          `Email: ${booking.email_id}\n` +
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
          .then(async () => {
            await supabase
              .from("bookings")
              .update({ notified: true })
              .eq("id", booking.id);
            console.error(`Notified admin about booking #${booking.id}`);
          })
          .catch((err) => {
            console.error(`Failed to send message for booking #${booking.id}:`, err.message);
          });
      }
    }

    setInterval(checkNewBookings, POLL_INTERVAL);
    checkNewBookings();

    bot.on("callback_query", async (query) => {
      const data = query.data;
      if (!data) return;

      const [action, idStr] = data.split("_");
      const bookingId = parseInt(idStr, 10);

      if (!["accept", "reject"].includes(action) || isNaN(bookingId)) {
        bot.answerCallbackQuery(query.id, { text: "Invalid action." });
        return;
      }

      const newStatus = action === "accept" ? "CONFIRMED" : "REJECTED";

      await supabase
        .from("bookings")
        .update({ status: newStatus })
        .eq("id", bookingId);

      const { data: booking } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single();

      if (booking) {
        const updatedText =
          `Booking #${booking.id} — ${newStatus}\n\n` +
          `Name: ${booking.name}\n` +
          `Mobile: ${booking.mobile}\n` +
          `Email: ${booking.email_id}\n` +
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

      if (booking) {
        sendBookingEmail(booking, newStatus);
      }

      console.error(`Booking #${bookingId} updated to ${newStatus}`);
    });

    process.on("SIGINT", () => {
      console.error("\nShutting down bot...");
      bot.stopPolling();
      process.exit(0);
    });
  }
}
