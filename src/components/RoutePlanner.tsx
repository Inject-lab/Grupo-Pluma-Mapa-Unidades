import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useApp } from "@/contexts/AppContext";
import { planRoute } from "@/services/routingService";
import { toast } from "sonner";

export function RoutePlanner() {
  const { units, highlightedCities, addRoute, setActiveTab } = useApp();
  const [originId, setOriginId] = useState<string>("");
  const [destId, setDestId] = useState<string>("");
  const [preferOsrm, setPreferOsrm] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  const unitsOptions = useMemo(() => {
    return units.map((u) => ({
      id: `unit:${u.id}`,
      label: `${u.nome_fantasia || u.razao_social} — ${u.municipio}`,
    }));
  }, [units]);

  const citiesOptions = useMemo(() => {
    return highlightedCities.map((c) => ({
      id: `city:${c.name}`,
      label: `${c.name}`,
    }));
  }, [highlightedCities]);

  const canCalculate = originId && destId && originId !== destId;

  const handleCalculate = async () => {
    if (!canCalculate) return;

    const parsePoint = (id: string) => {
      if (id.startsWith("unit:")) {
        const uid = id.slice(5);
        const u = units.find((x) => x.id === uid);
        if (!u || u.lat == null || u.lng == null) return null;
        return { lat: u.lat, lng: u.lng, unit: u };
      }
      if (id.startsWith("city:")) {
        const name = id.slice(5);
        const c = highlightedCities.find((x) => x.name.toLowerCase() === name.toLowerCase());
        if (!c) return null;
        return { lat: c.lat, lng: c.lng };
      }
      return null;
    };

    const origin = parsePoint(originId);
    const dest = parsePoint(destId);
    if (!origin || !dest) {
      toast.error("Origem ou destino inválido");
      return;
    }

    setLoading(true);
    try {
      const route = await planRoute([origin, dest], preferOsrm);
      addRoute(route);
      toast.success(
        `Rota calculada: ${route.distance_km.toFixed(2)} km` +
          (route.duration_min ? ` • ${route.duration_min.toFixed(0)} min` : "")
      );
      setActiveTab("routes");
    } catch (e: any) {
      console.error(e);
      toast.error("Falha ao calcular rota");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 mb-4">
      <h3 className="font-semibold mb-3 text-foreground">Planejador de Rotas</h3>
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-2">
          <Label htmlFor="origin">Origem</Label>
          <select
            id="origin"
            value={originId}
            onChange={(e) => setOriginId(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none"
          >
            <option value="" disabled>
              Selecione a unidade de origem
            </option>
            {unitsOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <Label htmlFor="dest">Destino</Label>
          <select
            id="dest"
            value={destId}
            onChange={(e) => setDestId(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none"
          >
            <option value="" disabled>
              Selecione destino (unidade ou cidade de investimento)
            </option>
            <optgroup label="Unidades">
              {unitsOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </optgroup>
            {citiesOptions.length > 0 && (
              <optgroup label="Cidades de investimento">
                {citiesOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="prefer-osrm">Usar OSRM (rota real)</Label>
          <Switch id="prefer-osrm" checked={preferOsrm} onCheckedChange={setPreferOsrm} />
        </div>

        <Button className="w-full" disabled={!canCalculate || loading} onClick={handleCalculate}>
          {loading ? "Calculando..." : "Calcular Rota"}
        </Button>
      </div>
    </Card>
  );
}