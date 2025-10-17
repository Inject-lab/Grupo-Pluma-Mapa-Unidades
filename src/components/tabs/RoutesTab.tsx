import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApp } from "@/contexts/AppContext";
import { Route, Trash2 } from "lucide-react";

export function RoutesTab() {
  const { routes } = useApp();
  
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="font-semibold mb-3 text-foreground">Histórico de Rotas</h3>
        <ScrollArea className="h-96">
          <div className="space-y-2">
            {routes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma rota calculada ainda
              </p>
            ) : (
              routes.map((route) => (
                <Card key={route.id} className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Route className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        {route.points.length} pontos
                      </span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Distância:</span>
                      <span className="font-medium">
                        {route.distance_km.toFixed(2)} km
                      </span>
                    </div>
                    {route.duration_min && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duração:</span>
                        <span className="font-medium">
                          {route.duration_min.toFixed(0)} min
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipo:</span>
                      <Badge variant="outline" className="text-xs">
                        {route.type}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>
      
      <Card className="p-4 bg-muted/50">
        <div className="text-sm text-muted-foreground space-y-2">
          <p className="font-medium text-foreground">💡 Como usar:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Selecione 2+ unidades no mapa</li>
            <li>Haversine: distância geodésica</li>
            <li>OSRM: rota rodoviária real</li>
            <li>Exportar rota como GeoJSON</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
