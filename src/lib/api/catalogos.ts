import { api } from './core.js';

export type TipoInsumo =
  | 'EQUIPAMENTO'
  | 'EPI'
  | 'MATERIAL'
  | 'DESPESAS_EXTRAS'
  | 'VEICULO'
  | 'SERVICO';

export const TIPOS_INSUMO_UI: { value: TipoInsumo; label: string }[] = [
  { value: 'EQUIPAMENTO', label: 'Equipamentos' },
  { value: 'EPI', label: 'EPIs' },
  { value: 'MATERIAL', label: 'Materiais' },
  { value: 'DESPESAS_EXTRAS', label: 'Despesas Extras' },
];

export const RECURSOS_CATALOGOS = [
  'categorias',
  'subcategorias',
  'marcas',
  'fornecedores',
  'localizacoes',
  'unidades-medida',
  'cores',
  'tamanhos',
  'status-equipamento',
  'estados-conservacao',
  'tipos-manutencao',
  'tipos-despesas',
] as const;

export type RecursoCatalogo = (typeof RECURSOS_CATALOGOS)[number];

export interface CatalogoItem {
  id: number;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  ordem: number;
  tipoInsumo: TipoInsumo;
  createdAt: string;
  updatedAt: string;
}

export interface SubcategoriaItem extends CatalogoItem {
  categoriaId: number;
  categoria?: CatalogoItem | null;
}

export interface FornecedorItem extends CatalogoItem {
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
}

export interface CorItem extends CatalogoItem {
  codigoHex: string | null;
}

export interface TipoDespesaItem extends CatalogoItem {
  requerObra: boolean;
}

export interface UnidadeMedidaItem extends CatalogoItem {
  sigla: string | null;
}

export interface CatalogosPayload {
  categorias: CatalogoItem[];
  subcategorias: SubcategoriaItem[];
  marcas: CatalogoItem[];
  fornecedores: FornecedorItem[];
  localizacoes: CatalogoItem[];
  unidadesMedida: UnidadeMedidaItem[];
  cores: CorItem[];
  tamanhos: CatalogoItem[];
  statusEquipamento: CatalogoItem[];
  estadosConservacao: CatalogoItem[];
  tiposManutencao: CatalogoItem[];
  tiposDespesas: TipoDespesaItem[];
}

export async function listarCatalogos(tipoInsumo?: TipoInsumo): Promise<CatalogosPayload> {
  const params = tipoInsumo ? { tipoInsumo } : undefined;
  return api.get<CatalogosPayload>('/catalogos', params);
}

export async function listarRecurso(
  recurso: RecursoCatalogo,
  tipoInsumo?: TipoInsumo,
): Promise<CatalogoItem[]> {
  const params = tipoInsumo ? { tipoInsumo } : undefined;
  return api.get<CatalogoItem[]>(`/catalogos/${recurso}`, params);
}

interface CatalogoApi<T extends CatalogoItem> {
  listar: (tipoInsumo?: TipoInsumo) => Promise<T[]>;
  criar: (input: Partial<T> & { nome: string }, tipoInsumo: TipoInsumo) => Promise<T>;
  atualizar: (
    id: number,
    input: Partial<T>,
    tipoInsumo?: TipoInsumo,
  ) => Promise<T>;
  desativar: (id: number) => Promise<T>;
}

function criarCatalogoApi<T extends CatalogoItem>(recurso: RecursoCatalogo): CatalogoApi<T> {
  return {
    listar: (tipoInsumo) => listarRecurso(recurso, tipoInsumo) as Promise<T[]>,

    criar: async (input, tipoInsumo) => {
      const { id, createdAt, updatedAt, ...data } = input as Record<string, unknown>;
      const qs = new URLSearchParams({ tipoInsumo: tipoInsumo });
      return api.post<T>(`/catalogos/${recurso}?${qs.toString()}`, data);
    },

    atualizar: async (id, input, tipoInsumo) => {
      const { createdAt, updatedAt, ...data } = input as Record<string, unknown>;
      const qs = new URLSearchParams(tipoInsumo ? { tipoInsumo } : {});
      return api.put<T>(`/catalogos/${recurso}/${id}?${qs.toString()}`, data);
    },

    desativar: (id) => api.del<T>(`/catalogos/${recurso}/${id}`),
  };
}

export const categoriasApi = criarCatalogoApi<CatalogoItem>('categorias');
export const subcategoriasApi = criarCatalogoApi<SubcategoriaItem>('subcategorias');
export const marcasApi = criarCatalogoApi<CatalogoItem>('marcas');
export const fornecedoresApi = criarCatalogoApi<FornecedorItem>('fornecedores');
export const localizacoesApi = criarCatalogoApi<CatalogoItem>('localizacoes');
export const unidadesMedidaApi = criarCatalogoApi<UnidadeMedidaItem>('unidades-medida');
export const coresApi = criarCatalogoApi<CorItem>('cores');
export const tamanhosApi = criarCatalogoApi<CatalogoItem>('tamanhos');
export const statusEquipamentoApi = criarCatalogoApi<CatalogoItem>('status-equipamento');
export const estadosConservacaoApi = criarCatalogoApi<CatalogoItem>('estados-conservacao');
export const tiposManutencaoApi = criarCatalogoApi<CatalogoItem>('tipos-manutencao');
export const tiposDespesasApi = criarCatalogoApi<TipoDespesaItem>('tipos-despesas');

export const RECURSO_LABEL: Record<RecursoCatalogo, string> = {
  categorias: 'Categoria',
  subcategorias: 'Subcategoria',
  marcas: 'Marca',
  fornecedores: 'Fornecedor',
  localizacoes: 'Localização',
  'unidades-medida': 'Unidade de medida',
  cores: 'Cor',
  tamanhos: 'Tamanho',
  'status-equipamento': 'Status de equipamento',
  'estados-conservacao': 'Estado de conservação',
  'tipos-manutencao': 'Tipo de manutenção',
  'tipos-despesas': 'Tipo de despesa',
};

export const RECURSO_TIPO_FIXO: Partial<Record<RecursoCatalogo, TipoInsumo>> = {
  'status-equipamento': 'EQUIPAMENTO',
  'estados-conservacao': 'EQUIPAMENTO',
  tamanhos: 'EPI',
  'tipos-despesas': 'DESPESAS_EXTRAS',
};

export const RECURSO_TIPOS_PERMITIDOS: Record<RecursoCatalogo, TipoInsumo[]> = {
  categorias: ['EQUIPAMENTO', 'EPI', 'MATERIAL', 'DESPESAS_EXTRAS'],
  subcategorias: ['EQUIPAMENTO', 'EPI', 'MATERIAL', 'DESPESAS_EXTRAS'],
  marcas: ['EQUIPAMENTO', 'EPI', 'MATERIAL', 'DESPESAS_EXTRAS', 'VEICULO'],
  fornecedores: ['EQUIPAMENTO', 'EPI', 'MATERIAL', 'DESPESAS_EXTRAS'],
  localizacoes: ['EQUIPAMENTO', 'EPI'],
  'unidades-medida': ['EQUIPAMENTO', 'EPI', 'MATERIAL', 'DESPESAS_EXTRAS'],
  cores: ['EQUIPAMENTO', 'EPI', 'MATERIAL', 'DESPESAS_EXTRAS'],
  tamanhos: ['EPI'],
  'status-equipamento': ['EQUIPAMENTO'],
  'estados-conservacao': ['EQUIPAMENTO'],
  'tipos-manutencao': ['EQUIPAMENTO', 'VEICULO'],
  'tipos-despesas': ['DESPESAS_EXTRAS'],
};