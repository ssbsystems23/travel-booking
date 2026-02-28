import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { readFileSync, writeFileSync } from "fs";

async function main() {
  const pdfBytes = readFileSync("./bill.pdf");
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const page = pdfDoc.getPages()[0];
  const { width, height } = page.getSize();
  console.log(`Page: ${width} x ${height} pt`);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Draw horizontal lines every 25pt with labels
  // pdf-lib uses bottom-left origin, so y=0 is bottom, y=height is top
  for (let yFromTop = 0; yFromTop <= height; yFromTop += 25) {
    const pdfY = height - yFromTop; // convert top-origin to bottom-origin
    page.drawLine({
      start: { x: 0, y: pdfY },
      end: { x: width, y: pdfY },
      thickness: 0.3,
      color: rgb(1, 0, 0),
      opacity: 0.5,
    });
    page.drawText(`y=${yFromTop}`, {
      x: 2,
      y: pdfY + 1,
      size: 6,
      font,
      color: rgb(1, 0, 0),
      opacity: 0.7,
    });
  }

  // Draw vertical lines every 50pt with labels
  for (let x = 0; x <= width; x += 50) {
    page.drawLine({
      start: { x, y: 0 },
      end: { x, y: height },
      thickness: 0.3,
      color: rgb(0, 0, 1),
      opacity: 0.5,
    });
    page.drawText(`x=${x}`, {
      x: x + 1,
      y: height - 10,
      size: 6,
      font,
      color: rgb(0, 0, 1),
      opacity: 0.7,
    });
  }

  const outBytes = await pdfDoc.save();
  writeFileSync("bill-calibrated.pdf", outBytes);
  console.log("Saved bill-calibrated.pdf with grid overlay (y=top-origin labels)");
}

main().catch(console.error);
