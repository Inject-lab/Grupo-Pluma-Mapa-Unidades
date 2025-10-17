import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { parseCNPJList } from "@/lib/cnpj";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";

export function SettingsTab() {
  const { catalogs, updateCatalog, daysUntilOutdated, setDaysUntilOutdated, exportJSON, importJSON, exportGeoJSON } = useApp();
  
  const [plumaCNPJs, setPlumaCNPJs] = useState(catalogs.PLUMA_CNPJS.join("\n"));
  const [belloCNPJs, setBelloCNPJs] = useState(catalogs.BELLO_CNPJS.join("\n"));
  const [levoCNPJs, setLevoCNPJs] = useState(catalogs.LEVO_CNPJS.join("\n"));
  
  const handleSaveCatalogs = () => {
    updateCatalog("PLUMA_CNPJS", parseCNPJList(plumaCNPJs));
    updateCatalog("BELLO_CNPJS", parseCNPJList(belloCNPJs));
    updateCatalog("LEVO_CNPJS", parseCNPJList(levoCNPJs));
    toast.success("Catálogos atualizados");
  };
  
  const handleExportJSON = () => {
    const json = exportJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `unidades-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("JSON exportado");
  };
  
  const handleExportGeoJSON = () => {
    const json = exportGeoJSON();
    const blob = new Blob([json], { type: "application/geo+json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `unidades-${new Date().toISOString().split("T")[0]}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("GeoJSON exportado");
  };
  
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        importJSON(json);
        toast.success("JSON importado com sucesso");
      } catch (error) {
        toast.error("Erro ao importar JSON");
      }
    };
    reader.readAsText(file);
  };
  
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="font-semibold mb-3 text-foreground">Catálogos de CNPJ</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="pluma-cnpjs" className="text-pluma">
              Pluma CNPJs ({parseCNPJList(plumaCNPJs).length})
            </Label>
            <Textarea
              id="pluma-cnpjs"
              placeholder="Um CNPJ por linha (14 dígitos)"
              value={plumaCNPJs}
              onChange={(e) => setPlumaCNPJs(e.target.value)}
              rows={5}
              className="font-mono text-sm"
            />
          </div>
          
          <div>
            <Label htmlFor="bello-cnpjs" className="text-bello">
              Bello CNPJs ({parseCNPJList(belloCNPJs).length})
            </Label>
            <Textarea
              id="bello-cnpjs"
              placeholder="Um CNPJ por linha (14 dígitos)"
              value={belloCNPJs}
              onChange={(e) => setBelloCNPJs(e.target.value)}
              rows={5}
              className="font-mono text-sm"
            />
          </div>
          
          <div>
            <Label htmlFor="levo-cnpjs" className="text-levo">
              Levo CNPJs ({parseCNPJList(levoCNPJs).length})
            </Label>
            <Textarea
              id="levo-cnpjs"
              placeholder="Um CNPJ por linha (14 dígitos)"
              value={levoCNPJs}
              onChange={(e) => setLevoCNPJs(e.target.value)}
              rows={5}
              className="font-mono text-sm"
            />
          </div>
          
          <Button onClick={handleSaveCatalogs} className="w-full">
            Salvar Catálogos
          </Button>
        </div>
      </Card>
      
      <Card className="p-4">
        <h3 className="font-semibold mb-3 text-foreground">Configurações Gerais</h3>
        
        <div className="space-y-3">
          <div>
            <Label htmlFor="days-outdated">Dias até considerar desatualizado</Label>
            <Input
              id="days-outdated"
              type="number"
              min="1"
              value={daysUntilOutdated}
              onChange={(e) => setDaysUntilOutdated(parseInt(e.target.value) || 7)}
            />
          </div>
        </div>
      </Card>
      
      <Card className="p-4">
        <h3 className="font-semibold mb-3 text-foreground">Export / Import</h3>
        
        <div className="space-y-2">
          <Button onClick={handleExportJSON} variant="outline" className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Exportar JSON
          </Button>
          
          <Button onClick={handleExportGeoJSON} variant="outline" className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Exportar GeoJSON
          </Button>
          
          <div>
            <Input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="cursor-pointer"
            />
          </div>
        </div>
      </Card>
      
      <Card className="p-4 bg-muted/50">
        <div className="text-sm text-muted-foreground space-y-2">
          <p className="font-medium text-foreground">ℹ️ Backend:</p>
          <p className="text-xs">
            Para funcionalidade completa (BrasilAPI, Google Geocoding, IBGE, OSRM), 
            conecte o Lovable Cloud para criar os endpoints /api/*.
          </p>
        </div>
      </Card>
    </div>
  );
}
