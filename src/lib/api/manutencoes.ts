import { api } from './core.js';
import type { StatusManutencao } from '../../schemas/index.js';
import type { LookupItem } from './lookups.js';

export interface ManutencaoItem {
  id: number;
  equipamentoId: number;
  tipoId: number;
  data: string;
  descricao: string;
  custo: number | null;
  status: StatusManutencao;
  responsavelManutencaoId: number;
  proximaManutencao: string | null;
  createdAt: string;
  updatedAt: string;
  equipamento?: {
    id: number;
    codigo: string | null;
    descricao: string;
    numeroPatrimonio: string | null;
  };
  tipo?: LookupItem | null;
  responsavelManutencao?: { id: number; nome: string } | null;
}

export interface ManutencaoInput {
  equipamentoId: number;
  tipoId: number;
  data: string;
  descricao: string;
  custo?: number;
  responsavelManutencaoId?: number;
  proximaManutencao?: string;
}

export async function listarManutencoes(params?: {
  equipamentoId?: number;
  status?: StatusManutencao;
}): Promise<ManutencaoItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.equipamentoId)
    searchParams.set('equipamentoId', String(params.equipamentoId));
  if (params?.status) searchParams.set('status', params.status);
  const queryStr = searchParams.toString();
  return api.get<ManutencaoItem[]>(
    `/manutencoes${queryStr ? `?${queryStr}` : ''}`,
  );
}

export async function criarManutencao(
  input: ManutencaoInput,
): Promise<ManutencaoItem> {
  return api.post<ManutencaoItem>('/manutencoes', input);
}

export async function atualizarManutencao(
  id: number,
  input: Partial<
    Omit<
      ManutencaoInput,
      'custo' | 'responsavelManutencaoId' | 'proximaManutencao'
    >
  > & {
    custo?: number | null;
    responsavelManutencaoId?: number | null;
    proximaManutencao?: string | null;
    status?: StatusManutencao;
  },
): Promise<ManutencaoItem> {
  return api.put<ManutencaoItem>(`/manutencoes/${id}`, input);
}

export async function excluirManutencao(id: number): Promise<ManutencaoItem> {
  return api.del<ManutencaoItem>(`/manutencoes/${id}`);
}
