import { api } from './core.js';
import type {
  CanalAtendimento,
  DadosEndereco,
  StatusAtendimento,
  Urgencia,
} from '../schemas/index.js';

export interface AtendimentoItem {
  id: number;
  canal: CanalAtendimento;
  urgencia: Urgencia | null;
  status: StatusAtendimento;
  descricao: string | null;
  clienteId: number | null;
  cliente?: { id: number; nome: string; telefone: string | null } | null;
  atendenteId: number | null;
  atendente?: { id: number; nome: string } | null;
  createdAt: string;
  updatedAt: string;
  _count?: { visitas: number; os: number };
}

export interface AtendimentoLogItem {
  id: number;
  atendimentoId: number;
  atendenteId: number | null;
  atendente?: { id: number; nome: string } | null;
  tipo: 'TEXTO' | 'STATUS';
  descricao: string | null;
  statusDe: StatusAtendimento | null;
  statusPara: StatusAtendimento | null;
  createdAt: string;
}

export interface CriarAtendimentoInput {
  clienteId?: number | null;
  nome?: string;
  telefone?: string;
  email?: string;
  canal: CanalAtendimento;
  urgencia?: Urgencia;
  descricao?: string;
  enderecoNovo?: DadosEndereco;
}

export async function listarAtendimentos(params?: {
  status?: string;
  q?: string;
  criadoDe?: string;
  criadoAte?: string;
  atualizadoDe?: string;
  atualizadoAte?: string;
}): Promise<AtendimentoItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.q) searchParams.set('q', params.q);
  if (params?.criadoDe) searchParams.set('criadoDe', params.criadoDe);
  if (params?.criadoAte) searchParams.set('criadoAte', params.criadoAte);
  if (params?.atualizadoDe)
    searchParams.set('atualizadoDe', params.atualizadoDe);
  if (params?.atualizadoAte)
    searchParams.set('atualizadoAte', params.atualizadoAte);
  const queryStr = searchParams.toString();
  return api.get<AtendimentoItem[]>(
    `/atendimentos${queryStr ? `?${queryStr}` : ''}`,
  );
}

export async function criarAtendimento(
  input: CriarAtendimentoInput,
): Promise<AtendimentoItem> {
  return api.post<AtendimentoItem>('/atendimentos', input);
}

export async function atualizarStatusAtendimento(
  id: number,
  status: StatusAtendimento,
): Promise<AtendimentoItem> {
  return api.patch<AtendimentoItem>(`/atendimentos/${id}/status`, { status });
}

export async function listarLogsAtendimento(
  id: number,
): Promise<AtendimentoLogItem[]> {
  return api.get<AtendimentoLogItem[]>(`/atendimentos/${id}/atendimentos`);
}

export async function registrarLogAtendimento(
  id: number,
  descricao: string,
): Promise<AtendimentoLogItem> {
  return api.post<AtendimentoLogItem>(`/atendimentos/${id}/atendimentos`, {
    descricao,
  });
}
