require("dotenv").config({ path: ".env.local" });
const TelegramBot = require("node-telegram-bot-api");
const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer");

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

if (!BOT_TOKEN || !ADMIN_CHAT_ID) {
  console.error("Missing BOT_TOKEN or ADMIN_CHAT_ID in .env.local");
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
  console.warn("SMTP env vars missing — email notifications will be skipped.");
}

const transporter =
  SMTP_HOST && SMTP_USER && SMTP_PASS
    ? nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      })
    : null;

async function sendBookingEmail(booking, status) {
  if (!transporter) return;

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
    await transporter.sendMail({
      from: SMTP_USER,
      to: booking.email_id,
      subject,
      html,
    });
    console.log(`Email sent to ${booking.email_id} for booking #${booking.id} (${status})`);
  } catch (err) {
    console.error(`Failed to send email for booking #${booking.id}:`, err.message);
  }
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log("Telegram bot started (polling mode)...");

// Poll for new bookings every 5 seconds
const POLL_INTERVAL = 5000;

async function checkNewBookings() {
  const { data: rows, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("notified", false);

  if (error) {
    console.error("Error polling bookings:", error.message);
    return;
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

  console.log(`Booking #${bookingId} updated to ${newStatus}`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\nShutting down bot...");
  bot.stopPolling();
  process.exit(0);
});
