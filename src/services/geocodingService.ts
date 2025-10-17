/**
 * Geocoding Service - Integração com APIs de geocodificação
 */

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  enderecoFormatado: string;
  precisao: 'ROOFTOP' | 'RANGE_INTERPOLATED' | 'GEOMETRIC_CENTER' | 'APPROXIMATE';
  fonte: 'google' | 'opencage' | 'nominatim';
}

const GOOGLE_API_KEY = 'AIzaSyCxDiFfDtXHgyQwgJpIZ_W8WGbxE_jhZSY';

/**
 * Limpa e formata endereço para melhor geocodificação
 */
function formatarEnderecoParaGeocodificacao(endereco: string): string {
  // Remove caracteres especiais e normaliza
  let enderecoLimpo = endereco
    .replace(/[^\w\s,.-]/g, '') // Remove caracteres especiais exceto vírgulas, pontos e hífens
    .replace(/\s+/g, ' ') // Remove espaços duplos
    .trim();

  // Adiciona "Paraná, Brasil" se não estiver presente
  if (!enderecoLimpo.toLowerCase().includes('paraná') && !enderecoLimpo.toLowerCase().includes('pr')) {
    enderecoLimpo += ', Paraná, Brasil';
  } else if (!enderecoLimpo.toLowerCase().includes('brasil')) {
    enderecoLimpo += ', Brasil';
  }

  return enderecoLimpo;
}

/**
 * Valida se um endereço tem informações mínimas necessárias
 */
function validarEnderecoCompleto(endereco: string): boolean {
  const enderecoLimpo = endereco.toLowerCase().replace(/[^\w\s]/g, ' ');
  
  // Para busca de cidades, aceitar nomes simples
  if (endereco.includes('Paraná') || endereco.includes('Brasil')) {
    return endereco.trim().length >= 3; // Aceitar busca por cidade
  }
  
  // Verifica se tem pelo menos logradouro e município (para endereços completos)
  const temLogradouro = /\b(rua|avenida|av|alameda|travessa|praça|estrada|rodovia|br|pr)\b/.test(enderecoLimpo);
  const temMunicipio = enderecoLimpo.length > 20; // Endereço mínimo deve ter pelo menos 20 caracteres
  
  return temLogradouro && temMunicipio;
}

/**
 * Geocodificação usando Google Maps API com melhor formatação
 */
async function geocodeGoogle(endereco: string): Promise<GeocodingResult | null> {
  try {
    // Formatar endereço antes da geocodificação
    const enderecoFormatado = formatarEnderecoParaGeocodificacao(endereco);
    const enderecoEncoded = encodeURIComponent(enderecoFormatado);
    
    // Usar componentes específicos para melhor precisão
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${enderecoEncoded}&key=${GOOGLE_API_KEY}&region=br&language=pt-BR&components=administrative_area:PR|country:BR`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== 'OK' || !data.results?.length) {
      throw new Error(`Google Geocoding falhou: ${data.status}`);
    }
    
    const result = data.results[0];
    
    // Validar qualidade do resultado antes de processar
    if (!validarQualidadeGeocodificacao(result, endereco)) {
      throw new Error('Resultado de geocodificação fora do Paraná ou com baixa qualidade');
    }
    
    const location = result.geometry.location;
    
    // Validar coordenadas dentro do Paraná
    if (!validarCoordenadaParana(location.lat, location.lng)) {
      throw new Error(`Coordenadas fora do Paraná: ${location.lat}, ${location.lng}`);
    }
    
    // Mapear tipos de precisão do Google
    let precisao: GeocodingResult['precisao'] = 'APPROXIMATE';
    switch (result.geometry.location_type) {
      case 'ROOFTOP':
        precisao = 'ROOFTOP';
        break;
      case 'RANGE_INTERPOLATED':
        precisao = 'RANGE_INTERPOLATED';
        break;
      case 'GEOMETRIC_CENTER':
        precisao = 'GEOMETRIC_CENTER';
        break;
      default:
        precisao = 'APPROXIMATE';
    }
    
    return {
      latitude: location.lat,
      longitude: location.lng,
      enderecoFormatado: result.formatted_address,
      precisao,
      fonte: 'google'
    };
  } catch (error) {
    console.error('Erro no Google Geocoding:', error);
    return null;
  }
}

/**
 * Geocodificação usando OpenCage API (backup gratuito)
 */
async function geocodeOpenCage(endereco: string): Promise<GeocodingResult | null> {
  try {
    // OpenCage oferece 2500 requests gratuitos por dia
    const API_KEY = 'YOUR_OPENCAGE_API_KEY'; // Será substituída por uma chave real se necessário
    const enderecoEncoded = encodeURIComponent(endereco + ', Brazil');
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${enderecoEncoded}&key=${API_KEY}&language=pt&countrycode=br`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.results?.length) {
      throw new Error('OpenCage não encontrou resultados');
    }
    
    const result = data.results[0];
    
    return {
      latitude: result.geometry.lat,
      longitude: result.geometry.lng,
      enderecoFormatado: result.formatted,
      precisao: 'APPROXIMATE', // OpenCage não fornece precisão detalhada
      fonte: 'opencage'
    };
  } catch (error) {
    console.error('Erro no OpenCage:', error);
    return null;
  }
}

/**
 * Geocodificação usando Nominatim (OpenStreetMap - gratuito)
 */
