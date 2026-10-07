// Microinteracciones: botones magnéticos, brillo que sigue al cursor, inclinación 3D,
// barra de progreso de lectura y línea de tiempo que se llena al hacer scroll.

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

// ---------- Cursor (listeners delegados en document: sobreviven a los cambios de página) ----------
if (finePointer && !reduceMotion) {
  let active: HTMLElement | null = null;

  const reset = (el: HTMLElement) => {
    el.style.removeProperty("--tx");
    el.style.removeProperty("--ty");
    el.style.removeProperty("--rx");
    el.style.removeProperty("--ry");
  };

  document.addEventListener(
    "pointermove",
    (e) => {
      const target = e.target as Element;

      const spot = target.closest<HTMLElement>("[data-spotlight]");
      if (spot) {
        const r = spot.getBoundingClientRect();
        spot.style.setProperty("--mx", `${e.clientX - r.left}px`);
        spot.style.setProperty("--my", `${e.clientY - r.top}px`);
      }

      const el = target.closest<HTMLElement>("[data-magnetic], [data-tilt]");
      if (active && active !== el) reset(active);
      active = el;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      if (el.matches("[data-magnetic]")) {
        el.style.setProperty("--tx", `${(x * r.width * 0.18).toFixed(1)}px`);
        el.style.setProperty("--ty", `${(y * r.height * 0.3).toFixed(1)}px`);
      } else {
        el.style.setProperty("--rx", `${(-y * 8).toFixed(2)}deg`);
        el.style.setProperty("--ry", `${(x * 10).toFixed(2)}deg`);
      }
    },
    { passive: true },
  );
  document.addEventListener("pointerleave", () => active && reset(active));
}

// ---------- Scroll: progreso de lectura y línea de tiempo ----------
let controller = new AbortController();

function initScrollEffects() {
  const progress = document.querySelector<HTMLElement>("[data-progress]");
  const timelines = [...document.querySelectorAll<HTMLElement>("[data-timeline]")];
  let ticking = false;

  const update = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress?.style.setProperty("--p", String(max > 0 ? Math.min(window.scrollY / max, 1) : 0));

    // Lecturas primero y escrituras al final: medir un punto justo después de cambiar un
    // estilo forzaba un recálculo de layout por cada punto en cada frame del scroll.
    const line = window.innerHeight * 0.6;
    const reads = timelines.map((list) => {
      const r = list.getBoundingClientRect();
      // La línea llega hasta el centro de la pantalla.
      const fill = Math.min(Math.max((line - r.top) / r.height, 0), 1);
      const dots = [...list.querySelectorAll<HTMLElement>("[data-timeline-dot]")].map(
        (dot) => [dot, dot.getBoundingClientRect().top < line] as const,
      );
      return { list, fill, dots };
    });
    reads.forEach(({ list, fill, dots }) => {
      list.style.setProperty("--fill", fill.toFixed(3));
      dots.forEach(([dot, lit]) => dot.classList.toggle("is-lit", lit));
    });
  };

  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true, signal: controller.signal });
  window.addEventListener("resize", onScroll, { passive: true, signal: controller.signal });
  update();
}

document.addEventListener("astro:page-load", () => {
  controller.abort();
  controller = new AbortController();
  initScrollEffects();
});
