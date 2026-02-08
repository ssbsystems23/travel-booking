"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";

const SERVICES = ["Pharma/Corporate", "Vipassana", "Airport", "Outstation"];
const CARS = ["Innova Crysta", "Ertiga", "Swift Dzire"];

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
        setForm({ name: "", mobile: "", pickupDatetime: "", service: SERVICES[0], car: CARS[0] });
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <main className="min-h-svh bg-cover bg-center bg-no-repeat flex items-center justify-center px-4 py-6 sm:p-4" style={{ backgroundImage: "url('/bg.png')" }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-5 sm:p-8">
        <div className="flex flex-col items-center mb-4">
          <Image
            src="/logo.png"
            alt="Logo"
            width={80}
            height={80}
            className="w-40 h-25 sm:w-40 sm:h-25 object-contain"
            priority
          />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-1">
          Book Your Ride
        </h1>
        <p className="text-gray-500 text-center mb-5 sm:mb-6 text-sm">
          Fill in the details below to request a cab
        </p>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
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
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base"
            />
          </div>

          <div>
            <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">
              Mobile Number
            </label>
            <input
              id="mobile"
              name="mobile"
              type="tel"
              required
              value={form.mobile}
              onChange={handleChange}
              placeholder="10-digit mobile number"
              pattern="[6-9][0-9]{9}"
              title="Please enter a valid 10-digit Indian mobile number (starts with 6-9)"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base"
            />
          </div>

          <div>
            <label htmlFor="pickupDatetime" className="block text-sm font-medium text-gray-700 mb-1">
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
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-1">
                Service
              </label>
              <select
                id="service"
                name="service"
                value={form.service}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white text-base"
              >
                {SERVICES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="car" className="block text-sm font-medium text-gray-700 mb-1">
                Car
              </label>
              <select
                id="car"
                name="car"
                value={form.car}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white text-base"
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
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
          >
            {status === "loading" ? "Submitting..." : "Book Now"}
          </button>
        </form>

        {status === "success" && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm text-center">
            {message}
          </div>
        )}
        {status === "error" && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm text-center">
            {message}
          </div>
        )}
      </div>
    </main>
  );
}
