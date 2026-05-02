/**
 * Generates PWA icons (192x192 and 512x512) as valid PNG files
 * using only Node.js built-in modules — no external dependencies.
 */

const zlib = require("zlib");
const fs = require("fs");
const path = require("path");

// CRC32 lookup table for PNG chunk checksums
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++)
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcVal = Buffer.alloc(4);
  crcVal.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crcVal]);
}

/**
 * Creates a PNG with:
 * - Rounded-rect background (primary blue #0ea5e9)
 * - White circle in center
 * - Arabic letter "س" approximated as white pixels
 */
function createIcon(size) {
  const r_bg = 0x0e, g_bg = 0xa5, b_bg = 0xe9; // #0ea5e9
  const r_wh = 0xff, g_wh = 0xff, b_wh = 0xff;

  const radius = Math.round(size * 0.22); // rounded corner radius
  const cx = size / 2;
  const cy = size / 2;
  const circleR = size * 0.3;

  // Pixel buffer: each row = [filterByte, R,G,B, R,G,B, ...]
  const rowLen = 1 + size * 3;
  const raw = Buffer.alloc(rowLen * size, 0);

  for (let y = 0; y < size; y++) {
    raw[y * rowLen] = 0; // PNG filter: None
    for (let x = 0; x < size; x++) {
      const off = y * rowLen + 1 + x * 3;

      // Rounded rectangle mask (background)
      const inRect =
        x >= radius && x < size - radius
          ? true
          : y >= radius && y < size - radius
          ? true
          : Math.hypot(x - radius, y - radius) <= radius ||
            Math.hypot(x - (size - radius), y - radius) <= radius ||
            Math.hypot(x - radius, y - (size - radius)) <= radius ||
            Math.hypot(x - (size - radius), y - (size - radius)) <= radius;

      if (!inRect) {
        // transparent → white background for non-transparent PNGs
        raw[off] = 0xff; raw[off + 1] = 0xff; raw[off + 2] = 0xff;
        continue;
      }

      // White circle in center
      const dist = Math.hypot(x - cx, y - cy);
      if (dist <= circleR) {
        raw[off] = r_wh; raw[off + 1] = g_wh; raw[off + 2] = b_wh;
      } else {
        raw[off] = r_bg; raw[off + 1] = g_bg; raw[off + 2] = b_bg;
      }

      // Draw "س" shape as simple geometric strokes inside the white circle
      const lx = (x - cx) / circleR; // -1..1
      const ly = (y - cy) / circleR; // -1..1
      const stroke = 0.09;

      // Three dots + base curve of "س"
      const inSin =
        // base horizontal bar
        (Math.abs(ly - 0.1) < stroke && lx > -0.65 && lx < 0.65) ||
        // left upstroke
        (Math.abs(lx + 0.5) < stroke && ly > -0.55 && ly < 0.15) ||
        // middle upstroke
        (Math.abs(lx) < stroke && ly > -0.55 && ly < 0.1) ||
        // right upstroke
        (Math.abs(lx - 0.5) < stroke && ly > -0.55 && ly < 0.15) ||
        // bottom curve
        (Math.abs(Math.hypot(lx, ly - 0.45) - 0.35) < stroke &&
          ly > 0.1 && ly < 0.8);

      if (inSin && dist <= circleR * 0.88) {
        raw[off] = r_bg; raw[off + 1] = g_bg; raw[off + 2] = b_bg;
      }
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 2;   // RGB (no alpha needed — white bg handles transparency)
  ihdr.fill(0, 10);

  const compressed = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const outDir = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(outDir, { recursive: true });

for (const size of [192, 512]) {
  const buf = createIcon(size);
  const out = path.join(outDir, `icon-${size}.png`);
  fs.writeFileSync(out, buf);
  console.log(`✓ Created ${out} (${buf.length} bytes)`);
}
