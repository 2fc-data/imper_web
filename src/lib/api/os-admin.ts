import { api } from './core.js';
import type {
  Urgencia,
  StatusOS,
} from '../../schemas/index.js';

export interface OrdemServicoAdminItem {
  id: number;
  codigo: string;
  orcamentoId: number;
  userId: number | null;
  atendimentoId: number | null;
  urgencia: Urgencia;
  status: StatusOS;
  valorTotal: string | number;
  endereco: string | null;
  dataInicioPrevista: string | null;
  tecnicoResponsavelId: number | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: number; nome: string } | null;
  atendimento?: { id: number } | null;
  tecnicoResponsavel?: { id: number; nome: string } | null;
  _count?: { fases: number; compras: number };
}

export async function listarOSAdmin(params?: {
  status?: string;
  q?: string;
}): Promise<OrdemServicoAdminItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.q) searchParams.set('q', params.q);
  const queryStr = searchParams.toString();
  return api.get<OrdemServicoAdminItem[]>(
    `/os${queryStr ? `?${queryStr}` : ''}`,
  );
}

export async function aprovarOSAdmin(
  id: number,
): Promise<OrdemServicoAdminItem> {
  return api.post<OrdemServicoAdminItem>(`/os/${id}/aprovar`);
}

export async function iniciarOSAdmin(
  id: number,
): Promise<OrdemServicoAdminItem> {
  return api.post<OrdemServicoAdminItem>(`/os/${id}/iniciar`);
}

export async function concluirOSAdmin(
  id: number,
): Promise<OrdemServicoAdminItem> {
  return api.post<OrdemServicoAdminItem>(`/os/${id}/concluir`);
}

export async function cancelarOSAdmin(
  id: number,
  motivo?: string,
): Promise<OrdemServicoAdminItem> {
  return api.post<OrdemServicoAdminItem>(`/os/${id}/cancelar`, { motivo });
}
