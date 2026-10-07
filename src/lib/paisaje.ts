// Paisaje del pie (montañas, pinos y torre de vigilancia), generado al compilar.
// Se sirve como archivo aparte (/paisaje.svg) para que el navegador lo descargue una vez y lo reutilice en todas las páginas.
// Panorama ancho: el dibujo central (torre, sol, aves) mide 1600 y se le agregan OFF a cada lado de
// montañas y bosque. En el pie la imagen se recorta por los lados (object-cover), así cabe en
// pantalla a cualquier ancho sin cortar los picos ni el cielo.
const OFF = 600;
export const VW = 1600 + OFF * 2;
export const VH = 560;
/** Desplaza puntos del dibujo central (diseñado en 0–1600) al centro del panorama. */
const shift = (pts: [number, number][]) => pts.map(([x, y]) => [x + OFF, y] as [number, number]);

// Generador pseudoaleatorio con semilla para que el dibujo sea siempre el mismo.
const rng = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
const r1 = (n: number) => Math.round(n * 10) / 10;

/** Cordillera: picos de control y detalle por desplazamiento de punto medio, cerrada hasta el fondo. */
const ridge = (seed: number, peaks: [number, number][], amp = 40) => {
  const rand = rng(seed);
  let pts = peaks;
  let spread = amp;
  for (let level = 0; level < 5; level++) {
    const next: [number, number][] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[i + 1];
      next.push(pts[i], [(x1 + x2) / 2, (y1 + y2) / 2 + (rand() - 0.5) * spread]);
    }
    next.push(pts[pts.length - 1]);
    pts = next;
    spread *= 0.55;
  }
  return `M0 ${VH}` + pts.map(([x, y]) => `L${r1(x)} ${r1(y)}`).join("") + `L${VW} ${VH}Z`;
};

/** Un pino con ramas escalonadas. */
const pine = (x: number, y: number, h: number, w: number) => {
  const tiers = 5;
  const right: string[] = [];
  const left: string[] = [];
  for (let i = 1; i <= tiers; i++) {
    const ly = y - h + (h * i) / tiers;
    const hw = (w / 2) * (i / tiers);
    right.push(`L${r1(x + hw)} ${r1(ly)}`);
    left.unshift(`L${r1(x - hw)} ${r1(ly)}`);
    if (i < tiers) {
      const iy = ly - (h / tiers) * 0.25;
      right.push(`L${r1(x + hw * 0.45)} ${r1(iy)}`);
      left.unshift(`L${r1(x - hw * 0.45)} ${r1(iy)}`);
    }
  }
  return `M${r1(x)} ${r1(y - h)}${right.join("")}L${r1(x + w / 2)} ${r1(y + 30)}L${r1(x - w / 2)} ${r1(y + 30)}${left.join("")}Z`;
};

/** Hilera de pinos sobre una base sólida. */
const treeline = (seed: number, base: number, hMin: number, hMax: number) => {
  const rand = rng(seed);
  let d = `M0 ${base}H${VW}V${VH}H0Z`;
  for (let x = -20; x < VW + 20; ) {
    const h = hMin + rand() * (hMax - hMin);
    const w = h * (0.38 + rand() * 0.12);
    d += pine(x, base + rand() * 14, h, w);
    x += w * (0.45 + rand() * 0.5);
  }
  return d;
};

const layers = [
  {
    d: ridge(7, [
      [0, 225], [150, 170], [320, 215], [460, 140],
      ...shift([[0, 250], [180, 190], [330, 235], [520, 150], [700, 215], [880, 95], [1010, 150], [1180, 120], [1330, 205], [1480, 160], [1600, 200]]),
      [2350, 150], [2500, 210], [2660, 130], [2800, 190],
    ]),
    fill: "#a9c6bd",
  },
  {
    d: ridge(23, [
      [0, 250], [160, 290], [330, 230], [480, 280],
      ...shift([[0, 270], [140, 225], [300, 280], [460, 215], [640, 285], [780, 245], [960, 290], [1120, 230], [1300, 270], [1460, 215], [1600, 260]]),
      [2360, 220], [2520, 285], [2680, 235], [2800, 265],
    ], 30),
    fill: "#86aba0",
  },
  { d: treeline(5, 330, 30, 60), fill: "#5f8b7b" },
  { d: treeline(11, 375, 45, 85), fill: "#43705f" },
];
const front = [
  { d: treeline(3, 430, 60, 120), fill: "#2b5242" },
  { d: treeline(19, 490, 80, 170), fill: "#173426" },
];