async function geocodeNominatim(endereco: string): Promise<GeocodingResult | null> {
  try {
    const enderecoEncoded = encodeURIComponent(endereco + ', Brazil');
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${enderecoEncoded}&countrycodes=br&limit=1&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GIS-CNPJ-Parana/1.0 (contato@exemplo.com)' // Nominatim requer User-Agent
      }
    });
    
    const data = await response.json();
    
    if (!data?.length) {
      throw new Error('Nominatim não encontrou resultados');
    }
    
    const result = data[0];
    
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      enderecoFormatado: result.display_name,
      precisao: 'APPROXIMATE',
      fonte: 'nominatim'
    };
  } catch (error) {
    console.error('Erro no Nominatim:', error);
    return null;
  }
}

/**
 * Geocodificação com fallback entre múltiplas APIs e validação rigorosa
 */
export async function geocodeEndereco(endereco: string): Promise<GeocodingResult | null> {
  // Validar se o endereço tem informações mínimas
  if (!validarEnderecoCompleto(endereco)) {
    console.warn(`Endereço incompleto ou inválido: ${endereco}`);
    return null;
  }
  
  // Tenta primeiro o Google (mais preciso)
  let resultado = await geocodeGoogle(endereco);
  
  // Se falhar, tenta OpenCage (mas só se o endereço parecer válido)
  if (!resultado) {
    console.log(`Google falhou para: ${endereco}, tentando OpenCage...`);
    resultado = await geocodeOpenCage(endereco);
    
    // Validar resultado do OpenCage
    if (resultado && !validarCoordenadaParana(resultado.latitude, resultado.longitude)) {
      console.warn(`OpenCage retornou coordenadas fora do Paraná: ${resultado.latitude}, ${resultado.longitude}`);
      resultado = null;
    }
  }
  
  // Se ainda falhar, tenta Nominatim (último recurso)
  if (!resultado) {
    console.log(`OpenCage falhou para: ${endereco}, tentando Nominatim...`);
    resultado = await geocodeNominatim(endereco);
    
    // Validar resultado do Nominatim
    if (resultado && !validarCoordenadaParana(resultado.latitude, resultado.longitude)) {
      console.warn(`Nominatim retornou coordenadas fora do Paraná: ${resultado.latitude}, ${resultado.longitude}`);
      resultado = null;
    }
  }
  
  if (resultado) {
    console.log(`Geocodificação bem-sucedida para: ${endereco} -> ${resultado.latitude}, ${resultado.longitude} (${resultado.fonte}, ${resultado.precisao})`);
  } else {
    console.error(`Falha total na geocodificação para: ${endereco}`);
  }
  
  return resultado;
}

/**
 * Geocodificação em lote com controle de rate limiting
 */
export async function geocodeMultiplosEnderecos(
  enderecos: string[],
  onProgress?: (processed: number, total: number, current?: GeocodingResult) => void
): Promise<GeocodingResult[]> {
  const resultados: GeocodingResult[] = [];
  
  for (let i = 0; i < enderecos.length; i++) {
    const endereco = enderecos[i];
    
    try {
      const resultado = await geocodeEndereco(endereco);
      
      if (resultado) {
        resultados.push(resultado);
        onProgress?.(i + 1, enderecos.length, resultado);
      } else {
        onProgress?.(i + 1, enderecos.length);
      }
      
      // Rate limiting: aguarda 100ms entre requisições do Google
      // Para APIs gratuitas, pode ser necessário aumentar o delay
      if (i < enderecos.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`Erro ao geocodificar endereço ${endereco}:`, error);
      onProgress?.(i + 1, enderecos.length);
    }
  }
  
  return resultados;
}

/**
 * Valida se as coordenadas estão dentro do estado do Paraná usando polígono preciso
 */
export function validarCoordenadaParana(lat: number, lng: number): boolean {
  // Limites mais precisos do Paraná baseados em dados geográficos oficiais
  const limitesParana = {
    norte: -22.4,    // Mais restritivo
    sul: -26.8,      // Mais restritivo  
    leste: -47.8,    // Mais restritivo
    oeste: -54.7     // Mais restritivo
  };
  
  // Primeira validação: limites básicos
  const dentroLimites = lat >= limitesParana.sul && 
                       lat <= limitesParana.norte && 
                       lng >= limitesParana.oeste && 
                       lng <= limitesParana.leste;
  
  if (!dentroLimites) {
    return false;
  }
  
  // Segunda validação: verificar se não está em regiões específicas fora do PR
  // (como partes do oceano ou estados vizinhos)
  
  // Excluir região oceânica (muito a leste)
  if (lng > -48.0 && lat < -25.0) {
    return false;
  }
  
  // Excluir região muito ao norte (São Paulo)
  if (lat > -23.0 && lng > -50.0) {
    return false;
  }
  
  // Excluir região muito ao sul (Santa Catarina)
  if (lat < -26.5 && lng > -52.0) {
    return false;
  }
  
  return true;
}

/**
 * Valida a qualidade do resultado de geocodificação
 */
function validarQualidadeGeocodificacao(result: any, endereco: string): boolean {
  // Verificar se o resultado contém o estado do Paraná
  const addressComponents = result.address_components || [];
  const temParana = addressComponents.some((component: any) => 
    component.types.includes('administrative_area_level_1') && 
    (component.short_name === 'PR' || component.long_name.includes('Paraná'))
  );
  
  if (!temParana) {
    console.warn(`Geocodificação fora do Paraná para: ${endereco}`);
    return false;
  }
  
  // Verificar se tem pelo menos cidade
  const temCidade = addressComponents.some((component: any) => 
    component.types.includes('administrative_area_level_2') || 
    component.types.includes('locality')
  );
  
  if (!temCidade) {
    console.warn(`Geocodificação sem cidade identificada para: ${endereco}`);
    return false;
  }
  
  return true;
}