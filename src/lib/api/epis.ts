import { api } from './core.js';
import type { UnidadeMedida } from '../schemas/index.js';
import type { LookupItem, SubcategoriaItem, FornecedorItem } from './lookups.js';

export interface EntregaEpiItem {
  id: number;
  epiId: number;
  colaboradorId: number;
  colaborador?: { id: number; nome: string };
  quantidade: number;
  observacao: string | null;
  registradoPorId: number;
  registradoPor?: { id: number; nome: string };
  data: string;
}

export interface EpiItem {
  id: number;
  codigo: string;
  nome: string;
  numeroCa: string | null;
  numeroPatrimonio: string | null;
  dataValidade: string | null;
  quantidade: number;
  quantidadeMinima: number | null;
  ativo: boolean;
  marcaId: number | null;
  marca?: LookupItem | null;
  categoriaId: number | null;
  categoria?: LookupItem | null;
  subcategoriaId: number | null;
  subcategoria?: SubcategoriaItem | null;
  localizacaoId: number | null;
  localizacao?: LookupItem | null;
  fornecedorId: number | null;
  fornecedor?: FornecedorItem | null;
  unidadeMedidaId: number | null;
  unidadeMedida?: UnidadeMedida | null;
  createdAt: string;
  updatedAt: string;
  entregas?: EntregaEpiItem[];
}

export interface EpiInput {
  codigo: string;
  nome: string;
  numeroCa?: string;
  numeroPatrimonio?: string;
  dataValidade?: string;
  quantidade?: number;
  quantidadeMinima?: number;
  marcaId?: number;
  categoriaId?: number;
  subcategoriaId?: number;
  localizacaoId?: number;
  fornecedorId?: number;
  unidadeMedidaId?: number;
}

export async function listarEpis(params?: {
  q?: string;
  ativo?: boolean;
}): Promise<EpiItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.q) searchParams.set('q', params.q);
  if (params?.ativo !== undefined)
    searchParams.set('ativo', String(params.ativo));
  const queryStr = searchParams.toString();
  return api.get<EpiItem[]>(`/epis${queryStr ? `?${queryStr}` : ''}`);
}

export async function criarEpi(input: EpiInput): Promise<EpiItem> {
  return api.post<EpiItem>('/epis', input);
}

export async function atualizarEpi(
  id: number,
  input: Partial<Omit<EpiInput, 'dataValidade' | 'quantidadeMinima'>> & {
    dataValidade?: string | null;
    quantidadeMinima?: number | null;
    ativo?: boolean;
  },
): Promise<EpiItem> {
  return api.put<EpiItem>(`/epis/${id}`, input);
}

export async function excluirEpi(id: number): Promise<EpiItem> {
  return api.del<EpiItem>(`/epis/${id}`);
}
