import type { AtendimentoItem, AtendimentoLogItem } from './atendimentos.js';
import type { AgendamentoItem } from './agendamentos.js';
import { api } from './core.js';
import type { OrcamentoAdminDetalhe } from './orcamentos-admin.js';

export interface PerfilAtualizado {
  id: number;
  nome: string;
  email: string | null;
  telefone: string | null;
  cpfCnpj: string | null;
}

export interface AtualizarPerfilInput {
  nome?: string;
  email?: string;
  telefone?: string;
  cpfCnpj?: string;
}

export type StatusObraPortal =
  | 'EM_PREPARACAO'
  | 'EM_EXECUCAO'
  | 'CONCLUIDA'
  | 'CANCELADA';
export type StatusExecucaoPortal =
  | 'PENDENTE'
  | 'EM_ANDAMENTO'
  | 'CONCLUIDA'
  | 'CANCELADA';

export interface EnderecoPortal {
  logradouro: string;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
}

export interface ExecucaoPortal {
  status: StatusExecucaoPortal;
}

export interface AtividadePortal {
  id: string;
  descricao: string;
  ordem: number;
  cancelada: boolean;
  execucoes: ExecucaoPortal[];
}

export interface EtapaPortal {
  id: number;
  nome: string;
  ordem: number;
  atividades: AtividadePortal[];
}

export interface ObraPortalItem {
  id: number;
  codigo: string;
  urgencia: string;
  status: StatusObraPortal;
  valorContratado: string | number;
  endereco: EnderecoPortal | null;
  etapas: EtapaPortal[];
}

export interface ObraPortalDetalhe extends ObraPortalItem {
  atendimentoId: number;
  createdAt: string;
}

export interface AtendimentoPortalDetalhe extends AtendimentoItem {
  logs: AtendimentoLogItem[];
}

export function listarAtendimentosPortal(): Promise<AtendimentoItem[]> {
  return api.get('/portal/atendimentos');
}

export function obterAtendimentoPortal(
  id: number,
): Promise<AtendimentoPortalDetalhe> {
  return api.get(`/portal/atendimentos/${id}`);
}

export function listarAgendamentosPortal(): Promise<AgendamentoItem[]> {
  return api.get('/portal/agendamentos');
}

export function listarOrcamentosPortal(): Promise<OrcamentoAdminDetalhe[]> {
  return api.get('/portal/orcamentos');
}

export function obterOrcamentoPortal(id: number): Promise<OrcamentoAdminDetalhe> {
  return api.get(`/portal/orcamentos/${id}`);
}

export function listarObrasPortal(): Promise<ObraPortalItem[]> {
  return api.get('/portal/obras');
}

export function obterObraPortal(id: number): Promise<ObraPortalDetalhe> {
  return api.get(`/portal/obras/${id}`);
}

export function atualizarPerfil(
  input: AtualizarPerfilInput,
): Promise<PerfilAtualizado> {
  return api.patch('/portal/perfil', input);
}
