import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApp } from "@/contexts/AppContext";
import { ImportTab } from "./tabs/ImportTab";
import { CitySearch } from "./CitySearch";
import { RoutesTab } from "./tabs/RoutesTab";
import { RoutePlanner } from "./RoutePlanner";

export function Sidebar() {
  const { activeTab, setActiveTab, highlightedCities, addHighlightedCity, removeHighlightedCity, clearHighlightedCities } = useApp();
  
  const handleCityAdd = (city: { name: string; lat: number; lng: number }) => {
    addHighlightedCity(city);
  };

  const handleCityRemove = (cityName: string) => {
    removeHighlightedCity(cityName);
  };

  const handleClearCities = () => {
    clearHighlightedCities();
  };
  
  return (
    <div className="w-[380px] h-full border-r border-sidebar-border bg-sidebar/30 backdrop-blur-sm flex flex-col shadow-sm">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full grid grid-cols-2 gap-1 p-3 bg-transparent rounded-none border-b border-sidebar-border">
          <TabsTrigger value="import" className="text-sm data-[state=active]:bg-accent data-[state=active]:shadow-sm">
            Gestão de Unidades
          </TabsTrigger>
          <TabsTrigger value="routes" className="text-sm data-[state=active]:bg-accent data-[state=active]:shadow-sm">
            Rotas
          </TabsTrigger>
        </TabsList>
        
        <ScrollArea className="flex-1">
          <div className="p-4">
            {/* City Search Component - Always visible */}
            <CitySearch 
              onCityAdd={handleCityAdd}
              onClear={handleClearCities}
              selectedCities={highlightedCities}
              onCityRemove={handleCityRemove}
            />
            
            {/* Route Planner - Always visible */}
            <RoutePlanner />
            
            <TabsContent value="import" className="mt-0">
              <ImportTab />
            </TabsContent>

            <TabsContent value="routes" className="mt-0">
              <RoutesTab />
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
