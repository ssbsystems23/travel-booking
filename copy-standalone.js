const fs = require("fs");
const path = require("path");

// The standalone output can be nested one level deeper (e.g.
// .next/standalone/travel-booking) when Next.js infers a workspace root
// above the project. Locate the folder that contains server.js and copy
// public/ and .next/static into THAT folder, since the standalone server
// only serves assets relative to itself.
const standaloneBase = path.join(".next", "standalone");

function findServerRoot(dir) {
  if (fs.existsSync(path.join(dir, "server.js"))) return dir;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const found = findServerRoot(path.join(dir, entry.name));
    if (found) return found;
  }
  return null;
}

const serverRoot = findServerRoot(standaloneBase);
if (!serverRoot) {
  console.error(`Could not find server.js under ${standaloneBase} — did the build run with output: "standalone"?`);
  process.exit(1);
}

const copies = [
  { src: "public", dest: path.join(serverRoot, "public") },
  { src: path.join(".next", "static"), dest: path.join(serverRoot, ".next", "static") },
];

for (const { src, dest } of copies) {
  fs.cpSync(src, dest, { recursive: true });
  console.log(`Copied ${src} -> ${dest}`);
}
