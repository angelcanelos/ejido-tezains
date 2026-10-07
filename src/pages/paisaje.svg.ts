import type { APIRoute } from "astro";
import { paisajeSvg } from "../lib/paisaje";

export const GET: APIRoute = () => new Response(paisajeSvg(), { headers: { "Content-Type": "image/svg+xml" } });
