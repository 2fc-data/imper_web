import { api } from './core.js';
import type { EquipeItem } from './equipes.js';
import type { MaterialItem } from './materiais.js';
import type { EpiItem } from './epis.js';
import type { EquipamentoItem } from './equipamentos.js';

export interface SeparacaoItem {
  id: number;
  codigo: string;
  status: string;
  statusNovo?: string;
  osId: number | null;
  equipeId: string | null;
  dataPrevista: string | null;
  dataNecessidade?: string | null;
  dataConfirmacao: string | null;
  confirmadoPorId: number | null;
  totalItens?: number;
  criadoEm: string;
  os?: { id: number; codigo: string; numero?: string };
  equipe?: EquipeItem;
  confirmadoPor?: { id: number; nome: string } | null;
  itens?: SeparacaoItemDetalhe[];
}

export interface SeparacaoItemDetalhe {
  id: number;
  materialId: number | null;
  epiId: number | null;
  equipamentoId: number | null;
  descricaoItem?: string;
  quantidade?: number | string;
  quantidadeNecessaria: number | string;
  quantidadeSeparada: number | string;
  localEstoque?: string | null;
  status: string;
  retiradoEm?: string | null;
  devolvidoEm?: string | null;
  material?: MaterialItem;
  epi?: EpiItem;
  equipamento?: EquipamentoItem;
}

export async function listarSeparacoes(params?: {
  osId?: number;
  equipeId?: string;
  status?: string;
  q?: string;
}): Promise<SeparacaoItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.osId) searchParams.set('osId', String(params.osId));
  if (params?.equipeId) searchParams.set('equipeId', params.equipeId);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.q) searchParams.set('q', params.q);
  const queryStr = searchParams.toString();
  return api.get<SeparacaoItem[]>(
    `/separacao${queryStr ? `?${queryStr}` : ''}`,
  );
}

export async function detalharSeparacao(id: number): Promise<SeparacaoItem> {
  return api.get<SeparacaoItem>(`/separacao/${id}`);
}

export async function confirmarSeparacao(id: number): Promise<SeparacaoItem> {
  return api.put<SeparacaoItem>(`/separacao/${id}/confirmar`);
}

export async function notificarEquipeSeparacao(
  id: number,
): Promise<SeparacaoItem> {
  return api.put<SeparacaoItem>(`/separacao/${id}/notificar-equipe`);
}

export async function registrarRetiradaSeparacao(
  id: number,
): Promise<SeparacaoItem> {
  return api.put<SeparacaoItem>(`/separacao/${id}/retirada`);
}

export async function registrarDevolucaoSeparacao(
  id: number,
): Promise<SeparacaoItem> {
  return api.put<SeparacaoItem>(`/separacao/${id}/devolucao`);
}

export async function registrarRetiradaItemSeparacao(
  separacaoId: number,
  itemId: number,
  dados: { colaboradorId: number; observacao?: string },
): Promise<unknown> {
  return api.put(`/separacao/${separacaoId}/itens/${itemId}/retirar`, dados);
}

export async function registrarDevolucaoItemSeparacao(
  separacaoId: number,
  itemId: number,
  dados: { observacao?: string; status?: 'DEVOLVIDO' | 'PERDIDO' },
): Promise<unknown> {
  return api.put(`/separacao/${separacaoId}/itens/${itemId}/devolver`, dados);
}

export async function excluirSeparacao(id: number): Promise<void> {
  return api.del<void>(`/separacao/${id}`);
}
