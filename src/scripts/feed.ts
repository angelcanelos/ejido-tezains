// Feed de noticias: carga progresiva al hacer scroll, "Ver más", compartir y visor de fotos.

const BATCH = 5;

// Con <ClientRouter /> el módulo se ejecuta una vez; se inicializa en cada visita a la página.
let controller = new AbortController();
let feedObserver: IntersectionObserver | null = null;

function initFeed() {
  initLightbox();
  const feed = document.querySelector<HTMLElement>("[data-feed]");
  if (!feed) return;

  const sentinel = feed.querySelector<HTMLElement>("[data-sentinel]")!;
  const end = feed.querySelector<HTMLElement>("[data-end]");
  const pending = () => [...feed.querySelectorAll<HTMLElement>("[data-later][hidden]")];

  function showMore(count = BATCH) {
    const next = pending().slice(0, count);
    next.forEach((el) => (el.hidden = false));
    if (pending().length === 0) {
      sentinel.hidden = true;
      if (end) end.hidden = false;
    }
    return next.length;
  }

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && showMore() === 0) io.disconnect();
      },
      { rootMargin: "800px 0px" },
    );
    io.observe(sentinel);
    feedObserver = io;
  } else {
    showMore(Infinity);
  }

  /** Un enlace directo a un post (/noticias#id) muestra todos los anteriores para poder llegar a él. */
  function revealHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    const target = id ? document.getElementById(id) : null;
    if (!target?.matches("[data-post]")) return;
    const all = [...feed!.querySelectorAll<HTMLElement>("[data-post]")];
    showMore(all.indexOf(target) + 1);
    requestAnimationFrame(() => target.scrollIntoView({ behavior: "smooth", block: "start" }));
  }
  revealHash();
  window.addEventListener("hashchange", revealHash, { signal: controller.signal });

  // ---------- Ver más / compartir / abrir foto ----------
  feed.addEventListener("click", async (e) => {
    const el = e.target as HTMLElement;
    const post = el.closest<HTMLElement>("[data-post]");
    if (!post) return;

    const more = el.closest<HTMLButtonElement>("[data-more]");
    if (more) {
      const text = post.querySelector<HTMLElement>("[data-text]")!;
      const open = text.classList.toggle("line-clamp-6") === false;
      more.textContent = open ? "Ver menos" : "Ver más";
      return;
    }

    const share = el.closest<HTMLButtonElement>("[data-share]");
    if (share) {
      const url = `${location.origin}/noticias#${post.id}`;
      const text = post.querySelector("[data-text]")?.textContent?.trim().slice(0, 120);
      if (navigator.share) {
        await navigator.share({ title: document.title, text, url }).catch(() => {});
      } else {
        await navigator.clipboard?.writeText(url);
        const tip = document.createElement("span");
        tip.className = "toast";
        tip.textContent = "¡Enlace copiado!";
        share.append(tip);
        tip.addEventListener("animationend", () => tip.remove());
      }
      return;
    }

    const open = el.closest<HTMLElement>("[data-open]");
    if (open) openLightbox(JSON.parse(post.dataset.images ?? "[]"), Number(open.dataset.open));
  });
}

// ---------- Visor de fotos ----------

type Foto = { src: string; alt: string };
let dialog: HTMLDialogElement | null = null;
let fotos: Foto[] = [];
let index = 0;

function render() {
  if (!dialog) return;
  const img = dialog.querySelector<HTMLImageElement>("[data-lb-img]")!;
  const foto = fotos[index];
  img.src = foto.src;
  img.alt = foto.alt;
  dialog.querySelector("[data-lb-count]")!.textContent = fotos.length > 1 ? `${index + 1} / ${fotos.length}` : "";
  const alt = dialog.querySelector<HTMLElement>("[data-lb-alt]")!;
  alt.textContent = foto.alt;
  alt.hidden = !foto.alt;
  dialog.querySelectorAll<HTMLElement>("[data-lb-prev], [data-lb-next]").forEach((b) => (b.hidden = fotos.length < 2));
  // Precarga la siguiente
  if (fotos.length > 1) new Image().src = fotos[(index + 1) % fotos.length].src;
}

function go(step: number) {
  index = (index + step + fotos.length) % fotos.length;
  render();
}

function openLightbox(list: Foto[], start: number) {
  if (!dialog || list.length === 0) return;
  fotos = list;
  index = start;
  render();
  dialog.showModal();
  document.documentElement.style.overflow = "hidden";
}

function initLightbox() {
  dialog = document.querySelector<HTMLDialogElement>("[data-lightbox]");
  if (!dialog) return;
  const lb = dialog;
  lb.addEventListener("close", () => (document.documentElement.style.overflow = ""));
  lb.querySelector("[data-lb-close]")!.addEventListener("click", () => lb.close());
  lb.querySelector("[data-lb-prev]")!.addEventListener("click", () => go(-1));
  lb.querySelector("[data-lb-next]")!.addEventListener("click", () => go(1));
  lb.querySelector("[data-stage]")!.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) lb.close();
  });
  lb.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") go(-1);
    if (e.key === "ArrowRight") go(1);
  });

  // Deslizar con el dedo
  let startX: number | null = null;
  lb.addEventListener("pointerdown", (e) => (startX = e.clientX));
  lb.addEventListener("pointerup", (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 50 && fotos.length > 1) go(dx < 0 ? 1 : -1);
  });
}

document.addEventListener("astro:page-load", () => {
  controller.abort();
  controller = new AbortController();
  feedObserver?.disconnect();
  feedObserver = null;
  initFeed();
});
