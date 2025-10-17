import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Unit, DrawingFeature, RouteResult, CompanyType } from "@/types/unit";

import { 
  dbGetUnits, dbSetUnits,
  dbGetRoutes, dbSetRoutes,
  dbGetHighlightedCities, dbSetHighlightedCities,
  dbGetDrawings, dbSetDrawings,
  dbGetCatalogs, dbSetCatalogs
} from "@/services/db";

interface CompanyCatalogs {
  PLUMA_CNPJS: string[];
  BELLO_CNPJS: string[];
  LEVO_CNPJS: string[];
}

interface AppState {
  units: Unit[];
  drawings: DrawingFeature[];
  routes: RouteResult[];
  catalogs: CompanyCatalogs;
  
  // Visibility toggles
  visibleCompanies: Set<CompanyType>;
  showHeatmap: boolean;
  showChoropleth: boolean;
  showMunicipalities: boolean;
  showDrawings: boolean;
  
  // UI state
  selectedUnitId: string | null;
  selectedMunicipalityCode: string | null;
  activeTab: string;
  
  // Cities highlight for investment
  highlightedCities: { name: string; lat: number; lng: number }[];
  
  // Settings
  daysUntilOutdated: number;
  presentationMode: boolean;
}

interface AppContextType extends AppState {
  setUnits: (units: Unit[]) => void;
  addUnit: (unit: Unit) => void;
  updateUnit: (id: string, updates: Partial<Unit>) => void;
  removeUnit: (id: string) => void;
  
  setDrawings: (drawings: DrawingFeature[]) => void;
  addDrawing: (drawing: DrawingFeature) => void;
  
  setRoutes: (routes: RouteResult[]) => void;
  addRoute: (route: RouteResult) => void;
  
  setCatalogs: (catalogs: CompanyCatalogs) => void;
  updateCatalog: (company: keyof CompanyCatalogs, cnpjs: string[]) => void;
  
  toggleCompanyVisibility: (company: CompanyType) => void;
  setShowHeatmap: (show: boolean) => void;
  setShowChoropleth: (show: boolean) => void;
  setShowMunicipalities: (show: boolean) => void;
  setShowDrawings: (show: boolean) => void;
  
  setSelectedUnitId: (id: string | null) => void;
  setSelectedMunicipalityCode: (code: string | null) => void;
  setActiveTab: (tab: string) => void;
  
  setHighlightedCities: (cities: { name: string; lat: number; lng: number }[]) => void;
  addHighlightedCity: (city: { name: string; lat: number; lng: number }) => void;
  removeHighlightedCity: (cityName: string) => void;
  clearHighlightedCities: () => void;
  
  setDaysUntilOutdated: (days: number) => void;
  setPresentationMode: (mode: boolean) => void;
  
