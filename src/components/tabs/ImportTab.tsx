import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, Building2, Loader2 } from "lucide-react";
import { parseCNPJList, validateCNPJ, normalizeCNPJ } from "@/lib/cnpj";
import { consultarMultiplosCNPJs, type CNPJData } from "@/services/cnpjService";
import { geocodeEndereco, type GeocodingResult } from "@/services/geocodingService";
import { useApp } from "@/contexts/AppContext";
import { toast } from "sonner";
import { CompanyType } from "@/types/unit";

export function ImportTab() {
  const [cnpjText, setCnpjText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  
  const { addUnit, catalogs } = useApp();
  
  // Função para classificar empresa baseada na razão social e CNPJ
  const classifyCompany = (razaoSocial: string, cnpj: string, catalogs: any): CompanyType => {
    const razaoUpper = razaoSocial.toUpperCase();
    const cnpjNumbers = cnpj.replace(/\D/g, '');
    
    // Verifica se o CNPJ está nos catálogos específicos
    if (catalogs.PLUMA_CNPJS.includes(cnpjNumbers)) {
      return 'PLUMA';
    }
    
    if (catalogs.BELLO_CNPJS.includes(cnpjNumbers)) {
      return 'BELLO';
    }
    
    if (catalogs.LEVO_CNPJS.includes(cnpjNumbers)) {
      return 'LEVO';
    }
    
    // Classificação por palavras-chave na razão social
    if (razaoUpper.includes('BELLO') || razaoUpper.includes('BELLA')) {
      return 'BELLO';
    }
    
    if (razaoUpper.includes('LEVO')) {
      return 'LEVO';
    }
    
    if (razaoUpper.includes('PLUMA')) {
      return 'PLUMA';
    }
    
    // Se não conseguiu classificar, marca como PLUMA por padrão
    return 'PLUMA';
  };
  
  const handleImportCNPJs = async () => {
    const cnpjs = parseCNPJList(cnpjText);
    
    if (cnpjs.length === 0) {
      toast.error("Nenhum CNPJ válido encontrado");
      return;
    }
    
    setIsProcessing(true);
    setProgress(0);
    setCurrentStep("Consultando dados dos CNPJs...");
    
    try {
      // Consultar dados dos CNPJs
      const empresas = await consultarMultiplosCNPJs(cnpjs, (processed, total, current) => {
        setProgress((processed / total) * 50); // 50% para consulta CNPJ
        if (current) {
          setCurrentStep(`Consultando: ${current.razaoSocial}`);
        }
      });
      
      if (empresas.length === 0) {
        toast.error("Nenhuma empresa encontrada para os CNPJs informados");
        return;
      }
      
      setCurrentStep("Geocodificando endereços...");
      
      // Geocodificar endereços
      let processedCount = 0;
      for (const empresa of empresas) {
        try {
          const geocoding = await geocodeEndereco(empresa.endereco.enderecoCompleto);
          
          if (geocoding) {
             // Adicionar unidade ao mapa
             addUnit({
               id: `cnpj-${empresa.cnpj}`,
               cnpj: empresa.cnpj,
               razao_social: empresa.razaoSocial,
               nome_fantasia: empresa.nomeFantasia,
               logradouro: empresa.endereco.logradouro,
               numero: empresa.endereco.numero,
               complemento: empresa.endereco.complemento,
               bairro: empresa.endereco.bairro,
               municipio: empresa.endereco.municipio,
               uf: empresa.endereco.uf,
               cep: empresa.endereco.cep,
               lat: geocoding.latitude,
               lng: geocoding.longitude,
               geocoder_used: geocoding.fonte === 'google' ? 'google' : 'nominatim',
               location_type: geocoding.precisao,
               formatted_address: geocoding.enderecoFormatado,
               company: classifyCompany(empresa.razaoSocial, empresa.cnpj, catalogs),
               status: 'ATIVO',
               score: geocoding.precisao === 'ROOFTOP' ? 1.0 : 
                      geocoding.precisao === 'RANGE_INTERPOLATED' ? 0.8 :
                      geocoding.precisao === 'GEOMETRIC_CENTER' ? 0.6 : 0.4,
               source_fetched_at: new Date(),
               custom_description: empresa.atividadePrincipal,
               inside_pr: true // Será validado posteriormente
             });
            
            toast.success(`${empresa.razaoSocial} adicionada ao mapa`, {
              description: `Precisão: ${geocoding.precisao} (${geocoding.fonte})`
            });
          } else {
            toast.error(`Não foi possível geocodificar: ${empresa.razaoSocial}`, {
              description: empresa.endereco.enderecoCompleto
            });
          }
        } catch (error) {
          console.error(`Erro ao processar ${empresa.razaoSocial}:`, error);
          toast.error(`Erro ao processar: ${empresa.razaoSocial}`);
        }
        
        processedCount++;
        setProgress(50 + (processedCount / empresas.length) * 50); // 50% restante para geocoding
        setCurrentStep(`Geocodificando: ${empresa.razaoSocial}`);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      toast.success(`Processamento concluído! ${processedCount} empresas processadas`);
      setCnpjText("");
      
    } catch (error) {
      console.error("Erro no processamento:", error);
      toast.error("Erro durante o processamento dos CNPJs");
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setCurrentStep("");
    }
  };
  

  
  return (
    <div className="space-y-6">
      {isProcessing && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {currentStep}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              {progress.toFixed(0)}% concluído
            </p>
          </div>
        </Card>
      )}
      
      <Card className="p-4">
        <h3 className="font-semibold mb-3 text-foreground flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Importar CNPJs
        </h3>
        <div className="space-y-3">
          <div>
            <Label htmlFor="cnpj-list">Lista de CNPJs</Label>
            <Textarea
              id="cnpj-list"
              placeholder="Cole os CNPJs aqui (um por linha)&#10;12345678000190&#10;98765432000100"
              value={cnpjText}
              onChange={(e) => setCnpjText(e.target.value)}
              rows={8}
              className="font-mono text-sm"
              disabled={isProcessing}
            />
          </div>
          
          <Button 
            onClick={handleImportCNPJs} 
            className="w-full" 
            disabled={isProcessing || !cnpjText.trim()}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Importar e Processar
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
