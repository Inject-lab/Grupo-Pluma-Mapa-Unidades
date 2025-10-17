import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { useTheme } from 'next-themes';
import { useApp } from '@/contexts/AppContext';
import PR_BORDER_COORDINATES from '../../pr-border-coordinates.js';
import type { Unit } from '@/types/unit';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Limites expandidos do Paraná com margem de erro para incluir cidades fronteiriças
const PR_BOUNDS: [[number, number], [number, number]] = [
  [-27.0, -55.0], // Southwest (com margem)
  [-22.2, -47.8]  // Northeast (com margem)
];

const PR_CENTER: [number, number] = [-24.5, -51.5];

export function Map() {
  const { theme } = useTheme();
  const { units, removeUnit, highlightedCities, routes } = useApp();
  const isDark = theme === "dark";

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const baseLayerRef = useRef<L.TileLayer | null>(null);
  const borderLayerRef = useRef<L.Polygon | null>(null);
  const grayMaskRef = useRef<L.Polygon | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const cityHighlightsRef = useRef<L.CircleMarker[]>([]);
  const routesRef = useRef<L.LayerGroup | null>(null);

  // Função global para remover unidades (acessível via window)
  useEffect(() => {
    (window as any).removeUnit = (unitId: string) => {
      if (confirm('Tem certeza que deseja remover este ponto?')) {
        removeUnit(unitId);
      }
    };

    return () => {
      delete (window as any).removeUnit;
    };
  }, [removeUnit]);

  // Initialize Leaflet map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
      zoomAnimation: true, // Re-enable smooth zoom animations
      fadeAnimation: true, // Re-enable fade animations for smoother transitions
      markerZoomAnimation: true, // Re-enable marker animations
      wheelPxPerZoomLevel: 60,
      zoomSnap: 0.25, // Allow fractional zoom for smoother experience
      zoomDelta: 0.5, // Smaller zoom steps for more fluid control
      preferCanvas: true, // Use canvas for better performance
      renderer: L.canvas({ padding: 0.5 }) // Canvas renderer with padding for smoother edges
    });

    map.setView(PR_CENTER as L.LatLngExpression, 8);
    const bounds = L.latLngBounds(PR_BOUNDS);
    map.setMaxBounds(bounds);
    map.setMinZoom(6);
    map.setMaxZoom(16); // Reduced for lighter performance

    // Configure tile layer URLs for minimal map
    const baseUrl = isDark 
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    const base = L.tileLayer(baseUrl, {
      attribution: isDark 
        ? "&copy; <a href=\"https://carto.com/\">CARTO</a> &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a> contributors"
        : "&copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a> contributors",
      maxZoom: 16,
      maxNativeZoom: 19,
      minZoom: 6,
      subdomains: ['a', 'b', 'c'],
      tileSize: 256,
      zoomOffset: 0,
      detectRetina: false,
      errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      noWrap: false,
      updateWhenIdle: false,
      updateWhenZooming: true,
      keepBuffer: 2,
      crossOrigin: true,
      opacity: 1.0
    });
    base.addTo(map);

    // Create mask coordinates (world boundary with hole for Paraná)
    const maskCoordinates = [
      // Outer boundary (world)
      [
        [-90, -180],
        [-90, 180],
        [90, 180],
        [90, -180],
        [-90, -180]
      ],
      // Inner boundary (Paraná - creates hole in mask)
      PR_BORDER_COORDINATES
    ];

    // Create lighter gray mask to hide areas outside Paraná
    const grayMask = L.polygon(maskCoordinates, {
      fillColor: isDark ? '#1a1a1a' : '#f0f0f0',
      fillOpacity: 0.6, // Reduced opacity for lighter appearance
      stroke: false
    });
    grayMask.addTo(map);

    // Create simplified Paraná border (optional, can be removed for even lighter performance)
    const border = L.polygon(PR_BORDER_COORDINATES, {
      color: isDark ? '#ffffff' : '#000000',
      weight: 1, // Reduced weight for lighter rendering
      fillOpacity: 0,
      opacity: 0.5 // Reduced opacity for subtler appearance
    });
    border.addTo(map);

    // Initialize markers layer group
    const markersGroup = L.layerGroup();
    markersGroup.addTo(map);

    // Initialize routes layer group
    const routesGroup = L.layerGroup();
    routesGroup.addTo(map);

    // Add debounced zoom event listener to reduce excessive re-renders
    let zoomTimeout: NodeJS.Timeout;

    mapRef.current = map;
    baseLayerRef.current = base;
    borderLayerRef.current = border;
    grayMaskRef.current = grayMask;
    markersRef.current = markersGroup;
    routesRef.current = routesGroup;

    // Initial marker size update after map is ready
    zoomTimeout = setTimeout(() => {
      const currentZoom = map.getZoom();
      const markerSize = getMarkerSize(currentZoom);
      markersGroup.eachLayer((layer: any) => {
        if (layer instanceof L.Marker) {
          const icon = layer.getIcon();
          if (icon && icon.options.className === 'custom-marker') {
            const markerId = (layer as any)._markerId;
            if (markerId) {
              const markerEl = document.getElementById(markerId);
              if (markerEl) {
                markerEl.style.width = `${markerSize}px`;
                markerEl.style.height = `${markerSize}px`;
              }
            }
          }
        }
      });
    }, 100);

    return () => {
      clearTimeout(zoomTimeout);
    };
  }, []);

  // Switch basemap when theme changes
  useEffect(() => {
    const base = baseLayerRef.current;
    
    if (!base) return;

    // Using reliable tile sources with proper zoom limits
    const url = isDark
      ? "https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    // @ts-ignore - Leaflet types don't include setUrl overload generics
    base.setUrl(url);

    // Update border and mask colors based on theme
    const border = borderLayerRef.current;
    const grayMask = grayMaskRef.current;
    
    if (border) {
      border.setStyle({
        color: isDark ? '#ffffff' : '#000000'
      });
    }
    
    if (grayMask) {
      grayMask.setStyle({
        fillColor: isDark ? '#1a1a1a' : '#f0f0f0'
      });
    }
  }, [isDark]);

  // Update markers when units change - optimized with useMemo for marker creation
  const markerElements = useMemo(() => {
    return units.map((unit) => {
      if (!unit.lat || !unit.lng) return null;
      
      // Create custom icon based on company type
      const getMarkerColor = (company: string) => {
        switch (company) {
          case 'PLUMA': return '#10B981'; // Green
          case 'BELLO': return '#3B82F6'; // Blue
          case 'LEVO': return '#8B5CF6'; // Purple
          default: return '#6B7280'; // Gray
        }
      };

      const markerColor = getMarkerColor(unit.company);
      
      return {
        unit,
        markerColor,
        markerId: `marker-${unit.id}-${unit.cnpj || 'manual'}`
      };
    }).filter(Boolean);
  }, [units]);

  // Extract available cities from units
  useEffect(() => {
    // Effect removed as investment cities feature was removed
  }, [units]);

  // Function to calculate marker size based on zoom level
  const getMarkerSize = useCallback((zoomLevel: number) => {
    // Base size at zoom level 8
    const baseSize = 12;
    const minSize = 8;
    const maxSize = 24;
    
    // Calculate size based on zoom (more responsive scaling)
    const size = baseSize + (zoomLevel - 8) * 1.5;
    
    // Clamp between min and max
    return Math.max(minSize, Math.min(maxSize, size));
  }, []);

  // Function to update marker sizes based on current zoom
  const updateMarkerSizes = useCallback(() => {
    const map = mapRef.current;
    const markersGroup = markersRef.current;
    
    if (!map || !markersGroup) return;
    
    const currentZoom = map.getZoom();
    const markerSize = getMarkerSize(currentZoom);
    
    markersGroup.eachLayer((layer: any) => {
      if (layer instanceof L.Marker) {
        const icon = layer.getIcon();
        if (icon && icon.options.className === 'custom-marker') {
          // Get the marker color from the stored data
          const markerId = layer._markerId;
          const markerData = markerElements.find(m => m?.markerId === markerId);
          
          if (markerData) {
            const newIcon = L.divIcon({
              className: 'custom-marker',
              html: `
                <div style="
                  background-color: ${markerData.markerColor};
                  width: ${markerSize}px;
                  height: ${markerSize}px;
                  border-radius: 50%;
                  border: 2px solid white;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                "></div>
              `,
              iconSize: [markerSize, markerSize],
              iconAnchor: [markerSize / 2, markerSize / 2],
            });
            
            layer.setIcon(newIcon);
          }
        }
      }
    });
  }, [markerElements, getMarkerSize]);

  // Create investment city labels
  const createInvestmentLabels = useCallback(() => {
    // Function removed as investment cities feature was removed
  }, []);

  // Update investment labels when units change
  useEffect(() => {
    // Effect removed as investment cities feature was removed
  }, [createInvestmentLabels]);

  useEffect(() => {
    const markersGroup = markersRef.current;
    const map = mapRef.current;
    if (!markersGroup || !map) return;

    // Clear existing markers
    markersGroup.clearLayers();

    const currentZoom = map.getZoom();
    const markerSize = getMarkerSize(currentZoom);

    // Add markers for each unit using the memoized data
    markerElements.forEach((markerData) => {
      if (!markerData) return;
      
      const { unit, markerColor, markerId } = markerData;
      
      // Create custom marker icon with responsive size
      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            background-color: ${markerColor};
            width: ${markerSize}px;
            height: ${markerSize}px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          "></div>
        `,
        iconSize: [markerSize, markerSize],
        iconAnchor: [markerSize / 2, markerSize / 2],
      });

      // Create marker with responsive size and store markerId for updates
      const marker = L.marker([unit.lat, unit.lng], { 
        icon: customIcon
      });

      // Use a unique key for each marker to avoid React warnings
      (marker as any)._markerId = markerId;

      // Helper function to format CNPJ
      const formatCNPJ = (cnpj: string) => {
        const cleaned = cnpj.replace(/\D/g, '');
        return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
      };

      // Build complete address
      const buildAddress = (unit: Unit) => {
        const parts = [];
        if (unit.logradouro) parts.push(unit.logradouro);
        if (unit.numero) parts.push(unit.numero);
        if (unit.complemento) parts.push(unit.complemento);
        if (unit.bairro) parts.push(unit.bairro);
        if (unit.municipio && unit.uf) parts.push(`${unit.municipio} - ${unit.uf}`);
        if (unit.cep) parts.push(`CEP: ${unit.cep}`);
        return parts.join(', ');
      };

      // Create popup content
      const popupContent = `
        <div style="min-width: 280px; font-family: system-ui;">
          <div style="border-bottom: 2px solid ${markerColor}; padding-bottom: 8px; margin-bottom: 12px;">
            <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #1f2937; display: flex; align-items: center; gap: 8px;">
              ${unit.razao_social}
              <span style="
                background: ${markerColor}; 
                color: white; 
                padding: 2px 8px; 
                border-radius: 12px; 
                font-size: 11px; 
                font-weight: 500;
              ">${unit.company}</span>
            </h3>
          </div>
          
          <div style="display: grid; gap: 10px; margin-bottom: 12px;">
            ${unit.cnpj ? `
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 12px; color: #6b7280; min-width: 80px; font-weight: 500;">CNPJ:</span>
                <span style="font-size: 12px; color: #374151; font-family: monospace; font-weight: 500;">${formatCNPJ(unit.cnpj)}</span>
              </div>
            ` : ''}
            
            ${unit.nome_fantasia ? `
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 12px; color: #6b7280; min-width: 80px; font-weight: 500;">Nome Fantasia:</span>
                <span style="font-size: 12px; color: #374151; font-weight: 500;">${unit.nome_fantasia}</span>
              </div>
            ` : ''}
            
            ${buildAddress(unit) ? `
              <div style="display: flex; align-items: flex-start; gap: 8px;">
                <span style="font-size: 12px; color: #6b7280; min-width: 80px; font-weight: 500; flex-shrink: 0;">Endereço:</span>
                <span style="font-size: 12px; color: #374151; line-height: 1.4;">${buildAddress(unit)}</span>
              </div>
            ` : ''}
            
            ${unit.custom_description ? `
              <div style="display: flex; align-items: flex-start; gap: 8px;">
                <span style="font-size: 12px; color: #6b7280; min-width: 80px; font-weight: 500; flex-shrink: 0;">Atividades:</span>
                <span style="font-size: 12px; color: #374151; line-height: 1.4;">${unit.custom_description}</span>
              </div>
            ` : ''}
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 8px;">
            <button 
              onclick="
                if(confirm('Tem certeza que deseja remover este ponto?')) {
                  window.dispatchEvent(new CustomEvent('removeUnit', { detail: { id: '${unit.id}' } }));
                }
              "
              style="
                width: 100%; 
                background: #ef4444; 
                color: white; 
                border: none; 
                padding: 6px 12px; 
                border-radius: 6px; 
                font-size: 12px; 
                font-weight: 500; 
                cursor: pointer;
                transition: background-color 0.2s;
              "
              onmouseover="this.style.background='#dc2626'"
              onmouseout="this.style.background='#ef4444'"
            >
              🗑️ Remover Ponto
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'custom-popup'
      });

      // Add marker to group
      markersGroup.addLayer(marker);
    });
  }, [markerElements, getMarkerSize]);

  // Add zoom event listener to update marker sizes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleZoomEnd = () => {
      updateMarkerSizes();
    };

    map.on('zoomend', handleZoomEnd);

    return () => {
      map.off('zoomend', handleZoomEnd);
    };
  }, [updateMarkerSizes]);

  // Separate useEffect for event listeners
  useEffect(() => {
    const handleRemoveUnit = (event: any) => {
      removeUnit(event.detail.id);
    };

    window.addEventListener('removeUnit', handleRemoveUnit);

    return () => {
      window.removeEventListener('removeUnit', handleRemoveUnit);
    };
  }, [removeUnit]);

  // Effect para destacar múltiplas cidades
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing highlights
    cityHighlightsRef.current.forEach(marker => {
      if (mapRef.current) {
        mapRef.current.removeLayer(marker);
      }
    });
    cityHighlightsRef.current = [];

    // Add new highlights for each selected city
    if (highlightedCities.length > 0) {
      highlightedCities.forEach((city, index) => {
        const cityMarker = L.circleMarker([city.lat, city.lng], {
          radius: 18, // Maior que os marcadores de unidades (que são ~12px)
          fillColor: '#EF4444',
          color: '#DC2626',
          weight: 3,
          opacity: 1,
          fillOpacity: 0.7,
          className: 'city-highlight-marker'
        });

        // Popup que aparece apenas quando clicado
        cityMarker.bindPopup(`
          <div style="padding: 12px; text-align: center; min-width: 200px;">
            <div style="font-weight: 700; color: #DC2626; margin-bottom: 8px; font-size: 16px;">
              🎯 CIDADE ALVO
            </div>
            <div style="font-size: 18px; font-weight: 700; color: #1F2937; text-transform: uppercase; letter-spacing: 1px;">
              ${city.name}
            </div>
            <div style="font-size: 12px; color: #6B7280; margin-top: 4px; font-style: italic;">
              Cidade selecionada para investimento
            </div>
          </div>
        `, {
          closeButton: true,
          autoClose: true,
          closeOnClick: true
        });

        cityMarker.addTo(mapRef.current);
        cityHighlightsRef.current.push(cityMarker);
      });

      // Center map on the first highlighted city if there are any
      if (highlightedCities.length > 0) {
        const firstCity = highlightedCities[0];
        mapRef.current.setView([firstCity.lat, firstCity.lng], 12, {
          animate: true,
          duration: 1.0
        });
      }
    }
  }, [highlightedCities]);

  // Desenhar rotas no mapa (última rota)
  useEffect(() => {
    const map = mapRef.current;
    const routesGroup = routesRef.current;
    if (!map || !routesGroup) return;

    // Limpar rotas existentes
    routesGroup.clearLayers();

    if (!routes || routes.length === 0) return;
    const latest = routes[routes.length - 1];

    // Preferir geometria calculada; se não houver, cair para pontos
    const coords = latest.geometry && latest.geometry.length > 1
      ? latest.geometry
      : latest.points.map(p => [p.lat, p.lng]);
    if (!coords || coords.length < 2) return;

    const isOsrm = latest.type === 'osrm';
    const polyline = L.polyline(coords as any, {
      color: isOsrm ? '#2563EB' : '#22C55E', // Azul para OSRM, Verde para Haversine
      weight: 5,
      opacity: 0.9,
      dashArray: isOsrm ? undefined : '6 6',
      lineJoin: 'round',
      lineCap: 'round'
    });

    routesGroup.addLayer(polyline);

    // Ajustar mapa para mostrar toda a rota
    try {
      const bounds = L.latLngBounds(coords as [number, number][]);
      map.fitBounds(bounds, { padding: [40, 40] });
    } catch (e) {
      // ignore bounds errors
    }
  }, [routes]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {/* Legend - Simplified */}
      <div className="absolute bottom-6 left-6 z-[1000] bg-card/90 backdrop-blur-md border border-border rounded-xl shadow-lg p-4 min-w-[200px]">
        <div className="text-sm font-semibold mb-3 text-foreground flex items-center gap-2">
          <div className="w-1 h-4 bg-primary rounded-full" />
          Empresas
        </div>
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5 text-sm">
            <div className="w-4 h-4 rounded-full bg-pluma shadow-sm" />
            <span className="text-foreground font-medium">Pluma</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            <div className="w-4 h-4 rounded-full bg-bello shadow-sm" />
            <span className="text-foreground font-medium">Bello</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            <div className="w-4 h-4 rounded-full bg-levo shadow-sm" />
            <span className="text-foreground font-medium">Levo</span>
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-6 h-0.5 border-t-2 border-dashed border-bello" />
            <span>Limite do Paraná</span>
          </div>
        </div>
      </div>
    </div>
  );
}
