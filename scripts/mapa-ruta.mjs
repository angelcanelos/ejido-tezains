// Genera el mapa estático de "Cómo llegar" (Santiago Papasquiaro → Forestal Tezains):
// descarga la ruta de OSRM y las teselas de Esri (World Topo Map), las une en una imagen y guarda la ruta
// ya proyectada a píxeles para dibujarla encima con SVG. Así la página no carga MapLibre.
// Uso: node scripts/mapa-ruta.mjs
import { writeFile } from "node:fs/promises";
import sharp from "sharp";
import { start, end, fetchRoutes, simplify } from "../src/lib/routes.js";

const Z = 12;
const TILE = 256;
const ASPECT = 16 / 10;
const PAD = 0.12;

const worldX = (lng) => ((lng + 180) / 360) * 2 ** Z * TILE;
const worldY = (lat) => {
  const sin = Math.sin((lat * Math.PI) / 180);
  return (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * 2 ** Z * TILE;
};

const routes = await fetchRoutes(AbortSignal.timeout(15000));
if (!routes.length) throw new Error("OSRM no devolvió rutas");

// Recuadro de la ruta + margen, ajustado a la proporción del contenedor.
const pts = routes.flatMap((r) => r.coordinates).map(([lng, lat]) => [worldX(lng), worldY(lat)]);
let [x0, x1] = [Math.min(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[0]))];
let [y0, y1] = [Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[1]))];
let w = (x1 - x0) * (1 + PAD * 2);
let h = (y1 - y0) * (1 + PAD * 2);
if (w / h < ASPECT) w = h * ASPECT;
else h = w / ASPECT;
const cx = (x0 + x1) / 2;
const cy = (y0 + y1) / 2;
[x0, x1, y0, y1] = [cx - w / 2, cx + w / 2, cy - h / 2, cy + h / 2].map(Math.round);
const W = x1 - x0;
const H = y1 - y0;

// Teselas
const tiles = [];
for (let tx = Math.floor(x0 / TILE); tx <= Math.floor(x1 / TILE); tx++) {
  for (let ty = Math.floor(y0 / TILE); ty <= Math.floor(y1 / TILE); ty++) {
    const url = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/${Z}/${ty}/${tx}`;
    tiles.push(
      fetch(url).then(async (res) => {
        if (!res.ok) throw new Error(`${res.status} ${url}`);
        return { input: Buffer.from(await res.arrayBuffer()), left: tx * TILE - x0, top: ty * TILE - y0 };
      }),
    );
  }
}
const loaded = await Promise.all(tiles);
// sharp no acepta posiciones negativas: se compone en un lienzo más grande y se recorta.
const ox = -Math.min(0, ...loaded.map((t) => t.left));
const oy = -Math.min(0, ...loaded.map((t) => t.top));
const canvas = await sharp({ create: { width: W + ox + TILE, height: H + oy + TILE, channels: 3, background: "#f2efe9" } })
  .composite(loaded.map((t) => ({ input: t.input, left: t.left + ox, top: t.top + oy })))
  .png()
  .toBuffer();
await sharp(canvas)
  .extract({ left: ox, top: oy, width: W, height: H })
    .resize({ width: 1600 }) // La ruta se dibuja con viewBox en las coordenadas originales; sólo la imagen se reduce.
  .webp({ quality: 70 })
  .toFile("public/images/ruta-mapa.webp");

// Ruta en coordenadas de la imagen (1 decimal basta).
const r1 = (n) => Math.round(n * 10) / 10;
const toPx = ([lng, lat]) => [r1(worldX(lng) - x0), r1(worldY(lat) - y0)];
const data = {
  width: W,
  height: H,
  start: { name: start.name, ...Object.fromEntries(["x", "y"].map((k, i) => [k, toPx([start.lng, start.lat])[i]])) },
  end: { name: end.name, ...Object.fromEntries(["x", "y"].map((k, i) => [k, toPx([end.lng, end.lat])[i]])) },
  routes: routes.map((r) => ({
    duration: Math.round(r.duration),
    distance: Math.round(r.distance),
    // ~0.5 px de tolerancia: la línea se ve igual con muchos menos puntos.
    d: "M" + simplify(r.coordinates, 0.00015).map(toPx).map(([x, y]) => `${x} ${y}`).join("L"),
  })),
};
await writeFile("src/data/ruta.json", JSON.stringify(data));
console.log(`Mapa ${W}×${H}px, ${routes.length} ruta(s), ${loaded.length} teselas.`);
