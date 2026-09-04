/**
 * Renders every binary brand asset from the SVG sources in public/.
 * Run with `npm run assets` after touching a logo file, then commit the output.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "public");

const png = (svg, size, extra = {}) =>
  sharp(svg, { density: 384 })
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 }, ...extra })
    .png({ compressionLevel: 9 })
    .toBuffer();

function buildIco(frames) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(frames.length, 4);

  const directory = Buffer.alloc(16 * frames.length);
  let offset = header.length + directory.length;

  frames.forEach(({ size, data }, index) => {
    const at = index * 16;
    directory.writeUInt8(size >= 256 ? 0 : size, at);
    directory.writeUInt8(size >= 256 ? 0 : size, at + 1);
    directory.writeUInt8(0, at + 2);
    directory.writeUInt8(0, at + 3);
    directory.writeUInt16LE(1, at + 4);
    directory.writeUInt16LE(32, at + 6);
    directory.writeUInt32LE(data.length, at + 8);
    directory.writeUInt32LE(offset, at + 12);
    offset += data.length;
  });

  return Buffer.concat([header, directory, ...frames.map((frame) => frame.data)]);
}

async function main() {
  await mkdir(join(pub, "icons"), { recursive: true });

  const favicon = await readFile(join(pub, "favicon.svg"));
  const app = await readFile(join(pub, "icons", "app.svg"));
  const maskable = await readFile(join(pub, "icons", "maskable.svg"));

  const jobs = [
    [join(pub, "icons", "icon-192.png"), await png(app, 192)],
    [join(pub, "icons", "icon-512.png"), await png(app, 512)],
    [join(pub, "icons", "maskable-512.png"), await png(maskable, 512)],
    [join(pub, "apple-touch-icon.png"), await png(app, 180)],
  ];

  const icoFrames = await Promise.all(
    [16, 32, 48].map(async (size) => ({ size, data: await png(favicon, size) })),
  );
  jobs.push([join(pub, "favicon.ico"), buildIco(icoFrames)]);

  const og = await readFile(join(pub, "og-source.svg"));
  jobs.push([
    join(pub, "og.png"),
    await sharp(og, { density: 144 }).png({ compressionLevel: 9 }).toBuffer(),
  ]);
  const ogSquare = await readFile(join(pub, "og-square-source.svg"));
  jobs.push([
    join(pub, "og-square.png"),
    await sharp(ogSquare, { density: 144 }).png({ compressionLevel: 9 }).toBuffer(),
  ]);

  for (const [path, data] of jobs) {
    await writeFile(path, data);
    console.log(`wrote ${path.replace(root + "/", "")} (${(data.length / 1024).toFixed(1)} KB)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
