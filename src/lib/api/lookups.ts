import { api } from './core.js';
import type {
  BaseLookup,
  UnidadeMedida,
} from '../schemas/index.js';

export type {
  BaseLookup,
  CanalAtendimento,
  DadosEndereco,
  ResultadoVisita,
  StatusAgendamento,
  StatusAtendimento,
  StatusManutencao,
  StatusMaterial,
  StatusOrcamento,
  StatusOS,
  TipoAgendamento,
  TipoItemServico,
  TipoMaterial,
  TipoMovimento,
  UnidadeMedida,
  Urgencia,
} from '../schemas/index.js';

export interface LookupItem extends BaseLookup {
  descricao: string | null;
  ordem: number;
  createdAt: string;
  updatedAt: string;
}

export interface LookupInput {
  nome: string;
  descricao?: string;
  ordem?: number;
}

export interface SubcategoriaItem extends LookupItem {
  categoriaId: number;
}

export interface SubcategoriaInput extends LookupInput {
  categoriaId: number;
}

export interface FornecedorItem {
  id: number;
  nome: string;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FornecedorInput {
  nome: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
}

export interface EquipamentoLookups {
  categorias: LookupItem[];
  subcategorias: SubcategoriaItem[];
  marcas: LookupItem[];
  fornecedores: FornecedorItem[];
  localizacoes: LookupItem[];
  statuses: LookupItem[];
  estadosConservacao: LookupItem[];
  tiposManutencao: LookupItem[];
  unidadesMedida: UnidadeMedida[];
}

export async function listarLookupsEquipamentos(): Promise<EquipamentoLookups> {
  return api.get<EquipamentoLookups>('/equipamentos/lookups');
}

export interface EpiLookups {
  categorias: LookupItem[];
  subcategorias: SubcategoriaItem[];
  marcas: LookupItem[];
  fornecedores: FornecedorItem[];
  localizacoes: LookupItem[];
  cores: LookupItem[];
  tamanhos: LookupItem[];
  colaboradores: { id: number; nome: string }[];
  statuses?: LookupItem[];
  estadosConservacao?: LookupItem[];
  unidadesMedida?: UnidadeMedida[];
  tiposManutencao?: LookupItem[];
}

export async function listarLookupsEpis(): Promise<EpiLookups> {
  const [
    categorias,
    subcategorias,
    marcas,
    fornecedores,
    localizacoes,
    cores,
    tamanhos,
    colaboradores,
    unidadesMedida,
  ] = await Promise.all([
    api.get<LookupItem[]>('/epis/lookups/categorias'),
    api.get<SubcategoriaItem[]>('/epis/lookups/subcategorias'),
    api.get<LookupItem[]>('/epis/lookups/marcas'),
    api.get<FornecedorItem[]>('/epis/lookups/fornecedores'),
    api.get<LookupItem[]>('/epis/lookups/localizacoes'),
    api.get<LookupItem[]>('/epis/lookups/cores'),
    api.get<LookupItem[]>('/epis/lookups/tamanhos'),
    api.get<{ id: number; nome: string }[]>('/epis/lookups/colaboradores'),
    api.get<UnidadeMedida[]>('/epis/lookups/unidades-medida'),
  ]);
  return {
    categorias,
    subcategorias,
    marcas,
    fornecedores,
    localizacoes,
    cores,
    tamanhos,
    colaboradores,
    unidadesMedida,
  };
}

function criarLookupApi<R extends BaseLookup>(base: string) {
  return {
    listar: () => api.get<R[]>(`${base}`),
    criar: (input: LookupInput) => api.post<R>(`${base}`, input),
    atualizar: (
      id: number,
      input: Partial<LookupInput> & { ativo?: boolean },
    ) => api.put<R>(`${base}/${id}`, input),
    desativar: (id: number) => api.del<R>(`${base}/${id}`),
  };
}

export const categoriasApi = criarLookupApi<LookupItem>(
  '/equipamentos/lookups/categorias',
);
export const marcasApi = criarLookupApi<LookupItem>(
  '/equipamentos/lookups/marcas',
);
export const localizacoesApi = criarLookupApi<LookupItem>(
  '/equipamentos/lookups/localizacoes',
);
export const statusEquipamentoApi = criarLookupApi<LookupItem>(
  '/equipamentos/lookups/status',
);
export const estadosConservacaoApi = criarLookupApi<LookupItem>(
  '/equipamentos/lookups/estados-conservacao',
);
export const tiposManutencaoApi = criarLookupApi<LookupItem>(
  '/equipamentos/lookups/tipos-manutencao',
);
export const unidadesMedidaApi = criarLookupApi<UnidadeMedida>(
  '/equipamentos/lookups/unidades-medida',
);

export const categoriasMaterialApi = criarLookupApi<LookupItem>(
  '/materiais/lookups/categorias',
);

export const subcategoriasMaterialApi = criarLookupApi<SubcategoriaItem>(
  '/materiais/lookups/subcategorias',
);

export const coresMaterialApi = criarLookupApi<LookupItem>(
  '/materiais/lookups/cores',
);

export const marcasMaterialApi = criarLookupApi<LookupItem>(
  '/materiais/lookups/marcas',
);

export const categoriasEpiApi = criarLookupApi<LookupItem>(
  '/epis/lookups/categorias',
);

export const subcategoriasEpiApi = criarLookupApi<SubcategoriaItem>(
  '/epis/lookups/subcategorias',
);

export const marcasEpiApi = criarLookupApi<LookupItem>('/epis/lookups/marcas');

export const coresEpiApi = criarLookupApi<LookupItem>('/epis/lookups/cores');

export const tamanhosEpiApi = criarLookupApi<LookupItem>(
  '/epis/lookups/tamanhos',
);

export const localizacoesEpiApi = criarLookupApi<LookupItem>(
  '/epis/lookups/localizacoes',
);

export const fornecedoresEpiApi = criarLookupApi<FornecedorItem>(
  '/epis/lookups/fornecedores',
);

export const subcategoriasApi = {
  listar: () =>
    api.get<SubcategoriaItem[]>('/equipamentos/lookups/subcategorias'),
  criar: (input: SubcategoriaInput) =>
    api.post<SubcategoriaItem>('/equipamentos/lookups/subcategorias', input),
  atualizar: (
    id: number,
    input: Partial<SubcategoriaInput> & { ativo?: boolean },
  ) =>
    api.put<SubcategoriaItem>(
      `/equipamentos/lookups/subcategorias/${id}`,
      input,
    ),
  desativar: (id: number) =>
    api.del<SubcategoriaItem>(`/equipamentos/lookups/subcategorias/${id}`),
};

export const fornecedoresApi = {
  listar: () => api.get<FornecedorItem[]>('/equipamentos/lookups/fornecedores'),
  criar: (input: FornecedorInput) =>
    api.post<FornecedorItem>('/equipamentos/lookups/fornecedores', input),
  atualizar: (
    id: number,
    input: Partial<FornecedorInput> & { ativo?: boolean },
  ) =>
    api.put<FornecedorItem>(`/equipamentos/lookups/fornecedores/${id}`, input),
  desativar: (id: number) =>
    api.del<FornecedorItem>(`/equipamentos/lookups/fornecedores/${id}`),
};
