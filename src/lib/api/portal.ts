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

export type StatusEtapaPortal = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA';
export type StatusAtividadePortal =
  | 'PENDENTE'
  | 'EM_ANDAMENTO'
  | 'CONCLUIDA'
  | 'CANCELADA';

export interface AtividadePortal {
  id: string;
  status: StatusAtividadePortal;
  dataPrevisao: string | null;
  criadoEm: string;
  atualizadoEm: string;
  catalogoAtividade: { nome: string } | null;
}

export interface EtapaPortal {
  id: string;
  nome: string;
  ordem: number;
  status: StatusEtapaPortal;
  dataInicioReal: string | null;
  dataFimReal: string | null;
  atividadesOS: AtividadePortal[];
}

export interface OsPortalItem {
  id: number;
  codigo: string;
  orcamentoId: number | null;
  userId: number | null;
  atendimentoId: number | null;
  urgencia: string;
  status: string;
  valorTotal: string | number;
  dataInicioPrevista: string | null;
  tecnicoResponsavelId: number | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: number; nome: string } | null;
  atendimento?: { id: number } | null;
  tecnicoResponsavel?: { id: number; nome: string } | null;
  endereco: string | null;
  etapasConcluidas: number;
  totalEtapas: number;
  progresso: number;
}

export interface OsPortalDetalhe extends OsPortalItem {
  etapas: EtapaPortal[];
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

export function listarOsPortal(): Promise<OsPortalItem[]> {
  return api.get('/portal/os');
}

export function obterOsPortal(id: number): Promise<OsPortalDetalhe> {
  return api.get(`/portal/os/${id}`);
}

export function atualizarPerfil(
  input: AtualizarPerfilInput,
): Promise<PerfilAtualizado> {
  return api.patch('/portal/perfil', input);
}
