import { api } from './core.js';
import type { MaterialItem } from './materiais.js';
import type { EpiItem } from './epis.js';
import type { EquipamentoItem } from './equipamentos.js';

export interface EnderecoSeparacaoObra {
  logradouro: string;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
}

export interface ObraSeparacao {
  id: number;
  codigo: string;
  user?: { nome: string } | null;
  endereco?: EnderecoSeparacaoObra | null;
}

export interface SeparacaoItem {
  id: number;
  codigo: string;
  status: string;
  statusNovo?: string;
  dataPrevista: string | null;
  dataNecessidade?: string | null;
  dataConfirmacao: string | null;
  confirmadoPorId: number | null;
  totalItens?: number;
  criadoEm: string;
  createdAt?: string;
  executucaoAtividadeId?: string | null;
  executucaoAtividade?: {
    atividade?: {
      obraEtapa?: {
        obraId: number;
        obra?: ObraSeparacao | null;
      } | null;
    } | null;
  } | null;
  confirmadoPor?: { id: number; nome: string } | null;
  itens?: SeparacaoItemDetalhe[];
}

export function obraIdDaSeparacao(separacao: SeparacaoItem): number | null {
  return (
    separacao.executucaoAtividade?.atividade?.obraEtapa?.obraId ?? null
  );
}

export function obraDaSeparacao(
  separacao: SeparacaoItem,
): ObraSeparacao | null {
  return separacao.executucaoAtividade?.atividade?.obraEtapa?.obra ?? null;
}

export interface SeparacaoItemDetalhe {
  id: number;
  materialId: number | null;
  epiId: number | null;
  equipamentoId: number | null;
  colaboradorId?: number | null;
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
  colaborador?: {
    id: number;
    nome: string;
    papeis?: { papel: { nome: string } }[] | null;
  } | null;
}

export async function listarSeparacoes(params?: {
  obraId?: number;
  status?: string;
}): Promise<SeparacaoItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.obraId) searchParams.set('obraId', String(params.obraId));
  if (params?.status) searchParams.set('status', params.status);
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

export interface NovoItemSeparacao {
  materialId?: number;
  epiId?: number;
  equipamentoId?: number;
  quantidade: number;
  colaboradorId?: number;
  observacao?: string;
}

export async function adicionarItemSeparacao(
  separacaoId: number,
  dados: NovoItemSeparacao,
): Promise<SeparacaoItemDetalhe> {
  return api.post<SeparacaoItemDetalhe>(`/separacao/${separacaoId}/itens`, dados);
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

export async function removerItemSeparacao(
  separacaoId: number,
  itemId: number,
): Promise<void> {
  return api.del<void>(`/separacao/${separacaoId}/itens/${itemId}`);
}

export async function excluirSeparacao(id: number): Promise<void> {
  return api.del<void>(`/separacao/${id}`);
}
