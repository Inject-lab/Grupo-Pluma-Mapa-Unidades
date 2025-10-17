import { Card } from "@/components/ui/card";
import { useApp } from "@/contexts/AppContext";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const COLORS = {
  PLUMA: "hsl(142, 71%, 45%)",
  BELLO: "hsl(217, 91%, 60%)",
  LEVO: "hsl(271, 81%, 56%)",
  REVISAR: "hsl(280, 61%, 50%)",
};

export function StatsTab() {
  const { units } = useApp();
  
  const plumaCount = units.filter((u) => u.company === "PLUMA").length;
  const belloCount = units.filter((u) => u.company === "BELLO").length;
  const levoCount = units.filter((u) => u.company === "LEVO").length;
  const revisarCount = units.filter((u) => u.company === "REVISAR").length;
  
  const chartData = [
    { name: "Pluma", value: plumaCount, color: COLORS.PLUMA },
    { name: "Bello", value: belloCount, color: COLORS.BELLO },
    { name: "Levo", value: levoCount, color: COLORS.LEVO },
    ...(revisarCount > 0 ? [{ name: "Revisar", value: revisarCount, color: COLORS.REVISAR }] : []),
  ].filter((d) => d.value > 0);
  
  const okCount = units.filter((u) => u.score >= 80).length;
  const warningCount = units.filter((u) => u.score >= 60 && u.score < 80).length;
  const errorCount = units.filter((u) => u.score < 60).length;
  
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="font-semibold mb-3 text-foreground">Resumo Geral</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-foreground">{units.length}</div>
            <div className="text-xs text-muted-foreground">Total de Unidades</div>
          </div>
          
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-status-ok">{okCount}</div>
            <div className="text-xs text-muted-foreground">Score ≥ 80</div>
          </div>
          
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-status-warning">{warningCount}</div>
            <div className="text-xs text-muted-foreground">Score 60-79</div>
          </div>
          
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-status-error">{errorCount}</div>
            <div className="text-xs text-muted-foreground">Score &lt; 60</div>
          </div>
        </div>
      </Card>
      
      <Card className="p-4">
        <h3 className="font-semibold mb-3 text-foreground">Distribuição por Empresa</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma unidade processada ainda
          </p>
        )}
      </Card>
      
      <Card className="p-4">
        <h3 className="font-semibold mb-3 text-foreground">Por Empresa</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 bg-pluma/10 rounded">
            <span className="text-sm font-medium text-foreground">Pluma</span>
            <span className="text-sm font-bold text-pluma">{plumaCount}</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-bello/10 rounded">
            <span className="text-sm font-medium text-foreground">Bello</span>
            <span className="text-sm font-bold text-bello">{belloCount}</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-levo/10 rounded">
            <span className="text-sm font-medium text-foreground">Levo</span>
            <span className="text-sm font-bold text-levo">{levoCount}</span>
          </div>
          {revisarCount > 0 && (
            <div className="flex items-center justify-between p-2 bg-status-revisar/10 rounded">
              <span className="text-sm font-medium text-foreground">Revisar</span>
              <span className="text-sm font-bold text-status-revisar">{revisarCount}</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
