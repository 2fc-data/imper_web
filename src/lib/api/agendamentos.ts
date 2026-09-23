import { api } from './core.js';
import type {
  TipoAgendamento,
  StatusAgendamento,
  Urgencia,
  DadosEndereco,
} from '../../schemas/index.js';

export interface EnderecoItem {
  id: number;
  rotulo?: string;
  logradouro: string;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  principal?: boolean;
}

export interface AgendamentoItem {
  id: number;
  userId: number;
  atendimentoId: number | null;
  enderecoId: number | null;
  tipo: TipoAgendamento;
  status: StatusAgendamento;
  dataPrevista: string;
  dataRealizada: string | null;
  observacoes: string | null;
  criadoPorId: number | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: number; nome: string; telefone: string | null } | null;
  criadoPor?: { id: number; nome: string } | null;
  endereco?: EnderecoItem | null;
  atendimento?: {
    id: number;
    descricao: string;
    urgencia?: Urgencia | null;
  } | null;
}

export interface CriarAgendamentoInput {
  userId: number;
  atendimentoId?: number | null;
  enderecoId?: number | null;
  tipo?: TipoAgendamento;
  status?: StatusAgendamento;
  dataPrevista: string;
  dataRealizada?: string | null;
  observacoes?: string;
  enderecoNovo?: DadosEndereco;
}

export interface ListarAgendamentosParams {
  status?: StatusAgendamento;
  tipo?: TipoAgendamento;
  userId?: number;
  dataDe?: string;
  dataAte?: string;
}

export async function listarAgendamentos(
  params?: ListarAgendamentosParams,
): Promise<AgendamentoItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.tipo) searchParams.set('tipo', params.tipo);
  if (params?.userId)
    searchParams.set('userId', String(params.userId));
  if (params?.dataDe) searchParams.set('dataDe', params.dataDe);
  if (params?.dataAte) searchParams.set('dataAte', params.dataAte);
  const queryStr = searchParams.toString();
  return api.get<AgendamentoItem[]>(
    `/agendamentos${queryStr ? `?${queryStr}` : ''}`,
  );
}

export async function criarAgendamento(
  input: CriarAgendamentoInput,
): Promise<AgendamentoItem> {
  return api.post<AgendamentoItem>('/agendamentos', input);
}

export async function detalharAgendamento(
  id: number,
): Promise<AgendamentoItem> {
  return api.get<AgendamentoItem>(`/agendamentos/${id}`);
}

export async function atualizarAgendamento(
  id: number,
  input: Partial<CriarAgendamentoInput>,
): Promise<AgendamentoItem> {
  return api.patch<AgendamentoItem>(`/agendamentos/${id}`, input);
}

export async function atualizarStatusAgendamento(
  id: number,
  status: StatusAgendamento,
  dataRealizada?: string | null,
): Promise<AgendamentoItem> {
  return api.patch<AgendamentoItem>(`/agendamentos/${id}/status`, {
    status,
    dataRealizada,
  });
}

export async function removerAgendamento(id: number): Promise<void> {
  return api.del(`/agendamentos/${id}`);
}
