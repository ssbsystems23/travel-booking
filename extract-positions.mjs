import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { createCanvas } from "canvas";
import { writeFileSync } from "fs";

async function main() {
  const doc = await getDocument("./bill.pdf").promise;
  const page = await doc.getPage(1);

  // Render at scale=2 for clarity (1pt = 2px, divide pixel coords by 2 to get pt)
  const vp = page.getViewport({ scale: 2 });
  console.log(`Page: ${vp.width/2} x ${vp.height/2} pt (rendering ${vp.width}x${vp.height} px)`);

  const canvas = createCanvas(vp.width, vp.height);
  const ctx = canvas.getContext("2d");
  await page.render({ canvasContext: ctx, viewport: vp }).promise;

  // Draw measurement grid (every 50pt = 100px)
  ctx.strokeStyle = "rgba(255,0,0,0.4)";
  ctx.lineWidth = 1;
  ctx.font = "18px sans-serif";
  ctx.fillStyle = "red";
  for (let pt = 50; pt < vp.height / 2; pt += 50) {
    const px = pt * 2;
    ctx.beginPath(); ctx.moveTo(0, px); ctx.lineTo(vp.width, px); ctx.stroke();
    ctx.fillText(`y=${pt}`, 4, px - 3);
  }
  for (let pt = 50; pt < vp.width / 2; pt += 50) {
    const px = pt * 2;
    ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, vp.height); ctx.stroke();
    ctx.fillText(`x=${pt}`, px + 2, 16);
  }

  writeFileSync("bill-grid.png", canvas.toBuffer("image/png"));
  console.log("Saved bill-grid.png with 50pt grid overlay");
}

main().catch(console.error);
