import { RouteResult, Unit } from "@/types/unit";

export interface RoutePoint {
  lat: number;
  lng: number;
  unit?: Unit;
}

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

export function haversineDistanceKm(a: RoutePoint, b: RoutePoint): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

export function calcHaversineRoute(points: RoutePoint[]): RouteResult {
  if (points.length < 2) {
    throw new Error("Haversine requer pelo menos 2 pontos");
  }
  let totalKm = 0;
  for (let i = 0; i < points.length - 1; i++) {
    totalKm += haversineDistanceKm(points[i], points[i + 1]);
  }

  const id = `route-${Date.now()}`;
  return {
    id,
    points,
    distance_km: totalKm,
    type: "haversine",
    geometry: points.map((p) => [p.lat, p.lng]),
    created_at: new Date(),
  };
}

export async function calcOsrmRoute(points: RoutePoint[]): Promise<RouteResult> {
  if (points.length < 2) {
    throw new Error("OSRM requer pelo menos 2 pontos");
  }
  const coords = points
    .map((p) => `${p.lng},${p.lat}`) // OSRM expects lon,lat
    .join(";");

  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Falha na requisição OSRM: ${res.status}`);
  }
  const data = await res.json();
  if (!data.routes || data.routes.length === 0) {
    throw new Error("Resposta OSRM sem rotas");
  }

  const route = data.routes[0];
  const distanceKm = route.distance / 1000; // meters to km
  const durationMin = route.duration / 60; // seconds to minutes

  // geometry.coordinates is [[lon,lat], ...]
  const geometryLatLng: number[][] = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]]);

  const id = `route-${Date.now()}`;
  return {
    id,
    points,
    distance_km: distanceKm,
    duration_min: durationMin,
    type: "osrm",
    geometry: geometryLatLng,
    created_at: new Date(),
  };
}

export async function planRoute(points: RoutePoint[], preferOsrm = true): Promise<RouteResult> {
  if (preferOsrm) {
    try {
      return await calcOsrmRoute(points);
    } catch (e) {
      console.warn("OSRM falhou, usando Haversine.", e);
      return calcHaversineRoute(points);
    }
  }
  return calcHaversineRoute(points);
}