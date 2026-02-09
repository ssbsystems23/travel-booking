const fs = require("fs");
const path = require("path");

const copies = [
  { src: "public", dest: path.join(".next", "standalone", "public") },
  { src: path.join(".next", "static"), dest: path.join(".next", "standalone", ".next", "static") },
];

for (const { src, dest } of copies) {
  fs.cpSync(src, dest, { recursive: true });
  console.log(`Copied ${src} -> ${dest}`);
}
