// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://ejido.tezainsforestal.com',
  integrations: [react()],
  // Fuentes servidas desde el propio sitio (sin pedirlas a Google en cada visita), sólo latín y los pesos que se usan.
  fonts: [
    { provider: fontProviders.google(), name: 'Inter', cssVariable: '--font-inter', weights: ['400 700'], styles: ['normal'], subsets: ['latin'], fallbacks: ['system-ui', 'sans-serif'] },
    { provider: fontProviders.google(), name: 'Plus Jakarta Sans', cssVariable: '--font-jakarta', weights: ['500 800'], styles: ['normal'], subsets: ['latin'], fallbacks: ['system-ui', 'sans-serif'] },
    { provider: fontProviders.google(), name: 'Fraunces', cssVariable: '--font-fraunces', weights: ['500 700'], styles: ['normal'], subsets: ['latin'], fallbacks: ['Georgia', 'serif'] },
    { provider: fontProviders.google(), name: 'Caveat', cssVariable: '--font-caveat', weights: ['500'], styles: ['normal'], subsets: ['latin'], fallbacks: ['cursive'] },
    { provider: fontProviders.google(), name: 'Kalam', cssVariable: '--font-kalam', weights: ['700'], styles: ['normal'], subsets: ['latin'], fallbacks: ['cursive'] },
  ],
  // Precarga las páginas al pasar el cursor por los enlaces para que el cambio sea instantáneo.
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  vite: {
    plugins: [tailwindcss()],
    // Pre-empaquetar las dependencias del mapa; si Vite las descubre al hidratar la isla, ésta falla (504).
    optimizeDeps: {
      include: ["react", "react/jsx-dev-runtime", "react-dom/client", "maplibre-gl", "lucide-react", "clsx", "tailwind-merge"],
    },
  },
});
