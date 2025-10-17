import { AppProvider } from "@/contexts/AppContext";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Map } from "@/components/Map";
import { ThemeProvider } from "next-themes";

const Index = () => {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <AppProvider>
        <div className="flex flex-col h-screen w-full bg-background">
          <Header />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 relative">
              <Map />
            </main>
          </div>
        </div>
      </AppProvider>
    </ThemeProvider>
  );
};

export default Index;
