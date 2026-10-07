export const start = { name: "Santiago Papasquiaro", lng: -105.4208, lat: 25.046 };
export const end = { name: "Forestal Tezains", lng: -105.9733, lat: 24.9553 };

// Driving routes Santiago → Tezains from the public OSRM server (used by scripts/mapa-ruta.mjs).
export async function fetchRoutes(signal) {
  const response = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&alternatives=true`,
    { signal },
  );
  const data = await response.json();
  return (data.routes ?? []).map((route) => ({
    coordinates: route.geometry.coordinates,
    duration: route.duration,
    distance: route.distance,
  }));
}

/** Ramer–Douglas–Peucker: drops points closer than `tolerance` (degrees) to the simplified line. */
export function simplify(points, tolerance) {
  if (points.length < 3) return points;
  const [ax, ay] = points[0];
  const [bx, by] = points[points.length - 1];
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  let maxDist = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const dist = Math.abs(dy * points[i][0] - dx * points[i][1] + bx * ay - by * ax) / len;
    if (dist > maxDist) {
      maxDist = dist;
      index = i;
    }
  }
  if (maxDist <= tolerance) return [points[0], points[points.length - 1]];
  return [...simplify(points.slice(0, index + 1), tolerance).slice(0, -1), ...simplify(points.slice(index), tolerance)];
}
