// Utilidades compartidas para subir fotos al bucket R2 con wrangler.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join } from "node:path";

const env = existsSync(".env")
  ? Object.fromEntries(
      readFileSync(".env", "utf8")
        .split(/\r?\n/)
        .filter((l) => /^\s*[A-Z_]+\s*=/.test(l))
        .map((l) => {
          const i = l.indexOf("=");
          return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
        }),
    )
  : {};
export const BUCKET = process.env.R2_BUCKET || env.R2_BUCKET;

const TYPES = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", avif: "image/avif" };

export const slug = (name) =>
  name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");

/** Fotos de un archivo o carpeta (en orden alfabético). */
export function listPhotos(input) {
  const files = statSync(input).isDirectory() ? readdirSync(input).sort().map((f) => join(input, f)) : [input];
  return files.filter((f) => TYPES[f.split(".").pop().toLowerCase()]);
}

/** Sube las fotos a `<folder>/<nombre>` del bucket y regresa las rutas (keys) subidas. */
export function uploadPhotos(input, folder) {
  if (!BUCKET) throw new Error("Define R2_BUCKET en .env");
  const keys = [];
  for (const file of listPhotos(input)) {
    const ext = file.split(".").pop().toLowerCase();
    const key = `${folder.replace(/^\/+|\/+$/g, "")}/${slug(basename(file))}`;
    console.log(`→ ${key}`);
    execFileSync(process.execPath, ["node_modules/wrangler/bin/wrangler.js", "r2", "object", "put", `${BUCKET}/${key}`, "--file", file, "--content-type", TYPES[ext], "--remote"], {
      stdio: ["ignore", "ignore", "inherit"],
    });
    keys.push(key);
  }
  return keys;
}

/** Bloque `images:` del frontmatter para pegar en el post. */
export const imagesYaml = (keys) => (keys.length ? `images:\n${keys.map((k) => `  - src: ${k}\n    alt: ""`).join("\n")}\n` : "");
