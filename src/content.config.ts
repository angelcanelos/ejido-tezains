import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/** Una foto del post: ruta dentro del bucket R2 (p. ej. "2026/brigada-1.jpg") o URL completa. */
const imagen = z.union([
  z.string().transform((src) => ({ src, alt: "" })),
  z.object({ src: z.string(), alt: z.string().default("") }),
]);

const noticias = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/noticias" }),
  schema: z.object({
    date: z.coerce.date(),
    /** Ninguna, una o varias fotos; la primera es la grande. */
    images: z.array(imagen).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { noticias };
