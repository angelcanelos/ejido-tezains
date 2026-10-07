const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Con <ClientRouter /> este módulo se ejecuta una sola vez; todo se reinicia en cada
// "astro:page-load" y se limpia lo de la página anterior para no acumular listeners.
let controller = new AbortController();
const observers: IntersectionObserver[] = [];

function initReveal() {
  const items = document.querySelectorAll<HTMLElement>("[data-reveal], .draw-line");
  items.forEach((el) => {
    if (el.dataset.delay) el.style.setProperty("--delay", `${el.dataset.delay}ms`);
  });

  if (reduceMotion || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  // A fully clipped element has no visible area for the observer, so masks are
  // watched through their parent.
  const targets = new Map<Element, HTMLElement[]>();
  items.forEach((el) => {
    const watched = el.dataset.reveal === "mask" && el.parentElement ? el.parentElement : el;
    targets.set(watched, [...(targets.get(watched) ?? []), el]);
  });

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        targets.get(entry.target)?.forEach((el) => el.classList.add("is-visible"));
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
  );
  targets.forEach((_, el) => io.observe(el));
  observers.push(io);
}

function formatNumber(n: number, decimals: number) {
  return n.toLocaleString("es-MX", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function initCounters() {
  const counters = document.querySelectorAll<HTMLElement>("[data-count]");
  const run = (el: HTMLElement) => {
    const target = Number(el.dataset.count);
    const decimals = Number(el.dataset.decimals ?? 0);
    const prefix = el.dataset.prefix ?? "";
    if (reduceMotion) {
      el.textContent = prefix + formatNumber(target, decimals);
      return;
    }
    const duration = 1800;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = prefix + formatNumber(target * eased, decimals);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        run(entry.target as HTMLElement);
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.5 },
  );
  counters.forEach((el) => io.observe(el));
  observers.push(io);
}

function initParallax() {
  const layers = document.querySelectorAll<HTMLElement>("[data-parallax]");
  if (!layers.length || reduceMotion) return;
  let ticking = false;
  const update = () => {
    // Primero todas las lecturas y después todas las escrituras: intercalarlas obliga al
    // navegador a recalcular el layout por cada capa en cada frame.
    const vh = window.innerHeight;
    const moves = [...layers].map((el) => {
      const rect = el.parentElement!.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > vh) return null;
      return -rect.top * Number(el.dataset.parallax ?? 0.3);
    });
    layers.forEach((el, i) => {
      const y = moves[i];
      if (y !== null) el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
    });
    ticking = false;
  };
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true, signal: controller.signal },
  );
  update();
}

document.addEventListener("astro:page-load", () => {
  controller.abort();
  controller = new AbortController();
  observers.splice(0).forEach((io) => io.disconnect());

  initReveal();
  initCounters();
  initParallax();
});
