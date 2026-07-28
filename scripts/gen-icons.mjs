// One-off script to generate app icon PNGs (no image-library dependency).
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

const BG = [224, 229, 236]; // neumorphic base
const FG = [90, 100, 130]; // note glyph

function crc32(buf) {
  let c;
  const table = crc32.table ?? (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function circleDist(px, py, cx, cy) {
  return Math.hypot(px - cx, py - cy);
}

function drawIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const r = size * 0.22; // corner radius
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      // rounded-rect background mask
      let inside = true;
      const cx = x < r ? r : x > size - r ? size - r : x;
      const cy = y < r ? r : y > size - r ? size - r : y;
      if ((x < r || x > size - r) && (y < r || y > size - r)) {
        inside = circleDist(x, y, cx, cy) <= r;
      }
      let [red, green, blue] = inside ? BG : [0, 0, 0];
      let alpha = inside ? 255 : 0;

      // note head (filled ellipse), stem, and flag drawn in FG
      const noteCx = size * 0.4;
      const noteCy = size * 0.68;
      const noteRx = size * 0.14;
      const noteRy = size * 0.11;
      const dx = (x - noteCx) / noteRx;
      const dy = (y - noteCy) / noteRy;
      const inHead = dx * dx + dy * dy <= 1;

      const stemX0 = size * 0.51;
      const stemX1 = size * 0.57;
      const stemY0 = size * 0.22;
      const stemY1 = size * 0.68;
      const inStem = x >= stemX0 && x <= stemX1 && y >= stemY0 && y <= stemY1;

      // flag: triangle-ish blob near top of stem
      const fdx = x - stemX1;
      const fdy = y - stemY0 - size * 0.02;
      const inFlag =
        fdx >= 0 &&
        fdx <= size * 0.16 &&
        fdy >= -size * 0.02 &&
        fdy <= size * 0.14 &&
        fdy >= fdx * 0.9 - size * 0.02;

      if (inside && (inHead || inStem || inFlag)) {
        [red, green, blue] = FG;
        alpha = 255;
      }

      pixels[idx] = red;
      pixels[idx + 1] = green;
      pixels[idx + 2] = blue;
      pixels[idx + 3] = alpha;
    }
  }
  return pixels;
}

function encodePNG(size) {
  const pixels = drawIcon(size);
  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + size * 4);
    raw[rowStart] = 0; // filter: none
    pixels.copy(raw, rowStart + 1, y * size * 4, (y + 1) * size * 4);
  }
  const idat = deflateSync(raw);

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync("public/icons", { recursive: true });
for (const size of [180, 192, 512]) {
  writeFileSync(`public/icons/icon-${size}.png`, encodePNG(size));
}
console.log("Icons generated.");
