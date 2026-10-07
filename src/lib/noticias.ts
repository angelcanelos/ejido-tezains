import { getCollection, type CollectionEntry } from "astro:content";

export type Noticia = CollectionEntry<"noticias">;

/**
 * Base pública del bucket R2 donde están las fotos (p. ej. "https://media.tezainsforestal.com").
 * Se configura en `.env` con PUBLIC_MEDIA_URL. Sin ella se usan las fotos de `public/images/`.
 */
const MEDIA_URL = (import.meta.env.PUBLIC_MEDIA_URL || "/images").replace(/\/+$/, "");

export function mediaUrl(src: string) {
  return /^(https?:)?\/\//.test(src) || src.startsWith("/") ? src : `${MEDIA_URL}/${src.replace(/^\/+/, "")}`;
}

export async function getNoticias() {
  const all = await getCollection("noticias", ({ data }) => !data.draft);
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function formatDate(date: Date) {
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/** Texto plano del post (sin espacios extra), para resúmenes y metadatos. */
export function plainText(post: Noticia) {
  return (post.body ?? "").trim();
}

export function excerpt(post: Noticia, max = 160) {
  const text = plainText(post).replace(/\*\*/g, "").replace(/\s+/g, " ");
  return text.length > max ? `${text.slice(0, max).replace(/\s+\S*$/, "")}…` : text;
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * Texto del post como en una red social: respeta los saltos de línea (con CSS `whitespace-pre-line`),
 * convierte URLs en enlaces y resalta los #hashtags. `**negritas**` también funcionan.
 */
export function formatPostText(text: string) {
  return escapeHtml(text.trim())
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/https?:\/\/[^\s<]+[^\s<.,;:!?)]/g, (url) => `<a href="${url}" target="_blank" rel="noopener" class="text-leaf-600 hover:underline break-all">${url}</a>`)
    .replace(/(^|\s)#([\p{L}\p{N}_]+)/gu, '$1<span class="font-medium text-leaf-600">#$2</span>');
}