// Torre de vigilancia contra incendios.
const T = { x: 900 + OFF, top: 196, base: 470 };
const legs = `M${T.x - 46} ${T.base}L${T.x - 22} ${T.top + 44}M${T.x + 46} ${T.base}L${T.x + 22} ${T.top + 44}`;
const braces = [0, 1, 2, 3, 4]
  .map((i) => {
    const y1 = T.top + 44 + i * 45;
    const y2 = y1 + 45;
    const w1 = 22 + (24 * (y1 - T.top - 44)) / (T.base - T.top - 44);
    const w2 = 22 + (24 * (y2 - T.top - 44)) / (T.base - T.top - 44);
    return `M${r1(T.x - w1)} ${y1}L${r1(T.x + w2)} ${y2}M${r1(T.x + w1)} ${y1}L${r1(T.x - w2)} ${y2}M${r1(T.x - w1)} ${y1}H${r1(T.x + w1)}`;
  })
  .join("");

const p = (d: string, fill: string) => `<path d="${d}" fill="${fill}"/>`;

// Aves: cada una aletea (SMIL, cambia la forma de las alas) y planea; la parvada cruza el cielo de derecha a izquierda.
const WING_UP = "M-7 -3Q-3 -5 0 0Q3 -5 7 -3";
const WING_DOWN = "M-7 3Q-3 -1 0 0Q3 -1 7 3";
const WING_GLIDE = "M-7 -1Q-3 -2 0 0Q3 -2 7 -1";
const bird = ([x, y, s, flap, begin]: number[]) =>
  `<g transform="translate(${x + OFF} ${y}) scale(${s * 1.3})">` +
  `<path class="flap" d="${WING_UP}"><animate attributeName="d" values="${WING_UP};${WING_DOWN};${WING_UP};${WING_DOWN};${WING_GLIDE};${WING_GLIDE}" keyTimes="0;.15;.3;.45;.6;1" dur="${flap}s" begin="${begin}s" repeatCount="indefinite"/></path>` +
  `<path class="still" d="${WING_UP}"/></g>`;
/** Parvada: [x, y, escala, duración del aleteo, desfase] por ave. Cruza en `dur` segundos, empezando en `delay`. */
const flock = (members: number[][], dur: number, delay: number) =>
  `<g class="fly" style="animation-duration:${dur}s;animation-delay:${delay}s"><g class="bob">${members.map(bird).join("")}</g></g>`;
const birds =
  flock(
    [
      [970, 168, 1.15, 1.6, 0],
      [992, 156, 0.95, 1.4, -0.3],
      [1014, 172, 1, 1.7, -0.7],
      [1038, 150, 0.8, 1.3, -0.2],
      [954, 186, 0.85, 1.5, -0.9],
      [1060, 164, 0.7, 1.2, -0.5],
    ],
    46,
    -14,
  ) +
  flock(
    [
      [1200, 110, 0.75, 1.3, -0.4],
      [1222, 100, 0.65, 1.1, 0],
      [1240, 116, 0.6, 1.2, -0.6],
    ],
    62,
    -40,
  );

