import Dexie, { Table } from 'dexie';
import type { Unit, DrawingFeature, RouteResult } from '@/types/unit';

export interface CatalogsRecord {
  id: string; // fixed: 'catalogs'
  PLUMA_CNPJS: string[];
  BELLO_CNPJS: string[];
  LEVO_CNPJS: string[];
}

export interface HighlightedCityRecord {
  name: string;
  lat: number;
  lng: number;
}

class PlumaMapDB extends Dexie {
  units!: Table<Unit, string>;
  routes!: Table<RouteResult, string>;
  highlightedCities!: Table<HighlightedCityRecord, string>;
  drawings!: Table<DrawingFeature, string>;
  catalogs!: Table<CatalogsRecord, string>;

  constructor() {
    super('PlumaMapDB');
    this.version(1).stores({
      units: 'id, municipio, company',
      routes: 'id, type, created_at',
      highlightedCities: 'name',
      drawings: 'id, type',
      catalogs: 'id',
    });
  }
}

export const db = new PlumaMapDB();

// Units
export async function dbGetUnits(): Promise<Unit[]> {
  return db.units.toArray();
}
export async function dbSetUnits(units: Unit[]): Promise<void> {
  await db.units.clear();
  if (units.length) await db.units.bulkAdd(units);
}
export async function dbAddUnit(unit: Unit): Promise<void> {
  await db.units.put(unit);
}
export async function dbUpdateUnit(id: string, updates: Partial<Unit>): Promise<void> {
  await db.units.update(id, updates as any);
}
export async function dbRemoveUnit(id: string): Promise<void> {
  await db.units.delete(id);
}

// Routes
export async function dbGetRoutes(): Promise<RouteResult[]> {
  return db.routes.toArray();
}
export async function dbSetRoutes(routes: RouteResult[]): Promise<void> {
  await db.routes.clear();
  if (routes.length) await db.routes.bulkAdd(routes);
}
export async function dbAddRoute(route: RouteResult): Promise<void> {
  await db.routes.put(route);
}

// Highlighted Cities
export async function dbGetHighlightedCities(): Promise<HighlightedCityRecord[]> {
  return db.highlightedCities.toArray();
}
export async function dbSetHighlightedCities(cities: HighlightedCityRecord[]): Promise<void> {
  await db.highlightedCities.clear();
  if (cities.length) await db.highlightedCities.bulkAdd(cities);
}
export async function dbAddHighlightedCity(city: HighlightedCityRecord): Promise<void> {
  await db.highlightedCities.put(city);
}
export async function dbRemoveHighlightedCity(name: string): Promise<void> {
  await db.highlightedCities.delete(name);
}

// Drawings
export async function dbGetDrawings(): Promise<DrawingFeature[]> {
  return db.drawings.toArray();
}
export async function dbSetDrawings(drawings: DrawingFeature[]): Promise<void> {
  await db.drawings.clear();
  if (drawings.length) await db.drawings.bulkAdd(drawings);
}
export async function dbAddDrawing(drawing: DrawingFeature): Promise<void> {
  await db.drawings.put(drawing);
}

// Catalogs
export async function dbGetCatalogs(): Promise<CatalogsRecord | null> {
  const rec = await db.catalogs.get('catalogs');
  return rec ?? null;
}
export async function dbSetCatalogs(catalogs: CatalogsRecord): Promise<void> {
  await db.catalogs.put({ ...catalogs, id: 'catalogs' });
}