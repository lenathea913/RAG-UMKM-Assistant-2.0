/**
 * Trace logo merak (PNG) → SVG vektor dengan potrace.
 * PNG di-trim dulu (buang margin putih) supaya viewBox pas di figur.
 * Output: public/logo-merak.svg (fill currentColor, siap diwarnai di UI)
 */
const potrace = require("potrace");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "logo-source.png");
const OUT = path.join(__dirname, "..", "public", "logo-merak.svg");

(async () => {
  // Trim margin + sedikit penggelapan agar threshold lebih bersih
  const trimmed = await sharp(SRC)
    .trim({ threshold: 30 })
    .normalise()
    .resize(768, 768, { fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();

  potrace.trace(
    trimmed,
    {
      threshold: 165,
      turdSize: 2,
      optTolerance: 0.4,
      alphaMax: 1,
    },
    (err, svg) => {
      if (err) {
        console.error("Trace gagal:", err);
        process.exit(1);
      }
      const colored = svg
        .replace(/fill="[^"]*"/g, 'fill="currentColor"')
        .replace(/stroke="[^"]*"/g, 'stroke="none"');
      fs.writeFileSync(OUT, colored, "utf8");
      const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
      console.log(`OK → ${OUT} (${kb} KB)`);
    },
  );
})();
