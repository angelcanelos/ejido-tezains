import { useEffect, useRef } from 'react';
import GooeyNav from './GooeyNav.jsx';
import './HeaderNav.css';

// Índice del elemento activo según la ruta: "/" sólo en inicio, el resto por prefijo.
const indexFor = (items, path) => {
  const clean = path.replace(/\/$/, '') || '/';
  const idx = items.findIndex(item => (item.href === '/' ? clean === '/' : clean.startsWith(item.href)));
  return Math.max(idx, 0);
};

export default function HeaderNav({ items, currentPath = '/' }) {
  const rootRef = useRef(null);
  const initialActiveIndex = indexFor(items, currentPath);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // Los clics que disparamos nosotros sólo mueven el efecto, no navegan.
    const swallowSyncClicks = e => {
      if (root.dataset.sync === '1') e.preventDefault();
    };
    root.addEventListener('click', swallowSyncClicks, true);

    let current = initialActiveIndex;
    const sync = () => {
      const idx = indexFor(items, window.location.pathname);
      if (idx === current) return;
      current = idx;
      root.dataset.sync = '1';
      root.querySelectorAll('li a')[idx]?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      root.dataset.sync = '0';
    };

    // El header persiste entre páginas (ClientRouter), así que sigue la ruta actual.
    document.addEventListener('astro:after-swap', sync);
    return () => {
      document.removeEventListener('astro:after-swap', sync);
      root.removeEventListener('click', swallowSyncClicks, true);
    };
  }, []);

  return (
    <div ref={rootRef} className="site-nav">
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
        <defs>
          <filter id="gooey-nav-filter" filterUnits="userSpaceOnUse" x="-400" y="-300" width="1600" height="700">
            <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
            <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" />
          </filter>
        </defs>
      </svg>
      <GooeyNav
        items={items}
        initialActiveIndex={initialActiveIndex}
        animationTime={600}
        particleCount={12}
        particleDistances={[70, 10]}
        particleR={80}
        timeVariance={300}
        colors={[1, 2, 3, 1, 2, 3, 1, 4]}
      />
    </div>
  );
}
