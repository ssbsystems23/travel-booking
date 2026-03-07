"use client";

import { useState, FormEvent, useEffect } from "react";
import Image from "next/image";

const SERVICES = ["Pharma/Corporate", "Vipassana", "Airport", "Outstation"];
const CARS = ["Innova Crysta", "Ertiga", "Swift Dzire"];

const MUMBAI_LOCATIONS = [
  "Dadar", "Andheri", "Bandra", "BKC", "Lower Parel", "Thane", "Navi Mumbai",
  "Borivali", "Churchgate", "CST", "Powai", "Goregaon", "Malad", "Worli",
  "Juhu", "Kurla", "Ghatkopar", "Mulund", "Panvel",
];
const AIRPORT_OPTIONS = ["Mumbai Airport - Terminal 1", "Mumbai Airport - Terminal 2"];
const VIPASSANA_LOCATION = "Igatpuri Vipassana Centre";

function getLocationSuggestions(service: string): string[] {
  switch (service) {
    case "Airport":
      return [...MUMBAI_LOCATIONS, ...AIRPORT_OPTIONS];
    case "Vipassana":
      return [...MUMBAI_LOCATIONS, VIPASSANA_LOCATION];
    case "Outstation":
      return [];
    default:
      return MUMBAI_LOCATIONS;
  }
}

