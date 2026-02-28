"use client";

import { forwardRef } from "react";

export type InvoiceData = {
  billNo: number;
  headerUrl?: string;   // base64 PNG of the exact bill header, extracted from bill.pdf
  msName: string;
  billDate: string;
  driverName: string;
  carNo: string;
  pickupArea: string;
  pickupTime: string;
  pickupDate: string;
  dropArea: string;
  dropTime: string;
  dropDate: string;
  garageKmStart: string;
  garageKmEnd: string;
  startHours: string;
  endHours: string;
  totalHours: string;
  extraKm: string;
  extraHours: string;
  totalKm: string;
  rate: string;
  drivalAllowance: string;
  airportParking: string;
  toll: string;
  totalAmount: string;
};

// A single label + value field — no underlines, just label text and value text
function Field({
  label,
  value,
  flex = 1,
  minWidth,
}: {
  label: string;
  value: string;
  flex?: number;
  minWidth?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", flex, minWidth }}>
      <span style={{ fontWeight: "bold", whiteSpace: "nowrap", paddingRight: "6px", lineHeight: "1.5" }}>
        {label}
      </span>
      <span style={{ lineHeight: "1.5", fontSize: "13px" }}>
        {value}
      </span>
    </div>
  );
}

const InvoiceBill = forwardRef<HTMLDivElement, { data: InvoiceData }>(({ data }, ref) => {
  const cell: React.CSSProperties = {
    border: "1px solid #000",
    padding: "6px 10px",
    verticalAlign: "middle",
    fontSize: "13px",
  };
  const cellAmt: React.CSSProperties = {
    border: "1px solid #000",
    padding: "6px 10px",
    verticalAlign: "middle",
    fontSize: "13px",
    textAlign: "right",
    width: "18%",
  };

  return (
    <div
      ref={ref}
      style={{
        width: "794px",
        backgroundColor: "#fff",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "13px",
        color: "#000",
        boxSizing: "border-box",
      }}
    >
      {/* ── HEADER — use exact image cropped from bill.pdf, fallback to CSS ── */}
      {data.headerUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={data.headerUrl}
          alt="Hanumant Travels"
          style={{ width: "100%", display: "block" }}
        />
      ) : (
        <div
          style={{
            background: "linear-gradient(90deg, #e65000 0%, #f9a200 45%, #e65000 100%)",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            gap: "18px",
            minHeight: "110px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Logo" style={{ width: "80px", height: "80px", objectFit: "contain", flexShrink: 0 }} />
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: "36px", fontWeight: "bold", color: "#fff", fontFamily: "'Times New Roman', serif", textShadow: "1px 1px 3px rgba(0,0,0,0.5)", lineHeight: 1.1 }}>
              &#2358;&#2381;&#2352;&#2368; Hanumant Travels
            </div>
            <div style={{ fontSize: "15px", fontWeight: "bold", color: "#fff", marginTop: "4px", textShadow: "1px 1px 2px rgba(0,0,0,0.4)" }}>
              A/C All Types of Car &amp; Bus Rental
            </div>
            <div style={{ fontSize: "17px", fontWeight: "bold", color: "#fff", marginTop: "2px", textShadow: "1px 1px 2px rgba(0,0,0,0.4)" }}>
              Local &amp; Outstation
            </div>
          </div>
        </div>
      )}

      {/* ── ADDRESS ── */}
      <div style={{ textAlign: "center", padding: "8px 20px 6px", borderBottom: "2px solid #000" }}>
        <div style={{ fontWeight: "bold", fontSize: "13px" }}>
          Add - KRISHNA DHAM 6, STATION ROAD, MIRA ROAD (E) MUMBAI 401107.
        </div>
        <div style={{ fontWeight: "bold", fontSize: "13px", marginTop: "2px" }}>
          Email : vijaytiwariaachal@gmail.com &nbsp;|&nbsp; Mob No.: &#9990;&nbsp;8779300154 / 9029000340
        </div>
      </div>

      {/* ── M/s + BILL NO. ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", flex: 1, marginRight: "30px" }}>
          <span style={{ fontWeight: "bold", whiteSpace: "nowrap", paddingRight: "6px" }}>M/s</span>
          <span style={{ fontSize: "13px" }}>{data.msName}</span>
        </div>
        <div style={{ fontWeight: "bold", whiteSpace: "nowrap", fontSize: "14px" }}>
          Bill No.:&nbsp;{data.billNo}
        </div>
      </div>

      {/* ── DATE ── */}
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "2px 20px 6px" }}>
        <span style={{ fontWeight: "bold", whiteSpace: "nowrap", paddingRight: "6px" }}>Date :</span>
        <span style={{ fontSize: "13px" }}>{data.billDate}</span>
      </div>

      {/* ── MAIN TABLE ── */}
      <div style={{ padding: "0 20px 12px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #000" }}>
          <thead>
            <tr>
              <th style={{ border: "2px solid #000", padding: "6px 10px", textAlign: "center", fontWeight: "bold", fontSize: "17px", color: "#cc0000", backgroundColor: "#f9f9f9", width: "82%" }}>
                PARTICULAR
              </th>
              <th style={{ border: "2px solid #000", padding: "6px 10px", textAlign: "center", fontWeight: "bold", fontSize: "17px", color: "#cc0000", backgroundColor: "#f9f9f9", width: "18%" }}>
                AMOUNT
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Driver Name */}
            <tr>
              <td style={cell}>
                <Field label="Driver Name :" value={data.driverName} />
              </td>
              <td style={cellAmt}></td>
            </tr>

            {/* Car No. */}
            <tr>
              <td style={cell}>
                <Field label="Car No. :" value={data.carNo} />
              </td>
              <td style={cellAmt}></td>
            </tr>

            {/* Local */}
            <tr>
              <td style={cell}>
                <span style={{ fontWeight: "bold" }}>Local</span>
                <span style={{ fontSize: "11px", color: "#555", paddingLeft: "4px" }}>(8h x 80km)</span>
                <span style={{ fontWeight: "bold", paddingLeft: "4px" }}>:</span>
              </td>
              <td style={cellAmt}></td>
            </tr>

            {/* Out Station */}
            <tr>
              <td style={cell}>
                <div>
                  <span style={{ fontWeight: "bold" }}>Out Station :</span>
                  <div style={{ fontSize: "11px", color: "#555", marginTop: "2px" }}>(Minimum 300 kms Per Day)</div>
                </div>
              </td>
              <td style={cellAmt}></td>
            </tr>

            {/* Pick Up */}
            <tr>
              <td style={cell}>
                <Field label="Pick Up :" value={data.pickupArea} />
                <div style={{ fontSize: "11px", color: "#555", marginTop: "2px" }}>(Area Name)</div>
              </td>
              <td style={cellAmt}></td>
            </tr>

            {/* Pickup Time & Date */}
            <tr>
              <td style={cell}>
                <div style={{ display: "flex", gap: "20px", alignItems: "flex-end" }}>
                  <Field label="Time :" value={data.pickupTime} minWidth="180px" flex={0} />
                  <Field label="Date :" value={data.pickupDate} flex={1} />
                </div>
              </td>
              <td style={cellAmt}></td>
            </tr>

            {/* Drop */}
            <tr>
              <td style={cell}>
                <Field label="Drop :" value={data.dropArea} />
                <div style={{ fontSize: "11px", color: "#555", marginTop: "2px" }}>(Area Name)</div>
              </td>
              <td style={cellAmt}></td>
            </tr>

            {/* Drop Time & Date */}
            <tr>
              <td style={cell}>
                <div style={{ display: "flex", gap: "20px", alignItems: "flex-end" }}>
                  <Field label="Time :" value={data.dropTime} minWidth="180px" flex={0} />
                  <Field label="Date :" value={data.dropDate} flex={1} />
                </div>
              </td>
              <td style={cellAmt}></td>
            </tr>

            {/* Garage KM */}
            <tr>
              <td style={cell}>
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", flexWrap: "wrap" }}>
                  <Field label="Garrage K.M. Start" value={data.garageKmStart} minWidth="160px" flex={0} />
                  <span style={{ fontWeight: "bold", paddingBottom: "2px" }}>To</span>
                  <Field label="Garrage K.M. End" value={data.garageKmEnd} flex={1} />
                </div>
              </td>
              <td style={cellAmt}></td>
            </tr>

            {/* Hours */}
            <tr>
              <td style={cell}>
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", flexWrap: "wrap" }}>
                  <Field label="Star Hours :" value={data.startHours} minWidth="130px" flex={0} />
                  <Field label="To End Hours:" value={data.endHours} minWidth="150px" flex={0} />
                  <Field label="Total Hours:" value={data.totalHours} flex={1} />
                </div>
              </td>
              <td style={cellAmt}></td>
            </tr>

            {/* Extra KM & Extra Hours */}
            <tr>
              <td style={cell}>
                <div style={{ display: "flex", gap: "20px", alignItems: "flex-end" }}>
                  <Field label="Extra K.M." value={data.extraKm} minWidth="200px" flex={0} />
                  <Field label="Extra Hours" value={data.extraHours} flex={1} />
                </div>
              </td>
              <td style={cellAmt}></td>
            </tr>

            {/* Total KM & Rate */}
            <tr>
              <td style={cell}>
                <div style={{ display: "flex", gap: "20px", alignItems: "flex-end" }}>
                  <Field label="Total K.M." value={data.totalKm} minWidth="200px" flex={0} />
                  <Field label="Rate" value={data.rate} flex={1} />
                </div>
              </td>
              <td style={cellAmt}></td>
            </tr>

            {/* Drival Allowance */}
            <tr>
              <td style={cell}>
                <Field label="Drival Allowance :" value={data.drivalAllowance} />
              </td>
              <td style={cellAmt}></td>
            </tr>

            {/* Airport & Parking */}
            <tr>
              <td style={cell}>
                <Field label="Airport &amp; Parking :" value={data.airportParking} />
              </td>
              <td style={cellAmt}></td>
            </tr>

            {/* Toll */}
            <tr>
              <td style={cell}>
                <Field label="Toll :" value={data.toll} />
              </td>
              <td style={cellAmt}></td>
            </tr>

            {/* TOTAL */}
            <tr>
              <td style={{ ...cell, textAlign: "right", fontWeight: "bold", fontSize: "15px", border: "2px solid #000" }}>
                TOTAL
              </td>
              <td style={{ ...cellAmt, fontWeight: "bold", fontSize: "15px", border: "2px solid #000" }}>
                {data.totalAmount}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── FOOTER ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "20px", padding: "0 8px" }}>
          {/* PAID stamp */}
          <div
            style={{
              width: "96px",
              height: "96px",
              border: "4px solid #cc0000",
              borderRadius: "50%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              color: "#cc0000",
              padding: "6px",
            }}
          >
            <div style={{ fontSize: "9px", fontWeight: "bold", lineHeight: 1.2 }}>HANUMANT</div>
            <div style={{ fontSize: "9px", fontWeight: "bold", lineHeight: 1.2 }}>TRAVELS</div>
            <div style={{ fontSize: "24px", fontWeight: "bold", letterSpacing: "2px", lineHeight: 1.2 }}>PAID</div>
            <div style={{ fontSize: "8px", fontWeight: "bold", lineHeight: 1.2 }}>HANUMANT TRAVELS</div>
          </div>

          {/* Signature block */}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "15px", fontWeight: "bold", fontFamily: "'Times New Roman', serif", marginBottom: "6px" }}>
              for &#2358;&#2381;&#2352;&#2368; Hanumant Travels
            </div>
            {/* Handwritten-style Tiwari signature */}
            <div style={{
              fontSize: "32px",
              fontFamily: "'Segoe Script', 'Brush Script MT', 'Dancing Script', cursive",
              color: "#111",
              lineHeight: 1.2,
              marginBottom: "2px",
              marginRight: "10px",
            }}>
              Tiwari
            </div>
            <div style={{ borderTop: "1.5px solid #000", width: "200px", paddingTop: "4px", fontSize: "12px", textAlign: "center", marginLeft: "auto" }}>
              Authorised Signatory
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

InvoiceBill.displayName = "InvoiceBill";
export default InvoiceBill;
