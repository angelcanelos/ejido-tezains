// Crea un post nuevo en src/content/noticias/ y (opcional) sube sus fotos a R2.
// Uso: npm run nuevo-post -- <nombre-del-post> [foto o carpeta con fotos]
//   npm run nuevo-post -- brigada-octubre C:\Fotos\brigada
// Las fotos se suben a noticias/<año>/<nombre>/ en el bucket; la primera (orden alfabético) es la grande.
import { existsSync, writeFileSync } from "node:fs";
import { imagesYaml, slug, uploadPhotos } from "./lib/r2.mjs";

const [name, input] = process.argv.slice(2);
if (!name) {
  console.error("Uso: npm run nuevo-post -- <nombre-del-post> [foto o carpeta con fotos]");
  process.exit(1);
}

const now = new Date();
const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
const id = `${date}-${slug(name)}`;
const file = `src/content/noticias/${id}.md`;
if (existsSync(file)) {
  console.error(`Ya existe ${file}`);
  process.exit(1);
}

const keys = input ? uploadPhotos(input, `noticias/${now.getFullYear()}/${slug(name)}`) : [];

writeFileSync(
  file,
  `---
date: ${date}
${imagesYaml(keys)}---

Escribe aquí la descripción del post, como en Facebook.

Puedes usar varios párrafos, **negritas**, enlaces https://... y #hashtags.
`,
);

console.log(`\n✔ Post creado: ${file}${keys.length ? ` (${keys.length} foto(s))` : ""}
Edita el texto (y el "alt" de cada foto), luego: npm run build y sube la carpeta dist/.`);
