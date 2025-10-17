/**
 * CNPJ Service - Integração com APIs de consulta de CNPJ
 */

export interface CNPJData {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  atividadePrincipal: string;
  endereco: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    municipio: string;
    uf: string;
    cep: string;
    enderecoCompleto: string;
  };
  situacao: string;
  telefone?: string;
  email?: string;
}

/**
 * Consulta CNPJ na BrasilAPI (gratuita e sem limite)
 */
async function consultarCNPJBrasilAPI(cnpj: string): Promise<CNPJData | null> {
  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
    
    if (!response.ok) {
      throw new Error(`Erro na consulta: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      cnpj: data.cnpj,
      razaoSocial: data.razao_social || data.nome,
      nomeFantasia: data.nome_fantasia,
      atividadePrincipal: data.cnae_fiscal_descricao || data.atividade_principal?.[0]?.text || 'Não informado',
      endereco: {
        logradouro: data.logradouro,
        numero: data.numero,
        complemento: data.complemento,
        bairro: data.bairro,
        municipio: data.municipio,
        uf: data.uf,
        cep: data.cep,
        enderecoCompleto: `${data.logradouro}, ${data.numero}${data.complemento ? ', ' + data.complemento : ''}, ${data.bairro}, ${data.municipio} - ${data.uf}, ${data.cep}`
      },
      situacao: data.descricao_situacao_cadastral || data.situacao,
      telefone: data.ddd_telefone_1 ? `(${data.ddd_telefone_1?.substring(0, 2)}) ${data.ddd_telefone_1?.substring(2)}` : undefined,
      email: data.correio_eletronico
    };
  } catch (error) {
    console.error('Erro na BrasilAPI:', error);
    return null;
  }
}

/**
 * Consulta CNPJ na ReceitaWS (backup)
 */
async function consultarCNPJReceitaWS(cnpj: string): Promise<CNPJData | null> {
  try {
    const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cnpj}`);
    
    if (!response.ok) {
      throw new Error(`Erro na consulta: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'ERROR') {
      throw new Error(data.message);
    }
    
    return {
      cnpj: data.cnpj,
      razaoSocial: data.nome,
      nomeFantasia: data.fantasia,
      atividadePrincipal: data.atividade_principal?.[0]?.text || 'Não informado',
      endereco: {
        logradouro: data.logradouro,
        numero: data.numero,
        complemento: data.complemento,
        bairro: data.bairro,
        municipio: data.municipio,
        uf: data.uf,
        cep: data.cep,
        enderecoCompleto: `${data.logradouro}, ${data.numero}${data.complemento ? ', ' + data.complemento : ''}, ${data.bairro}, ${data.municipio} - ${data.uf}, ${data.cep}`
      },
      situacao: data.situacao,
      telefone: data.telefone,
      email: data.email
    };
  } catch (error) {
    console.error('Erro na ReceitaWS:', error);
    return null;
  }
}

/**
 * Consulta informações de CNPJ com fallback entre APIs
 */
export async function consultarCNPJ(cnpj: string): Promise<CNPJData | null> {
  // Remove formatação do CNPJ
  const cnpjLimpo = cnpj.replace(/\D/g, '');
  
  // Tenta primeiro a BrasilAPI (mais confiável)
  let resultado = await consultarCNPJBrasilAPI(cnpjLimpo);
  
  // Se falhar, tenta a ReceitaWS como backup
  if (!resultado) {
    resultado = await consultarCNPJReceitaWS(cnpjLimpo);
  }
  
  return resultado;
}

/**
 * Consulta múltiplos CNPJs com controle de rate limiting
 */
export async function consultarMultiplosCNPJs(
  cnpjs: string[], 
  onProgress?: (processed: number, total: number, current?: CNPJData) => void
): Promise<CNPJData[]> {
  const resultados: CNPJData[] = [];
  
  for (let i = 0; i < cnpjs.length; i++) {
    const cnpj = cnpjs[i];
    
    try {
      const dados = await consultarCNPJ(cnpj);
      
      if (dados) {
        resultados.push(dados);
        onProgress?.(i + 1, cnpjs.length, dados);
      } else {
        onProgress?.(i + 1, cnpjs.length);
      }
      
      // Rate limiting: aguarda 500ms entre requisições para evitar bloqueio
      if (i < cnpjs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`Erro ao consultar CNPJ ${cnpj}:`, error);
      onProgress?.(i + 1, cnpjs.length);
    }
  }
  
  return resultados;
}