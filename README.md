# Ejido San Diego de Tezains — sitio web

Sitio estático hecho con **Astro** y **Tailwind CSS v4**. Páginas: Inicio, Nosotros y Noticias.

## Cómo funciona

La sección **Noticias** es como un perfil de red social: cada post tiene su descripción y una o más fotos en mosaico, y al bajar van apareciendo más posts.

- Cada post es un archivo `.md` en `src/content/noticias/` (los más nuevos salen primero, según `date`).
- Las fotos están en el bucket **R2** `ejido-tezains` y se muestran desde `PUBLIC_MEDIA_URL` (archivo `.env`, ver `.env.example`).
- Después de agregar o cambiar un post hay que compilar (`npm run build`) y subir la carpeta `dist/` al dominio.

## Publicar un post

1. Una sola vez: `npm install` y `npx wrangler login`.
2. Crea el post y sube sus fotos (la primera en orden alfabético es la grande):
   ```bash
   npm run nuevo-post -- brigada-octubre C:Fotosrigada
   ```
   Esto sube las fotos a `noticias/<año>/brigada-octubre/` en R2 y crea `src/content/noticias/<fecha>-brigada-octubre.md`.
3. Abre el `.md`, escribe la descripción y el `alt` (descripción breve) de cada foto.
4. `npm run build` y sube el contenido de `dist/` a tu dominio.

Para subir fotos a un post existente: `npm run subir-fotos -- <foto o carpeta> [carpeta-en-el-bucket]` y pega el bloque `images:` que imprime.

Formato de un post:

```md
---
date: 2026-10-15
images:                      # ninguna, una o varias; la primera es la grande
  - src: noticias/2026/brigada-octubre/foto-1.jpg
    alt: "Brigada plantando pinos"
  - src: noticias/2026/brigada-octubre/foto-2.jpg
    alt: ""
draft: false                 # true = no se publica todavía
---

🌲 El texto va aquí, como en Facebook: respeta los saltos de línea,
convierte enlaces https://... y resalta los #hashtags. También **negritas**.

📰 Fuente: https://... (los enlaces van en el texto)
```

## Comandos

```bash
npm run dev        # servidor local en http://localhost:4321
npm run build      # genera dist/ para subir al dominio
npm run preview    # ver dist/ localmente
```

## Dónde cambiar las cosas

- Datos de contacto, menú y cifras: `src/data/site.ts`
- Colores y fuentes: `src/styles/global.css` (bloque `@theme`)
- Animaciones de scroll: `src/scripts/reveal.ts` — añade `data-reveal="up|left|right|zoom|mask"` y opcionalmente `data-delay="200"` a cualquier elemento; `data-count="374"` anima un número.
- Fotos: `public/images/`. Son fotos libres provisionales; reemplázalas por fotos reales del ejido manteniendo el mismo nombre de archivo. Ver `CREDITOS.md`.