export function paisajeSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}" width="${VW}" height="${VH}">
<style>
.sway{transform-box:fill-box;transform-origin:50% 100%;animation:sway 7s ease-in-out infinite alternate}
@keyframes sway{to{transform:skewX(-1.2deg)}}
.halo{transform-box:fill-box;transform-origin:center;animation:halo 5s ease-in-out infinite}
@keyframes halo{0%,100%{opacity:.75;transform:scale(.92)}50%{opacity:1;transform:scale(1.08)}}
.lamp{animation:lamp 5s ease-in-out infinite}
@keyframes lamp{0%,100%{opacity:.55}50%{opacity:1}43%{opacity:.8}46%{opacity:1}}
.beacon{animation:beacon 2.4s ease-in-out infinite}
@keyframes beacon{0%,100%{opacity:.15}12%,30%{opacity:1}}
.fly{animation:fly linear infinite}
@keyframes fly{0%{transform:translate(720px,30px);opacity:0}6%{opacity:1}94%{opacity:1}100%{transform:translate(-1200px,-50px);opacity:0}}
.bob{animation:bob 6s ease-in-out infinite alternate}
@keyframes bob{to{transform:translateY(-14px)}}
.still{display:none}
@media (prefers-reduced-motion:reduce){
.sway,.halo,.lamp,.beacon,.fly,.bob{animation:none}
.flap{display:none}.still{display:inline}
}
</style>
<defs>
<linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0.55" stop-color="#0b1f15" stop-opacity="0"/><stop offset="1" stop-color="#0b1f15"/></linearGradient>
<radialGradient id="halo"><stop offset="0" stop-color="#ffe7a3" stop-opacity=".95"/><stop offset=".2" stop-color="#ffd27a" stop-opacity=".65"/><stop offset=".55" stop-color="#ffc061" stop-opacity=".2"/><stop offset="1" stop-color="#ffc061" stop-opacity="0"/></radialGradient>
<filter id="glow" x="-100%" y="-200%" width="300%" height="500%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
${layers.map((l) => p(l.d, l.fill)).join("")}
<ellipse class="halo" cx="${T.x}" cy="${T.top + 19}" rx="200" ry="160" fill="url(#halo)"/>
<g fill="none" stroke="#1d3b2d" stroke-linecap="round">
<path d="${legs}" stroke-width="5"/>
<path d="${braces}" stroke-width="2.2"/>
<path d="M${T.x + 36} ${T.top + 30}C${T.x + 120} ${T.top + 120} ${T.x + 200} ${T.top + 150} ${T.x + 260} ${T.top + 140}" stroke-width="1.4"/>
<path d="M${T.x + 260} ${T.top + 130}V${T.base}M${T.x + 248} ${T.top + 138}H${T.x + 272}" stroke-width="3"/>
</g>
<g fill="#1d3b2d">
<rect x="${T.x - 38}" y="${T.top + 6}" width="76" height="38"/>
<g filter="url(#glow)">
<rect x="${T.x - 30}" y="${T.top + 12}" width="60" height="14" fill="#ffb84d"/>
<rect class="lamp" x="${T.x - 30}" y="${T.top + 12}" width="60" height="14" fill="#fff1b8"/>
</g>
<path d="M${T.x - 10} ${T.top + 12}v14M${T.x + 10} ${T.top + 12}v14" stroke="#1d3b2d" stroke-width="2.5"/>
<path d="M${T.x - 50} ${T.top + 8}L${T.x} ${T.top - 18}L${T.x + 50} ${T.top + 8}Z"/>
<rect x="${T.x - 1.5}" y="${T.top - 34}" width="3" height="18"/>
<circle class="beacon" cx="${T.x}" cy="${T.top - 36}" r="3.5" fill="#ff6b4a" filter="url(#glow)"/>
<rect x="${T.x - 48}" y="${T.top + 30}" width="96" height="5"/>
</g>
<g fill="none" stroke="#1d3b2d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${birds}</g>
${front.map((l, i) => (i === 0 ? `<g class="sway">${p(l.d, l.fill)}</g>` : p(l.d, l.fill))).join("")}
<rect width="${VW}" height="${VH}" fill="url(#fade)"/>
</svg>`;
}
