import { api } from './core.js';
import type {
  ResultadoVisita,
  StatusVisita,
} from '../../schemas/index.js';

export interface VisitaItem {
  id: number;
  atendimentoId: number;
  agendamentoId: number | null;
  dataPrevista: string;
  dataRealizada: string | null;
  status: StatusVisita;
  resultado?: ResultadoVisita | null;
  constatacao?: string | null;
  relatorio?: string | null;
  necessitaOrcamento?: boolean;
  necessitaObra?: boolean;
  tecnicoId?: number | null;
}

export interface CriarVisitaInput {
  agendamentoId: number;
  tecnicoId?: number;
}

export interface AtualizarVisitaInput {
  status?: StatusVisita;
  resultado?: ResultadoVisita;
  constatacao?: string;
  relatorio?: string;
  necessitaOrcamento?: boolean;
  necessitaObra?: boolean;
}

export async function listarVisitas(params?: {
  atendimentoId?: number;
}): Promise<VisitaItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.atendimentoId !== undefined)
    searchParams.set('atendimentoId', String(params.atendimentoId));
  const queryStr = searchParams.toString();
  return api.get<VisitaItem[]>(
    `/visitas${queryStr ? `?${queryStr}` : ''}`,
  );
}

export async function criarVisita(
  input: CriarVisitaInput,
): Promise<VisitaItem> {
  return api.post<VisitaItem>('/visitas', input);
}

export async function atualizarVisita(
  id: number,
  patch: AtualizarVisitaInput,
): Promise<VisitaItem> {
  return api.patch<VisitaItem>(`/visitas/${id}`, patch);
}