const SERVICE_CARDS = [
  { image: "/card1.png", title: "Vipassana Pagoda Service", desc: "Special ride to Vipassana Golden Pagoda", alt: "Vipassana Pagoda taxi service Mumbai - Sri Hanumanth Tours and Travels" },
  { image: "/card2.png", title: "Airport Pickup & Drop", desc: "Timely service to and from the airport", alt: "Airport pickup and drop cab service Mumbai" },
  { image: "/card3.png", title: "Outstation Tours", desc: "Comfortable rides out of town", alt: "Outstation cab rental from Mumbai - Sri Hanumanth Tours and Travels" },
  { image: "/card4.png", title: "Innova Crysta / Ertiga / Swift Dzire", desc: "Choose from our diverse car fleet", alt: "Innova Crysta Ertiga Swift Dzire car rental Mumbai" },
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
    pickupLocation: "",
    dropLocation: "",
    service: SERVICES[0],
    car: CARS[0],
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [showPhoneMenu, setShowPhoneMenu] = useState(false);
  const [showWhatsAppMenu, setShowWhatsAppMenu] = useState(false);

  // Testimonial form state
  const [testimonialName, setTestimonialName] = useState("");
  const [testimonialRating, setTestimonialRating] = useState(0);
  const [testimonialComment, setTestimonialComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const [testimonialStatus, setTestimonialStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [testimonialMsg, setTestimonialMsg] = useState("");
  const [testimonials, setTestimonials] = useState<{ id: number; name: string; rating: number; comment: string; created_at: string }[]>([]);

  useEffect(() => {
    fetch("/api/testimonials")
      .then((res) => res.json())
      .then((data) => { if (data.success) setTestimonials(data.testimonials); })
      .catch(() => {});
  }, []);

  async function handleTestimonialSubmit(e: FormEvent) {
    e.preventDefault();
    if (testimonialRating === 0) {
      setTestimonialStatus("error");
      setTestimonialMsg("Please select a star rating.");
      return;
    }
    setTestimonialStatus("loading");
    setTestimonialMsg("");
    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: testimonialName, rating: testimonialRating, comment: testimonialComment }),
      });
      const data = await res.json();
      if (data.success) {
        setTestimonialStatus("success");
        setTestimonialMsg("Thank you for your review!");
        const newEntry = { id: data.testimonialId, name: testimonialName, rating: testimonialRating, comment: testimonialComment, created_at: new Date().toISOString() };
        setTestimonials((prev) => [newEntry, ...prev]);
        setTestimonialName("");
        setTestimonialRating(0);
        setTestimonialComment("");
      } else {
        setTestimonialStatus("error");
        setTestimonialMsg(data.error || "Something went wrong.");
      }
    } catch {
      setTestimonialStatus("error");
      setTestimonialMsg("Network error. Please try again.");
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    if (name === "service") {
      setForm({ ...form, service: value, pickupLocation: "", dropLocation: "" });
    } else {
      setForm({ ...form, [name]: value });
    }
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

    if (!form.pickupLocation.trim() || !form.dropLocation.trim()) {
      setStatus("error");
      setMessage("Both pickup and drop locations are required.");
      return;
    }

    if (form.service === "Airport") {
      const hasAirport = AIRPORT_OPTIONS.includes(form.pickupLocation) || AIRPORT_OPTIONS.includes(form.dropLocation);
      if (!hasAirport) {
        setStatus("error");
        setMessage("For Airport service, either pickup or drop must be an airport terminal.");
        return;
      }
    }

    if (form.service === "Vipassana") {
      const hasVipassana = form.pickupLocation === VIPASSANA_LOCATION || form.dropLocation === VIPASSANA_LOCATION;
      if (!hasVipassana) {
        setStatus("error");
        setMessage("For Vipassana service, either pickup or drop must be \"Igatpuri Vipassana Centre\".");
        return;
      }
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
        setForm({ name: "", mobile: "", emailId: "", pickupDatetime: "", pickupLocation: "", dropLocation: "", service: SERVICES[0], car: CARS[0] });
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
    <main className="min-h-svh bg-cover bg-center bg-no-repeat flex items-center justify-center px-4 py-2 sm:p-4 pb-16" style={{ backgroundImage: "url('/bg.png')" }}>
      <div className="w-full max-w-5xl flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col lg:flex-row items-center lg:items-stretch gap-4 sm:gap-6">
        {/* Booking Form */}
        <div className="w-full lg:w-1/2 max-w-md bg-white rounded-2xl shadow-lg p-4 sm:p-8">
          <div className="flex flex-col items-center mb-1 sm:mb-4">
            <Image
              src="/logo.png"
              alt="Sri Hanumanth Tours and Travels - Taxi Service in Mumbai"
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

            <div>
              <label htmlFor="pickupLocation" className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">
                Pickup Location
              </label>
              <input
                id="pickupLocation"
                name="pickupLocation"
                type="text"
                required
                value={form.pickupLocation}
                onChange={handleChange}
                placeholder="Enter pickup location"
                list={form.service !== "Outstation" ? "locationSuggestions" : undefined}
                className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-sm sm:text-base"
              />
            </div>

            <div>
              <label htmlFor="dropLocation" className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">
                Drop Location
              </label>
              <input
                id="dropLocation"
                name="dropLocation"
                type="text"
                required
                value={form.dropLocation}
                onChange={handleChange}
                placeholder="Enter drop location"
                list={form.service !== "Outstation" ? "locationSuggestions" : undefined}
                className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-sm sm:text-base"
              />
            </div>

            {form.service !== "Outstation" && (
              <datalist id="locationSuggestions">
                {getLocationSuggestions(form.service).map((loc) => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>
            )}

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
                  alt={card.alt}
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

        {/* About Us */}
        <div className="w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-md px-4 py-3 sm:px-6 sm:py-4">
          <h2 className="text-sm sm:text-base font-bold text-gray-900 text-center mb-2 sm:mb-3">About Sri Hanumanth Tours and Travels</h2>
          <p className="text-xs sm:text-sm text-gray-600 text-center mb-3 sm:mb-4 max-w-2xl mx-auto leading-relaxed">
            A trusted cab service in Mumbai with years of experience in corporate, airport, and outstation travel. We are committed to providing safe, reliable, and comfortable rides at affordable prices.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 max-w-2xl mx-auto">
            {[
              "24/7 Availability",
              "Experienced & Verified Drivers",
              "Well-Maintained Fleet",
              "Airport & Outstation Specialists",
              "Vipassana Pagoda Service",
              "Affordable & Transparent Pricing",
            ].map((item) => (
              <div key={item} className="bg-blue-50 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-center">
                <span className="text-xs sm:text-sm font-semibold text-gray-800">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Leave a Review */}
        <div className="w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-md px-4 py-3 sm:px-6 sm:py-4">
          <h2 className="text-sm sm:text-base font-bold text-gray-900 text-center mb-2 sm:mb-3">Leave a Review</h2>
          <form onSubmit={handleTestimonialSubmit} className="space-y-2 sm:space-y-3 max-w-xl mx-auto">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">
                Your Rating
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    aria-label={`Rate ${star} out of 5`}
                    onClick={() => setTestimonialRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="text-2xl sm:text-3xl focus:outline-none transition-colors leading-none"
                  >
                    <span className={(hoverRating || testimonialRating) >= star ? "text-yellow-400" : "text-gray-300"}>
                      ★
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="testimonialName" className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">
                Name
              </label>
              <input
                id="testimonialName"
                type="text"
                required
                value={testimonialName}
                onChange={(e) => setTestimonialName(e.target.value)}
                placeholder="Your name"
                className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-sm sm:text-base"
              />
            </div>

            <div>
              <label htmlFor="testimonialComment" className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">
                Your Experience
              </label>
              <textarea
                id="testimonialComment"
                required
                value={testimonialComment}
                onChange={(e) => setTestimonialComment(e.target.value)}
                placeholder="Share your experience (min. 10 characters)"
                rows={3}
                className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-sm sm:text-base resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={testimonialStatus === "loading"}
              className="w-full py-2 sm:py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {testimonialStatus === "loading" ? "Submitting..." : "Submit Review"}
            </button>
          </form>

          {testimonialStatus === "success" && (
            <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs sm:text-sm text-center max-w-xl mx-auto">
              {testimonialMsg}
            </div>
          )}
          {testimonialStatus === "error" && (
            <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs sm:text-sm text-center max-w-xl mx-auto">
              {testimonialMsg}
            </div>
          )}
        </div>

        {/* Customer Testimonials */}
        {testimonials.length > 0 && (
          <div className="w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-md px-4 py-3 sm:px-6 sm:py-4">
            <h2 className="text-sm sm:text-base font-bold text-gray-900 text-center mb-2 sm:mb-3">What Our Customers Say</h2>
            <div className="flex flex-col gap-2 sm:gap-3">
              {testimonials.map((t) => (
                <div key={t.id} className="border border-gray-100 rounded-xl px-4 py-3 bg-white">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 text-sm">{t.name}</span>
                    <span className="flex gap-0.5 text-base leading-none">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={star <= t.rating ? "text-yellow-400" : "text-gray-300"}>★</span>
                      ))}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {new Date(t.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{t.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Phone Button */}
      <div className="fixed bottom-4 left-4 z-50">
        {showPhoneMenu && (
          <div className="absolute bottom-14 left-0 bg-white rounded-xl shadow-lg p-3 min-w-[180px]">
            <p className="text-xs font-semibold text-gray-500 mb-2">Call Us</p>
            {CONTACT_NUMBERS.map((num) => (
              <a key={num} href={`tel:+91${num}`} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium text-gray-800">
                <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.2 2.2z"/></svg>
                {num}
              </a>
            ))}
          </div>
        )}
        <button
          onClick={() => { setShowPhoneMenu((v) => !v); setShowWhatsAppMenu(false); }}
          className="w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 active:bg-blue-800 transition-colors"
          aria-label="Call us"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.2 2.2z"/></svg>
        </button>
      </div>

      {/* Floating WhatsApp Button */}
      <div className="fixed bottom-4 right-4 z-50">
        {showWhatsAppMenu && (
          <div className="absolute bottom-14 right-0 bg-white rounded-xl shadow-lg p-3 min-w-[180px]">
            <p className="text-xs font-semibold text-gray-500 mb-2">WhatsApp Us</p>
            {CONTACT_NUMBERS.map((num) => (
              <a key={num} href={`https://wa.me/91${num}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium text-gray-800">
                <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.05 21.785h-.01a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374A9.86 9.86 0 012.15 12.01C2.15 6.558 6.587 2.12 12.05 2.12c2.647 0 5.137 1.033 7.007 2.908a9.856 9.856 0 012.9 7.01c-.003 5.45-4.437 9.884-9.886 9.884l-.02-.137zm8.413-18.274A11.815 11.815 0 0012.05.12C5.495.12.16 5.454.157 12.01a11.84 11.84 0 001.583 5.93L0 24l6.233-1.633a11.867 11.867 0 005.81 1.502h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.478-8.465z"/></svg>
                {num}
              </a>
            ))}
          </div>
        )}
        <button
          onClick={() => { setShowWhatsAppMenu((v) => !v); setShowPhoneMenu(false); }}
          className="w-12 h-12 bg-green-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-green-600 active:bg-green-700 transition-colors"
          aria-label="WhatsApp us"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.05 21.785h-.01a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374A9.86 9.86 0 012.15 12.01C2.15 6.558 6.587 2.12 12.05 2.12c2.647 0 5.137 1.033 7.007 2.908a9.856 9.856 0 012.9 7.01c-.003 5.45-4.437 9.884-9.886 9.884l-.02-.137zm8.413-18.274A11.815 11.815 0 0012.05.12C5.495.12.16 5.454.157 12.01a11.84 11.84 0 001.583 5.93L0 24l6.233-1.633a11.867 11.867 0 005.81 1.502h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.478-8.465z"/></svg>
        </button>
      </div>
    </main>
  );
}
