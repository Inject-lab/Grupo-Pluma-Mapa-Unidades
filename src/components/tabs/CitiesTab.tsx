import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApp } from "@/contexts/AppContext";
import { MapPin } from "lucide-react";

export function CitiesTab() {
  const { units } = useApp();
  
  // Count units per city
  const cityCounts = units.reduce((acc, unit) => {
    const city = unit.municipio;
    if (!acc[city]) {
      acc[city] = { total: 0, pluma: 0, bello: 0, levo: 0, revisar: 0 };
    }
    acc[city].total++;
    acc[city][unit.company.toLowerCase() as keyof typeof acc[string]]++;
    return acc;
  }, {} as Record<string, { total: number; pluma: number; bello: number; levo: number; revisar: number }>);
  
  const sortedCities = Object.entries(cityCounts)
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, 10);
  
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="font-semibold mb-3 text-foreground">Top 10 Cidades</h3>
        <ScrollArea className="h-[500px]">
          <div className="space-y-2">
            {sortedCities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma unidade processada ainda
              </p>
            ) : (
              sortedCities.map(([city, counts]) => (
                <Card
                  key={city}
                  className="p-3 hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">{city}</span>
                    </div>
                    <Badge variant="outline">{counts.total}</Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    {counts.pluma > 0 && (
                      <Badge variant="outline" className="text-xs bg-pluma/10 text-pluma">
                        Pluma: {counts.pluma}
                      </Badge>
                    )}
                    {counts.bello > 0 && (
                      <Badge variant="outline" className="text-xs bg-bello/10 text-bello">
                        Bello: {counts.bello}
                      </Badge>
                    )}
                    {counts.levo > 0 && (
                      <Badge variant="outline" className="text-xs bg-levo/10 text-levo">
                        Levo: {counts.levo}
                      </Badge>
                    )}
                    {counts.revisar > 0 && (
                      <Badge variant="outline" className="text-xs bg-status-revisar/10 text-status-revisar">
                        Revisar: {counts.revisar}
                      </Badge>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
