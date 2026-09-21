import { api } from './core.js';
import type { UnidadeMedida } from '../schemas/index.js';
import type { LookupItem, SubcategoriaItem } from './lookups.js';

export interface RetiradaEquipamentoItem {
  id: number;
  equipamentoId: number;
  colaboradorId: number;
  colaborador?: { id: number; nome: string };
  observacao: string | null;
  registradoPorId: number;
  dataRetirada: string;
  dataDevolucao: string | null;
}

export interface EquipamentoItem {
  id: number;
  codigo: string;
  numeroPatrimonio: string | null;
  descricao: string;
  modelo: string | null;
  numeroSerie: string | null;
  marcaId: number | null;
  marca?: LookupItem | null;
  categoriaId: number | null;
  categoria?: LookupItem | null;
  subcategoriaId: number | null;
  subcategoria?: SubcategoriaItem | null;
  localizacaoId: number | null;
  localizacao?: LookupItem | null;
  fornecedorId: number | null;
  statusId: number;
  status?: LookupItem;
  estadoConservacaoId: number | null;
  estadoConservacao?: LookupItem | null;
  responsavelId: number | null;
  responsavel?: { id: number; nome: string } | null;
  unidadeMedidaId: number | null;
  unidadeMedida?: UnidadeMedida | null;
  dataAquisicao: string | null;
  valorAquisicao: number | null;
  dataGarantia: string | null;
  observacoes: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  retiradas?: RetiradaEquipamentoItem[];
}

export interface EquipamentoInput {
  codigo: string;
  numeroPatrimonio?: string;
  descricao: string;
  modelo?: string;
  numeroSerie?: string;
  marcaId?: number;
  categoriaId?: number;
  subcategoriaId?: number;
  localizacaoId?: number;
  fornecedorId?: number;
  statusId: number;
  estadoConservacaoId?: number;
  unidadeMedidaId?: number;
  dataAquisicao?: string;
  valorAquisicao?: number;
  dataGarantia?: string;
  observacoes?: string;
}

export async function listarEquipamentos(params?: {
  q?: string;
  statusId?: number;
  categoriaId?: number;
  ativo?: boolean;
}): Promise<EquipamentoItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.q) searchParams.set('q', params.q);
  if (params?.statusId) searchParams.set('statusId', String(params.statusId));
  if (params?.categoriaId)
    searchParams.set('categoriaId', String(params.categoriaId));
  if (params?.ativo !== undefined)
    searchParams.set('ativo', String(params.ativo));
  const queryStr = searchParams.toString();
  return api.get<EquipamentoItem[]>(
    `/equipamentos${queryStr ? `?${queryStr}` : ''}`,
  );
}

export async function criarEquipamento(
  input: EquipamentoInput,
): Promise<EquipamentoItem> {
  return api.post<EquipamentoItem>('/equipamentos', input);
}

export async function atualizarEquipamento(
  id: number,
  input: Partial<EquipamentoInput> & { ativo?: boolean },
): Promise<EquipamentoItem> {
  return api.put<EquipamentoItem>(`/equipamentos/${id}`, input);
}

export async function excluirEquipamento(id: number): Promise<EquipamentoItem> {
  return api.del<EquipamentoItem>(`/equipamentos/${id}`);
}
