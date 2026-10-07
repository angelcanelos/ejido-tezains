// Sube fotos al bucket R2 y muestra lo que hay que pegar en el post.
// Uso: npm run subir-fotos -- <foto o carpeta> [carpeta-en-el-bucket]
//   npm run subir-fotos -- C:\Fotos\feria noticias/2026/feria
// Requiere `npx wrangler login` una vez y R2_BUCKET en el archivo .env.
import { BUCKET, imagesYaml, uploadPhotos } from "./lib/r2.mjs";

const [input, folder = `noticias/${new Date().getFullYear()}`] = process.argv.slice(2);

if (!BUCKET || !input) {
  console.error("Uso: npm run subir-fotos -- <foto o carpeta> [carpeta-en-el-bucket]\nDefine R2_BUCKET en .env");
  process.exit(1);
}

const keys = uploadPhotos(input, folder);
console.log(`\n${keys.length} foto(s) subidas. Pega esto en el post:\n\n${imagesYaml(keys)}`);
