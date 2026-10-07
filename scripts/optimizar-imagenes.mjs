// Recomprime las fotos de public/images para que la página cargue rápido.
// Uso: node scripts/optimizar-imagenes.mjs
// Guarda los originales en imagenes-originales/ (la primera vez) y sólo reemplaza si el resultado pesa menos.
import { copyFile, mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const DIR = "public/images";
const BACKUP = "imagenes-originales";
const MAX_WIDTH = 1280;
const HERO_WIDTH = 1600;
/** Versiones pequeñas para celulares (se usan en srcset). */
const SMALL = { "hero.jpg": 900 };

await mkdir(BACKUP, { recursive: true });

for (const file of await readdir(DIR)) {
  const src = path.join(DIR, file);
  if (/-sm\.\w+$/.test(file) || !/\.(jpe?g|png)$/i.test(file)) continue;
  const backup = path.join(BACKUP, file);
  if (!existsSync(backup)) await copyFile(src, backup);

  const before = (await stat(src)).size;
  const isLogo = file === "logo.png";
  const img = sharp(backup).rotate();
  const out = isLogo
    ? await img.resize({ width: 400 }).png({ palette: true, quality: 90, compressionLevel: 9 }).toBuffer()
    : await img.resize({ width: file === "hero.jpg" ? HERO_WIDTH : MAX_WIDTH, withoutEnlargement: true }).jpeg({ quality: 74, mozjpeg: true, progressive: true }).toBuffer();
  if (out.length < before) await writeFile(src, out);
  console.log(`${file}: ${Math.round(before / 1024)} KB → ${Math.round(Math.min(out.length, before) / 1024)} KB`);

  if (SMALL[file]) {
    const small = await sharp(backup).resize({ width: SMALL[file] }).jpeg({ quality: 70, mozjpeg: true, progressive: true }).toBuffer();
    await writeFile(path.join(DIR, file.replace(/(\.\w+)$/, "-sm$1")), small);
    console.log(`  + ${file.replace(/(\.\w+)$/, "-sm$1")}: ${Math.round(small.length / 1024)} KB`);
  }
}
