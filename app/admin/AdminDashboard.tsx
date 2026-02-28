"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import InvoiceModal from "./InvoiceModal";

type Testimonial = {
  id: number;
  name: string;
  rating: number;
  comment: string;
  created_at: string;
};

type Booking = {
  id: number;
  name: string;
  mobile: string;
  email_id: string;
  pickup_datetime: string;
  service: string;
  car: string;
  status: string;
  created_at: string;
};

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= rating ? "text-yellow-400" : "text-gray-300"}>
          ★
        </span>
      ))}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] ?? "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}

export default function AdminDashboard({
  testimonials: initialTestimonials,
  bookings,
}: {
  testimonials: Testimonial[];
  bookings: Booking[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"bookings" | "testimonials">("bookings");
  const [testimonials, setTestimonials] = useState<Testimonial[]>(initialTestimonials);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [modalBooking, setModalBooking] = useState<Booking | null>(null);
  const [showStandaloneInvoice, setShowStandaloneInvoice] = useState(false);

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/testimonials/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setTestimonials((prev) => prev.filter((t) => t.id !== id));
      } else {
        alert(data.error || "Failed to delete.");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatPickup(dt: string) {
    try {
      const d = new Date(dt);
      return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return dt;
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowStandaloneInvoice(true)}
              className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              Generate Invoice
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="max-w-5xl mx-auto px-4 flex gap-0 border-t border-gray-200">
          <button
            onClick={() => setActiveTab("bookings")}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "bookings"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab("testimonials")}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "testimonials"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            Testimonials ({testimonials.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* ── Bookings Tab ── */}
        {activeTab === "bookings" && (
          bookings.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-500">
              No bookings yet.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-gray-500">{bookings.length} booking{bookings.length !== 1 ? "s" : ""}</p>
              {bookings.map((b) => (
                <div key={b.id} className="bg-white rounded-2xl shadow-sm px-5 py-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-gray-900">#{b.id} — {b.name}</span>
                        <StatusBadge status={b.status} />
                        <span className="text-xs text-gray-400 ml-auto">{formatDate(b.created_at)}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-0.5 text-xs text-gray-600 mt-1">
                        <span><span className="font-medium">Mobile:</span> {b.mobile}</span>
                        <span><span className="font-medium">Service:</span> {b.service}</span>
                        <span><span className="font-medium">Car:</span> {b.car}</span>
                        <span><span className="font-medium">Pickup:</span> {formatPickup(b.pickup_datetime)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setModalBooking(b)}
                      className="flex-shrink-0 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                      Generate Invoice
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── Testimonials Tab ── */}
        {activeTab === "testimonials" && (
          testimonials.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-500">
              No testimonials yet.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-gray-500">{testimonials.length} testimonial{testimonials.length !== 1 ? "s" : ""}</p>
              {testimonials.map((t) => (
                <div key={t.id} className="bg-white rounded-2xl shadow-sm px-5 py-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">{t.name}</span>
                      <StarDisplay rating={t.rating} />
                      <span className="text-xs text-gray-400 ml-auto">{formatDate(t.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{t.comment}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(t.id)}
                    disabled={deletingId === t.id}
                    className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingId === t.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Invoice Modal (from booking) */}
      {modalBooking && (
        <InvoiceModal
          booking={modalBooking}
          onClose={() => setModalBooking(null)}
        />
      )}

      {/* Standalone Invoice Modal */}
      {showStandaloneInvoice && (
        <InvoiceModal
          onClose={() => setShowStandaloneInvoice(false)}
        />
      )}
    </div>
  );
}
