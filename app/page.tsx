"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";

const SERVICES = ["Pharma/Corporate", "Vipassana", "Airport", "Outstation"];
const CARS = ["Innova Crysta", "Ertiga", "Swift Dzire"];

const SERVICE_CARDS = [
  { image: "/card1.png", title: "Vipassana Pagoda Service", desc: "Special ride to Vipassana Golden Pagoda" },
  { image: "/card2.png", title: "Airport Pickup & Drop", desc: "Timely service to and from the airport" },
  { image: "/card3.png", title: "Outstation Tours", desc: "Comfortable rides out of town" },
  { image: "/card4.png", title: "Innova Crysta / Ertiga / Swift Dzire", desc: "Choose from our diverse car fleet" },
];

function getMinPickupIST(): string {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  const istMs = utcMs + 5.5 * 60 * 60_000;
  const minTime = new Date(istMs + 2 * 60 * 60_000);
  const y = minTime.getFullYear();
  const mo = String(minTime.getMonth() + 1).padStart(2, "0");
  const d = String(minTime.getDate()).padStart(2, "0");
  const h = String(minTime.getHours()).padStart(2, "0");
  const mi = String(minTime.getMinutes()).padStart(2, "0");
  return `${y}-${mo}-${d}T${h}:${mi}`;
}

export default function BookingPage() {
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    emailId: "",
    pickupDatetime: "",
    service: SERVICES[0],
    car: CARS[0],
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");

    if (!/^[6-9]\d{9}$/.test(form.mobile)) {
      setStatus("error");
      setMessage("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    const minPickup = getMinPickupIST();
    if (form.pickupDatetime < minPickup) {
      setStatus("error");
      setMessage("Pickup must be at least 2 hours from now (IST).");
      return;
    }

    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        setStatus("success");
        setMessage(`Booking #${data.bookingId} received. Booking will be confirmed in next 1 hour.`);
        setForm({ name: "", mobile: "", emailId: "", pickupDatetime: "", service: SERVICES[0], car: CARS[0] });
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  const CONTACT_NUMBERS = ["8779300154", "9029000340"];

  return (
    <main className="min-h-svh bg-cover bg-center bg-no-repeat flex items-center justify-center px-4 py-2 sm:p-4" style={{ backgroundImage: "url('/bg.png')" }}>
      <div className="w-full max-w-5xl flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col lg:flex-row items-center lg:items-stretch gap-4 sm:gap-6">
        {/* Booking Form */}
        <div className="w-full lg:w-1/2 max-w-md bg-white rounded-2xl shadow-lg p-4 sm:p-8">
          <div className="flex flex-col items-center mb-1 sm:mb-4">
            <Image
              src="/logo.png"
              alt="Logo"
              width={80}
              height={80}
              className="w-24 h-14 sm:w-40 sm:h-25 object-contain"
              priority
            />
          </div>
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900 text-center mb-0.5">
            Book Your Ride
          </h1>
          <p className="text-gray-500 text-center mb-2 sm:mb-6 text-xs sm:text-sm">
            Fill in the details below to request a cab
          </p>

          <form onSubmit={handleSubmit} className="space-y-1.5 sm:space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="Your full name"
                className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-sm sm:text-base"
              />
            </div>

            <div>
              <label htmlFor="mobile" className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">
                Mobile Number
              </label>
              <input
                id="mobile"
                name="mobile"
                type="tel"
                required
                value={form.mobile}
                onChange={handleChange}
                placeholder="10-digit number"
                pattern="[6-9][0-9]{9}"
                title="Please enter a valid 10-digit Indian mobile number (starts with 6-9)"
                className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-sm sm:text-base"
              />
            </div>

            <div>
              <label htmlFor="emailId" className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">
                Email ID
              </label>
              <input
                id="emailId"
                name="emailId"
                type="email"
                required
                value={form.emailId}
                onChange={handleChange}
                placeholder="your@email.com"
                className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-sm sm:text-base"
              />
            </div>

            <div>
              <label htmlFor="pickupDatetime" className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">
                Pickup Date & Time
              </label>
              <input
                id="pickupDatetime"
                name="pickupDatetime"
                type="datetime-local"
                required
                min={getMinPickupIST()}
                value={form.pickupDatetime}
                onChange={handleChange}
                className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-sm sm:text-base"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <label htmlFor="service" className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">
                  Service
                </label>
                <select
                  id="service"
                  name="service"
                  value={form.service}
                  onChange={handleChange}
                  className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white text-sm sm:text-base"
                >
                  {SERVICES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="car" className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">
                  Car
                </label>
                <select
                  id="car"
                  name="car"
                  value={form.car}
                  onChange={handleChange}
                  className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white text-sm sm:text-base"
                >
                  {CARS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full py-2 sm:py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {status === "loading" ? "Submitting..." : "Book Now"}
            </button>
          </form>

          {status === "success" && (
            <div className="mt-2 sm:mt-4 p-2 sm:p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs sm:text-sm text-center">
              {message}
            </div>
          )}
          {status === "error" && (
            <div className="mt-2 sm:mt-4 p-2 sm:p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs sm:text-sm text-center">
              {message}
            </div>
          )}
        </div>

        {/* Service Cards */}
        <div className="w-full lg:w-1/2 max-w-md lg:max-w-none flex flex-col justify-between gap-1.5 sm:gap-2">
          {SERVICE_CARDS.map((card) => (
            <div key={card.title} className="flex flex-1 items-center bg-white/90 backdrop-blur-sm rounded-2xl shadow-md overflow-hidden">
              <div className="w-2/5 flex-shrink-0 h-full">
                <Image
                  src={card.image}
                  alt={card.title}
                  width={300}
                  height={200}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-3/5 p-3 sm:p-4">
                <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-tight">{card.title}</h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
        </div>

        {/* Contact Us */}
        <div className="w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-md px-4 py-3 sm:px-6 sm:py-4">
          <h2 className="text-sm sm:text-base font-bold text-gray-900 text-center mb-2 sm:mb-3">Contact Us</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6">
            {CONTACT_NUMBERS.map((num) => (
              <div key={num} className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-medium text-gray-800">{num}</span>
                <a
                  href={`tel:+91${num}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.2 2.2z"/></svg>
                  Call
                </a>
                <a
                  href={`https://wa.me/91${num}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.05 21.785h-.01a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374A9.86 9.86 0 012.15 12.01C2.15 6.558 6.587 2.12 12.05 2.12c2.647 0 5.137 1.033 7.007 2.908a9.856 9.856 0 012.9 7.01c-.003 5.45-4.437 9.884-9.886 9.884l-.02-.137zm8.413-18.274A11.815 11.815 0 0012.05.12C5.495.12.16 5.454.157 12.01a11.84 11.84 0 001.583 5.93L0 24l6.233-1.633a11.867 11.867 0 005.81 1.502h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.478-8.465z"/></svg>
                  WhatsApp
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
