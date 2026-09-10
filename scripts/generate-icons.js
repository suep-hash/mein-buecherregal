const sharp = require("sharp");
const path = require("path");

const src = path.join(__dirname, "icon-source.svg");

async function main() {
  const svg = require("fs").readFileSync(src);

  await sharp(svg).resize(192, 192).png().toFile(
    path.join(__dirname, "..", "public", "icon-192.png")
  );
  await sharp(svg).resize(512, 512).png().toFile(
    path.join(__dirname, "..", "public", "icon-512.png")
  );
  // App-Router-Konvention: app/icon.png und app/apple-icon.png werden
  // automatisch als Favicon bzw. Apple-Touch-Icon eingebunden.
  await sharp(svg).resize(180, 180).png().toFile(
    path.join(__dirname, "..", "app", "apple-icon.png")
  );
  await sharp(svg).resize(64, 64).png().toFile(
    path.join(__dirname, "..", "app", "icon.png")
  );

  console.log("Icons generiert.");
}

main();