  exportJSON: () => string;
  importJSON: (json: string) => void;
  exportGeoJSON: () => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Função para carregar dados do localStorage
const loadFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

// Função para salvar dados no localStorage
const saveToLocalStorage = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [units, setUnits] = useState<Unit[]>(() => 
    loadFromLocalStorage('pluma-map-units', [])
  );
  const [drawings, setDrawings] = useState<DrawingFeature[]>(() => 
    loadFromLocalStorage('pluma-map-drawings', [])
  );
  const [routes, setRoutes] = useState<RouteResult[]>(() => 
    loadFromLocalStorage('pluma-map-routes', [])
  );
  const [catalogs, setCatalogs] = useState({
    PLUMA_CNPJS: [],
    BELLO_CNPJS: [],
    LEVO_CNPJS: [],
  });
  const [visibleCompanies, setVisibleCompanies] = useState<Set<CompanyType>>(new Set(["PLUMA", "BELLO", "LEVO"]));
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showChoropleth, setShowChoropleth] = useState(false);
  const [showMunicipalities, setShowMunicipalities] = useState(true);
  const [showDrawings, setShowDrawings] = useState(true);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedMunicipalityCode, setSelectedMunicipalityCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("import");
  const [highlightedCities, setHighlightedCities] = useState<{ name: string; lat: number; lng: number }[]>([]);
  const [daysUntilOutdated, setDaysUntilOutdated] = useState(7);
  const [presentationMode, setPresentationMode] = useState(false);

  // Inicialização a partir do banco (com migração do localStorage na primeira carga)
  useEffect(() => {
    (async () => {
      const [dbUnits, dbDrawings, dbRoutes, dbCities, dbCatalogsRec] = await Promise.all([
        dbGetUnits(),
        dbGetDrawings(),
        dbGetRoutes(),
        dbGetHighlightedCities(),
        dbGetCatalogs()
      ]);

      const hasDBData = (
        dbUnits.length || dbDrawings.length || dbRoutes.length || dbCities.length || !!dbCatalogsRec
      );

      if (hasDBData) {
        if (dbUnits.length) setUnits(dbUnits);
        if (dbDrawings.length) setDrawings(dbDrawings);
        if (dbRoutes.length) setRoutes(dbRoutes);
        if (dbCities.length) setHighlightedCities(dbCities);
        if (dbCatalogsRec) setCatalogs({
          PLUMA_CNPJS: dbCatalogsRec.PLUMA_CNPJS,
          BELLO_CNPJS: dbCatalogsRec.BELLO_CNPJS,
          LEVO_CNPJS: dbCatalogsRec.LEVO_CNPJS,
        });
      } else {
        // Migrar dados atuais (vindos do localStorage inicial) para o banco
        await dbSetUnits(units);
        await dbSetDrawings(drawings);
        await dbSetRoutes(routes);
        await dbSetHighlightedCities(highlightedCities);
        await dbSetCatalogs({ id: 'catalogs', ...catalogs });
      }
    })();
  // Rodar apenas uma vez no mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persistência contínua no banco quando o estado muda
  useEffect(() => { dbSetUnits(units); }, [units]);
  useEffect(() => { dbSetDrawings(drawings); }, [drawings]);
  useEffect(() => { dbSetRoutes(routes); }, [routes]);
  useEffect(() => { dbSetHighlightedCities(highlightedCities); }, [highlightedCities]);
  useEffect(() => { dbSetCatalogs({ id: 'catalogs', ...catalogs }); }, [catalogs]);

  const addUnit = (unit: Unit) => {
    setUnits((prev) => [...prev, unit]);
  };
  
  const updateUnit = (id: string, updates: Partial<Unit>) => {
    setUnits((prev) =>
      prev.map((unit) => (unit.id === id ? { ...unit, ...updates } : unit))
    );
  };
  
  const removeUnit = (id: string) => {
    setUnits((prev) => prev.filter((unit) => unit.id !== id));
  };
  
  const addDrawing = (drawing: DrawingFeature) => {
    setDrawings((prev) => [...prev, drawing]);
  };
  
  const addRoute = (route: RouteResult) => {
    setRoutes((prev) => [...prev, route]);
  };
  
  const updateCatalog = (company: keyof CompanyCatalogs, cnpjs: string[]) => {
    setCatalogs((prev) => ({ ...prev, [company]: cnpjs }));
  };
  
  const addHighlightedCity = (city: { name: string; lat: number; lng: number }) => {
    setHighlightedCities((prev) => {
      const exists = prev.some(c => c.name.toLowerCase() === city.name.toLowerCase());
      if (exists) return prev;
      return [...prev, city];
    });
  };
  const removeHighlightedCity = (cityName: string) => {
    setHighlightedCities((prev) => prev.filter(city => city.name.toLowerCase() !== cityName.toLowerCase()));
  };
  const clearHighlightedCities = () => {
    setHighlightedCities([]);
  };

  const toggleCompanyVisibility = (company: CompanyType) => {
    setVisibleCompanies((prev) => {
      const next = new Set(prev);
      if (next.has(company)) {
        next.delete(company);
      } else {
        next.add(company);
      }
      return next;
    });
  };
  
  const exportJSON = () => {
    return JSON.stringify(
      {
        units,
        drawings,
        catalogs,
        settings: { daysUntilOutdated },
        exported_at: new Date().toISOString(),
      },
      null,
      2
    );
  };
  
  const importJSON = (json: string) => {
    try {
      const data = JSON.parse(json);
      if (data.units) setUnits(data.units);
      if (data.drawings) setDrawings(data.drawings);
      if (data.catalogs) setCatalogs(data.catalogs);
      if (data.settings?.daysUntilOutdated) {
        setDaysUntilOutdated(data.settings.daysUntilOutdated);
      }
    } catch (error) {
      console.error("Failed to import JSON:", error);
      throw error;
    }
  };
  
  const exportGeoJSON = () => {
    const features = units.map((unit) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [unit.lng, unit.lat],
      },
      properties: {
        id: unit.id,
        cnpj: unit.cnpj,
        razao_social: unit.razao_social,
        nome_fantasia: unit.nome_fantasia,
        company: unit.company,
        status: unit.status,
        score: unit.score,
        municipio: unit.municipio,
        address: `${unit.logradouro}, ${unit.numero}`,
      },
    }));
    
    return JSON.stringify(
      {
        type: "FeatureCollection",
        features,
      },
      null,
      2
    );
  };
  
  const value = {
    units,
    drawings,
    routes,
    catalogs,
    visibleCompanies,
    showHeatmap,
    showChoropleth,
    showMunicipalities,
    showDrawings,
    selectedUnitId,
    selectedMunicipalityCode,
    activeTab,
    highlightedCities,
    daysUntilOutdated,
    presentationMode,
    // setters & actions
    setUnits,
    addUnit,
    updateUnit,
    removeUnit,
    setDrawings,
    addDrawing,
    setRoutes,
    addRoute,
    setCatalogs,
    updateCatalog,
    toggleCompanyVisibility,
    setShowHeatmap,
    setShowChoropleth,
    setShowMunicipalities,
    setShowDrawings,
    setSelectedUnitId,
    setSelectedMunicipalityCode,
    setActiveTab,
    setHighlightedCities,
    addHighlightedCity,
    removeHighlightedCity,
    clearHighlightedCities,
    setDaysUntilOutdated,
    setPresentationMode,
    exportJSON,
    importJSON,
    exportGeoJSON,
  } as any;

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
