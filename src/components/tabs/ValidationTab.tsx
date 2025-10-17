import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApp } from "@/contexts/AppContext";
import { getScoreColor } from "@/lib/scoring";

export function ValidationTab() {
  const { units } = useApp();
  
  const sortedUnits = [...units].sort((a, b) => a.score - b.score);
  
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="font-semibold mb-3 text-foreground">Resumo da Validação</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total:</span>
            <span className="font-medium">{units.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">OK (≥80):</span>
            <span className="font-medium text-status-ok">
              {units.filter((u) => u.score >= 80).length}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Aceitável (60-79):</span>
            <span className="font-medium text-status-warning">
              {units.filter((u) => u.score >= 60 && u.score < 80).length}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Revisar (&lt;60):</span>
            <span className="font-medium text-status-error">
              {units.filter((u) => u.score < 60).length}
            </span>
          </div>
        </div>
      </Card>
      
      <Card className="p-4">
        <h3 className="font-semibold mb-3 text-foreground">Unidades por Score</h3>
        <ScrollArea className="h-96">
          <div className="space-y-2">
            {sortedUnits.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma unidade processada ainda
              </p>
            ) : (
              sortedUnits.map((unit) => (
                <Card key={unit.id} className="p-3 hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate text-foreground">
                        {unit.razao_social}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {unit.municipio} - {unit.uf}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="ml-2"
                      style={{
                        backgroundColor: `hsl(var(--${getScoreColor(unit.score)}) / 0.1)`,
                        color: `hsl(var(--${getScoreColor(unit.score)}))`,
                        borderColor: `hsl(var(--${getScoreColor(unit.score)}))`,
                      }}
                    >
                      {unit.score}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge 
                      variant="outline" 
                      className="text-xs"
                      style={{
                        backgroundColor: `hsl(var(--${unit.company.toLowerCase()}) / 0.1)`,
                        color: `hsl(var(--${unit.company.toLowerCase()}))`,
                      }}
                    >
                      {unit.company}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {unit.location_type || "N/A"}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {unit.geocoder_used}
                    </Badge>
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
