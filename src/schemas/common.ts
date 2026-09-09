export interface BaseLookup {
  id: number;
  nome: string;
  ativo: boolean;
}

export interface LookupItem extends BaseLookup {
  descricao?: string | null;
}

export interface UnidadeMedida extends BaseLookup {
  ordem: number;
}

export interface DadosEndereco {
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}