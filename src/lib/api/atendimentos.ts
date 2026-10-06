import { api } from './core.js';
import type {
  CanalAtendimento,
  DadosEndereco,
  StatusAtendimento,
  Urgencia,
} from '../../schemas/index.js';
import type { AcaoAtendimento } from '../proximas-acoes.js';

export interface AtendimentoItem {
  id: number;
  canal: CanalAtendimento;
  urgencia: Urgencia | null;
  status: StatusAtendimento;
  descricao: string | null;
  userId: number | null;
  user?: { id: number; nome: string; telefone: string | null } | null;
  atendenteId: number | null;
  atendente?: { id: number; nome: string } | null;
  visitaSolicitada: boolean;
  proximasAcoes?: AcaoAtendimento[];
  agendamentos?: {
    id: number;
    dataPrevista: string;
    status: string;
    endereco?: {
      logradouro?: string;
      numero?: string;
      complemento?: string;
      bairro?: string;
      cidade?: string;
      estado?: string;
      cep?: string;
    } | null;
  }[];
  createdAt: string;
  updatedAt: string;
  _count?: { visitas: number; agendamentos: number };
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
  userId?: number | null;
  userName?: string;
  userTelefone?: string;
  userEmail?: string;
  userCpfCnpj?: string;
  canal: CanalAtendimento;
  urgencia?: Urgencia;
  descricao?: string;
  enderecoNovo?: DadosEndereco;
  visitaSolicitada?: boolean;
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

/** Detalhe de um atendimento (usado para exibir opção fora do filtro da lista). */
export async function obterAtendimento(
  id: number,
): Promise<AtendimentoItem> {
  return api.get<AtendimentoItem>(`/atendimentos/${id}`);
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

/** Atualiza `visitaSolicitada` do atendimento (flag da cascata). */
export async function atualizarAtendimento(
  id: number,
  patch: { visitaSolicitada?: boolean },
): Promise<AtendimentoItem> {
  return api.patch<AtendimentoItem>(`/atendimentos/${id}`, patch);
}

/** Passo em cascata: NOVO → ORCAMENTAMENTO via encadeamento (também cria agendamento/visita quando necessário). */
export async function encaminharParaOrcamento(
  id: number,
): Promise<AtendimentoItem> {
  return api.post<AtendimentoItem>(`/atendimentos/${id}/encaminhar-orcamento`);
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
