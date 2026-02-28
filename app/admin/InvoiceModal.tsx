"use client";

import { useState, useEffect } from "react";

type Booking = {
  id: number;
  name: string;
  mobile: string;
  email_id: string;
  pickup_datetime: string;
  service: string;
  car: string;
  status: string;
};

type Props = {
  booking?: Booking | null;
  onClose: () => void;
};

type BillTemplate = {
  dataUrl: string;   // full-page PNG of bill.pdf at 3x
  widthPt: number;   // page width in PDF points
  heightPt: number;  // page height in PDF points
};

function parsePickupDatetime(dt: string) {
  try {
    const d = new Date(dt);
    const date = d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
    const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    return { date, time };
  } catch {
    return { date: "", time: "" };
  }
}

export default function InvoiceModal({ booking, onClose }: Props) {
  const { date: pickupDate, time: pickupTime } = booking
    ? parsePickupDatetime(booking.pickup_datetime)
    : { date: "", time: "" };
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });

  const [form, setForm] = useState({
    msName: booking?.name ?? "",
    billDate: today,
    driverName: "",
    carNo: booking?.car ?? "",
    pickupArea: "",
    pickupTime,
    pickupDate,
    dropArea: "",
    dropTime: "",
    dropDate: "",
    garageKmStart: "",
    garageKmEnd: "",
    startHours: "",
    endHours: "",
    totalHours: "",
    extraKm: "",
    extraHours: "",
    totalKm: "",
    rate: "",
    drivalAllowance: "",
    airportParking: "",
    toll: "",
    totalAmount: "",
  });

  const [phase, setPhase] = useState<"form" | "generating" | "done">("form");
  const [billNo, setBillNo] = useState<number>(0);
  const [error, setError] = useState("");
  const [billTemplate, setBillTemplate] = useState<BillTemplate | null>(null);

  // ── Load full bill.pdf as background image on mount ──
  useEffect(() => {
    let cancelled = false;
    async function loadTemplate() {
      try {
        const pdfjsLib = await import(/* webpackIgnore: true */ "/pdf.min.mjs");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const pdf = await pdfjsLib.getDocument("/bill.pdf").promise;
        const page = await pdf.getPage(1);

        // Exact dimensions in PDF points (72 DPI)
        const vp1 = page.getViewport({ scale: 1 });

        // Render at 3× for crisp output
        const viewport = page.getViewport({ scale: 3 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;

        if (!cancelled) {
          setBillTemplate({
            dataUrl: canvas.toDataURL("image/png"),
            widthPt: vp1.width,
            heightPt: vp1.height,
          });
        }
      } catch (e) {
        console.error("Failed to load bill.pdf template:", e);
      }
    }
    loadTemplate();
    return () => { cancelled = true; };
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleGeneratePdf() {
    if (!billTemplate) {
      setError("Bill template is still loading. Please wait a moment.");
      return;
    }
    setError("");
    setPhase("generating");

    try {
      // 1. Save invoice to DB → get auto-incremented Bill No.
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking?.id ?? null, ...form }),
      });
      const resData = await res.json();
      if (!resData.success) {
        setError(resData.error || "Failed to save invoice.");
        setPhase("form");
        return;
      }
      const invoiceId: number = resData.invoiceId;
      setBillNo(invoiceId);

      // 2. Build PDF: bill.pdf as background + overlay form values
      const { jsPDF } = await import("jspdf");
      const { widthPt: W, heightPt: H, dataUrl } = billTemplate;

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: [W, H],
      });

      // Full-page background (the original bill design)
      doc.addImage(dataUrl, "PNG", 0, 0, W, H);

      // ── Overlay text at the positions of the dashes ──
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);

      // Helper: place text at absolute pt position on the page
      const put = (value: string, xPt: number, yPt: number, opts?: { bold?: boolean; size?: number; right?: boolean }) => {
        if (!value) return;
        if (opts?.size) doc.setFontSize(opts.size);
        if (opts?.bold) doc.setFont("helvetica", "bold");
        if (opts?.right) {
          doc.text(value, xPt, yPt, { align: "right" });
        } else {
          doc.text(value, xPt, yPt);
        }
        // Reset
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
      };

      // ── Coordinates calibrated to bill.pdf (A4 ≈ 595 × 842 pt) ──
      // Row heights measured from reference template dash lines

      // Top section (above table)
      // put(form.msName,       68,  185);                            // M/s ___________
      // put(String(invoiceId), 565, 185, { bold: true });            // Bill No.: ___
      // put(form.billDate,     510, 210);                            // Date : __ / __ /

      // // Table rows — values placed on the dash lines after each label
      // put(form.driverName,    135, 260);                           // Driver Name: ___
      // put(form.carNo,         100, 286);                           // Car No.: ___
      // // Local (8h x 80km) — row left blank
      // // Out Station — row left blank

      // put(form.pickupArea,    110, 378);                           // Pick Up : ___
      //                                                              // (Area Name)

      // put(form.pickupTime,    100, 418);                           // Time : ___
      // put(form.pickupDate,    310, 418);                           // Date : ___

      // put(form.dropArea,      100, 448);                           // Drop : ___
      //                                                              // (Area Name)

      // put(form.dropTime,      100, 490);                           // Time : ___
      // put(form.dropDate,      310, 490);                           // Date : ___

      // put(form.garageKmStart, 175, 518);                           // Garrage K.M. Start ___
      // put(form.garageKmEnd,   490, 518);                           // Garrage K.M. End ___

      // put(form.startHours,    115, 544);                           // Star Hours : ___
      // put(form.endHours,      295, 544);                           // To End Hours: ___
      // put(form.totalHours,    445, 544);                           // Total Hours: ___

      // put(form.extraKm,       145, 572);                           // Extra K.M. ___
      // put(form.extraHours,    380, 572);                           // Extra Hours ___

      // put(form.totalKm,       145, 598);                           // Total K.M. ___
      // put(form.rate,          340, 598);                           // Rate ___

      // put(form.drivalAllowance, 175, 624);                        // Drival Allowance : ___
      // put(form.airportParking,  190, 650);                        // Airport & Parking : ___
      // put(form.toll,            80, 676);                          // Toll : ___

      // // ── TOTAL (AMOUNT column, right-aligned) ──
      // put(form.totalAmount,   555, 702, { bold: true, size: 12, right: true });

      // ── Coordinates calibrated from bill-calibrated.pdf grid overlay ──

      // M/s ___ (y≈207)
      put(form.msName, 45, 210, {bold: true});
      // Bill No.: ___ (top-right, y≈207)
      put(String(invoiceId), 525, 207, { bold: true });
      // Date : __ / __ / (y≈237) — cover the "/ /" slashes from the template
      doc.setFillColor(255, 255, 255);
      doc.rect(490, 226, 80, 16, "F");
      put(form.billDate, 500, 237, {bold: true});

      // Driver Name: ___ (y≈300)
      put(form.driverName, 115, 293, {bold: true});
      // Car No.: ___ (y≈325)
      put(form.carNo, 82, 318, {bold: true});

      // Pick Up : ___ (Area Name) (y≈415)
      put(form.pickupArea, 95, 415, {bold: true});
      // Time : ___  Date : ___ (y≈462)
      put(form.pickupTime, 75, 462, {bold: true});
      put(form.pickupDate, 260, 462, {bold: true});

      // Drop : ___ (Area Name) (y≈492)
      put(form.dropArea, 75, 492, {bold: true});
      // Time : ___  Date : ___ (y≈537)
      put(form.dropTime, 90, 537, {bold: true});
      put(form.dropDate, 260, 537, {bold: true});

      // Garrage K.M. Start ___  To ___  Garrage K.M. End ___ (y≈562)
      put(form.garageKmStart, 145, 562, {bold: true});
      put(form.garageKmEnd, 465, 562, {bold: true});

      // Star Hours : ___  To End Hours: ___  Total Hours: ___ (y≈587)
      put(form.startHours, 100, 587, {bold: true});
      put(form.endHours, 255, 587, {bold: true});
      put(form.totalHours, 385, 587, {bold: true});

      // Extra K.M. ___  Extra Hours ___ (y≈612)
      put(form.extraKm, 100, 612, {bold: true});
      put(form.extraHours, 325, 612, {bold: true});

      // Total K.M. ___  Rate ___ (y≈637)
      put(form.totalKm, 100, 637, {bold: true});
      put(form.rate, 265, 637, {bold: true});

      // Drival Allowance : ___ (y≈662)
      put(form.drivalAllowance, 155, 662, {bold: true});
      // Airport & Parking : ___ (y≈687)
      put(form.airportParking, 155, 687, {bold: true});
      // Toll : ___ (y≈712)
      put(form.toll, 65, 712, {bold: true});

      // TOTAL (right-aligned in AMOUNT column, y≈747)
      put(form.totalAmount, 495, 735, { bold: true, size: 14, right: true });


      doc.save(`invoice-${invoiceId}.pdf`);
      setPhase("done");
    } catch (err) {
      console.error("PDF generation error:", err);
      setError("Failed to generate PDF. Please try again.");
      setPhase("form");
    }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "20px" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Generate Invoice</h2>
            <p className="text-sm text-gray-500">
              {booking ? `Booking #${booking.id} — ${booking.name}` : "Standalone Invoice"}
              {billTemplate ? "" : " (loading template...)"}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        {phase === "done" ? (
          <div className="px-6 py-10 text-center">
            <div className="text-green-500 text-5xl mb-4">✓</div>
            <p className="text-xl font-bold text-green-700 mb-2">Invoice Downloaded!</p>
            <p className="text-gray-500 text-sm mb-6">Invoice #{billNo} saved and downloaded.</p>
            <button onClick={onClose} className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-sm">
              Close
            </button>
          </div>
        ) : (
          <div className="px-6 py-5">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">M/s (Customer Name)</label>
                <input name="msName" value={form.msName} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Bill Date</label>
                <input name="billDate" value={form.billDate} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Driver Name</label>
                <input name="driverName" value={form.driverName} onChange={handleChange} placeholder="Driver's full name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Car No.</label>
                <input name="carNo" value={form.carNo} onChange={handleChange} placeholder="MH-04-XX-0000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Pick Up Area</label>
                <input name="pickupArea" value={form.pickupArea} onChange={handleChange} placeholder="Pickup area name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Pick Up Time</label>
                <input name="pickupTime" value={form.pickupTime} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Pick Up Date</label>
                <input name="pickupDate" value={form.pickupDate} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Drop Area</label>
                <input name="dropArea" value={form.dropArea} onChange={handleChange} placeholder="Drop area name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Drop Time</label>
                <input name="dropTime" value={form.dropTime} onChange={handleChange} placeholder="e.g. 06:00 PM"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Drop Date</label>
                <input name="dropDate" value={form.dropDate} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Garage KM Start</label>
                <input name="garageKmStart" value={form.garageKmStart} onChange={handleChange} placeholder="e.g. 12000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Garage KM End</label>
                <input name="garageKmEnd" value={form.garageKmEnd} onChange={handleChange} placeholder="e.g. 12350"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Start Hours</label>
                <input name="startHours" value={form.startHours} onChange={handleChange} placeholder="e.g. 08:00 AM"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">End Hours</label>
                <input name="endHours" value={form.endHours} onChange={handleChange} placeholder="e.g. 04:00 PM"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Total Hours</label>
                <input name="totalHours" value={form.totalHours} onChange={handleChange} placeholder="e.g. 8"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Extra K.M.</label>
                <input name="extraKm" value={form.extraKm} onChange={handleChange} placeholder="e.g. 50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Extra Hours</label>
                <input name="extraHours" value={form.extraHours} onChange={handleChange} placeholder="e.g. 2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Total K.M.</label>
                <input name="totalKm" value={form.totalKm} onChange={handleChange} placeholder="e.g. 350"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Rate (per km)</label>
                <input name="rate" value={form.rate} onChange={handleChange} placeholder="e.g. 14"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Drival Allowance</label>
                <input name="drivalAllowance" value={form.drivalAllowance} onChange={handleChange} placeholder="e.g. 250"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Airport &amp; Parking</label>
                <input name="airportParking" value={form.airportParking} onChange={handleChange} placeholder="e.g. 100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Toll</label>
                <input name="toll" value={form.toll} onChange={handleChange} placeholder="e.g. 80"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Total Amount</label>
                <input name="totalAmount" value={form.totalAmount} onChange={handleChange} placeholder="e.g. 5500"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleGeneratePdf}
                disabled={phase === "generating" || !billTemplate}
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {phase === "generating" ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Generating...
                  </>
                ) : "Generate PDF"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
