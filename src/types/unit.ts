export type CompanyType = "PLUMA" | "BELLO" | "LEVO";

export type UnitStatus = 
  | "OK" 
  | "REVISAR" 
  | "FORA_PR" 
  | "DIVERGENCIA_MUNICIPIO" 
  | "DESATUALIZADO";

export type GeocoderType = "google" | "nominatim" | "manual";

export type LocationType = 
  | "ROOFTOP" 
  | "RANGE_INTERPOLATED" 
  | "GEOMETRIC_CENTER" 
  | "APPROXIMATE";

export interface Candidate {
  lat: number;
  lng: number;
  formatted_address: string;
  location_type: LocationType;
  score: number;
}

export interface Unit {
  id: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  
  // Address from BrasilAPI
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  
  // Geocoding
  lat: number;
  lng: number;
  geocoder_used: GeocoderType;
  location_type?: LocationType;
  formatted_address?: string;
  
  // Company classification
  company: CompanyType;
  
  // Status & validation
  status: UnitStatus;
  score: number;
  
  // Candidates for ambiguous results
  candidates?: Candidate[];
  
  // Metadata
  source_fetched_at: Date;
  source_hash?: string;
  
  // Custom fields (for manual entries)
  custom_description?: string;
  custom_icon?: string;
  
  // Validation flags
  partial_match?: boolean;
  inside_pr?: boolean;
  municipality_match?: boolean;
  cep_match?: boolean;
}

export interface DrawingFeature {
  id: string;
  type: "polygon" | "polyline" | "circle" | "rectangle" | "marker";
  coordinates: number[][] | number[];
  properties: {
    name?: string;
    description?: string;
    color?: string;
    radius?: number;
  };
}

export interface RouteResult {
  id: string;
  points: Array<{ lat: number; lng: number; unit?: Unit }>;
  distance_km: number;
  duration_min?: number;
  type: "haversine" | "osrm";
  geometry?: number[][];
  created_at: Date;
}
