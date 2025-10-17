import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useApp } from "@/contexts/AppContext";
import { Separator } from "@/components/ui/separator";

export function MapTab() {
  const {
    visibleCompanies,
    toggleCompanyVisibility,
    showHeatmap,
    setShowHeatmap,
    showChoropleth,
    setShowChoropleth,
    showMunicipalities,
    setShowMunicipalities,
    showDrawings,
    setShowDrawings,
    units,
  } = useApp();
  
  const plumaCount = units.filter((u) => u.company === "PLUMA").length;
  const belloCount = units.filter((u) => u.company === "BELLO").length;
  const levoCount = units.filter((u) => u.company === "LEVO").length;
  const revisarCount = units.filter((u) => u.company === "REVISAR").length;
  
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="font-semibold mb-3 text-foreground">Visibilidade das Empresas</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="show-pluma" className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-pluma"></div>
              Pluma ({plumaCount})
            </Label>
            <Switch
              id="show-pluma"
              checked={visibleCompanies.has("PLUMA")}
              onCheckedChange={() => toggleCompanyVisibility("PLUMA")}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="show-bello" className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-bello"></div>
              Bello ({belloCount})
            </Label>
            <Switch
              id="show-bello"
              checked={visibleCompanies.has("BELLO")}
              onCheckedChange={() => toggleCompanyVisibility("BELLO")}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="show-levo" className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-levo"></div>
              Levo ({levoCount})
            </Label>
            <Switch
              id="show-levo"
              checked={visibleCompanies.has("LEVO")}
              onCheckedChange={() => toggleCompanyVisibility("LEVO")}
            />
          </div>
          
          {revisarCount > 0 && (
            <div className="flex items-center justify-between">
              <Label htmlFor="show-revisar" className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-status-revisar"></div>
                Revisar ({revisarCount})
              </Label>
              <Switch
                id="show-revisar"
                checked={visibleCompanies.has("REVISAR")}
                onCheckedChange={() => toggleCompanyVisibility("REVISAR")}
              />
            </div>
          )}
        </div>
      </Card>
      
      <Card className="p-4">
        <h3 className="font-semibold mb-3 text-foreground">Camadas do Mapa</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="show-municipalities">Municípios</Label>
            <Switch
              id="show-municipalities"
              checked={showMunicipalities}
              onCheckedChange={setShowMunicipalities}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="show-drawings">Desenhos</Label>
            <Switch
              id="show-drawings"
              checked={showDrawings}
              onCheckedChange={setShowDrawings}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <Label htmlFor="show-heatmap">Heatmap</Label>
            <Switch
              id="show-heatmap"
              checked={showHeatmap}
              onCheckedChange={setShowHeatmap}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="show-choropleth">Choropleth</Label>
            <Switch
              id="show-choropleth"
              checked={showChoropleth}
              onCheckedChange={setShowChoropleth}
            />
          </div>
        </div>
      </Card>
      
      <Card className="p-4 bg-muted/50">
        <div className="text-sm text-muted-foreground space-y-2">
          <p className="font-medium text-foreground">💡 Controles:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Clique em municípios para spotlight</li>
            <li>Use ferramentas de desenho no mapa</li>
            <li>Heatmap mostra densidade de pontos</li>
            <li>Choropleth colore municípios por contagem</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
