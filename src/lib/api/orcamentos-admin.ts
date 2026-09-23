import { api } from './core.js';
import type {
  TipoItemServico,
  Urgencia,
  StatusOrcamento,
} from '../../schemas/index.js';

export interface ItemOrcamentoInput {
  servicoItemId?: number | null;
  nome: string;
  tipo: TipoItemServico;
  quantidade: number;
  unidadeId: number;
  valorUnitario: number;
}

export interface OrcamentoAdminItem {
  id: number;
  codigo: string;
  atendimentoId: number;
  urgencia: Urgencia;
  status: StatusOrcamento;
  valorTotal: string | number;
  validade: string;
  observacoes: string | null;
  criadoPorId: number;
  aprovadoPorId: number | null;
  aprovadoEm: string | null;
  confirmadoPorUser: boolean;
  dataConfirmacao: string | null;
  createdAt: string;
  updatedAt: string;
  atendimento?: { id: number; user: { id: number; nome: string } | null };
  user?: { id: number; nome: string } | null;
  ordemServico?: { id: number; codigo: string; status: string } | null;
  _count?: { itens: number };
}

export interface CriarOrcamentoInput {
  atendimentoId: number;
  visitaId?: number;
  enderecoId?: number;
  observacoes?: string;
  itens: ItemOrcamentoInput[];
}

export async function listarOrcamentosAdmin(params?: {
  status?: string;
  q?: string;
}): Promise<OrcamentoAdminItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.q) searchParams.set('q', params.q);
  const queryStr = searchParams.toString();
  return api.get<OrcamentoAdminItem[]>(
    `/orcamentos${queryStr ? `?${queryStr}` : ''}`,
  );
}

export async function criarOrcamentoAdmin(
  input: CriarOrcamentoInput,
): Promise<OrcamentoAdminItem> {
  return api.post<OrcamentoAdminItem>('/orcamentos', input);
}

export async function enviarOrcamentoAdmin(
  id: number,
): Promise<OrcamentoAdminItem> {
  return api.post<OrcamentoAdminItem>(`/orcamentos/${id}/enviar`);
}
