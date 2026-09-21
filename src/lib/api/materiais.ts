import { api } from './core.js';
import type {
  TipoMaterial,
  TipoMovimento,
  StatusMaterial,
  UnidadeMedida,
} from '../schemas/index.js';
import type { LookupItem, SubcategoriaItem, FornecedorItem } from './lookups.js';

export interface MaterialSaldo {
  materialId: number;
  saldo: number | string;
  updatedAt: string;
}

export interface MaterialMovimentoItem {
  id: number;
  materialId: number;
  tipo: TipoMovimento;
  quantidade: number | string;
  saldoApos: number | string;
  registradoPorId: number | null;
  registradoPor?: { id: number; nome: string } | null;
  ordemServicoId: number | null;
  compraItemId: number | null;
  separacaoItemId: number | null;
  observacao: string | null;
  createdAt: string;
}

export interface MaterialItem {
  id: number;
  nome: string;
  tipo: TipoMaterial;
  categoriaId: number | null;
  categoria?: LookupItem;
  unidadeId: number | null;
  unidade?: UnidadeMedida;
  quantidadeMinima: number | null;
  custoUnitario: number | string | null;
  status: StatusMaterial;
  createdAt: string;
  updatedAt: string;
  saldo?: MaterialSaldo | null;
  movimentos?: MaterialMovimentoItem[];
}

export interface MaterialInput {
  nome: string;
  tipo?: TipoMaterial;
  categoriaId?: number | null;
  unidadeId?: number | null;
  quantidadeMinima?: number;
  custoUnitario?: number;
}

export interface MaterialLookups {
  categorias: LookupItem[];
  subcategorias: SubcategoriaItem[];
  marcas: LookupItem[];
  cores: LookupItem[];
  unidadesMedida: UnidadeMedida[];
  localizacoes?: LookupItem[];
  fornecedores?: FornecedorItem[];
  statuses?: LookupItem[];
  estadosConservacao?: LookupItem[];
  tiposManutencao?: LookupItem[];
  tamanhos?: LookupItem[];
}

export async function listarLookupsMateriais(): Promise<MaterialLookups> {
  return api.get<MaterialLookups>('/materiais/lookups');
}

export async function listarMateriais(params?: {
  q?: string;
  tipo?: TipoMaterial;
}): Promise<MaterialItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.q) searchParams.set('q', params.q);
  if (params?.tipo) searchParams.set('tipo', params.tipo);
  const queryStr = searchParams.toString();
  return api.get<MaterialItem[]>(`/materiais${queryStr ? `?${queryStr}` : ''}`);
}

export async function detalharMaterial(id: number): Promise<MaterialItem> {
  return api.get<MaterialItem>(`/materiais/${id}`);
}

export async function criarMaterial(
  input: MaterialInput,
): Promise<MaterialItem> {
  return api.post<MaterialItem>('/materiais', input);
}

export async function atualizarMaterial(
  id: number,
  input: Partial<Omit<MaterialInput, 'quantidadeMinima' | 'custoUnitario'>> & {
    quantidadeMinima?: number | null;
    custoUnitario?: number | null;
    status?: StatusMaterial;
  },
): Promise<MaterialItem> {
  return api.put<MaterialItem>(`/materiais/${id}`, input);
}

export async function excluirMaterial(id: number): Promise<MaterialItem> {
  return api.del<MaterialItem>(`/materiais/${id}`);
}
