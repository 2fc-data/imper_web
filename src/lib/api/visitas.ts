import { api } from './core.js';
import type {
  ResultadoVisita,
  StatusVisita,
} from '../../schemas/index.js';

export interface VisitaItemVocabulario {
  id: number;
  visitaId: number;
  etapaId: number;
  subServicoId: number;
  verboId: number;
  objetoId: number;
  localId?: number | null;
  caracteristicaId?: number | null;
  unidadeId?: number | null;
  quantidade?: number | null;
  areaM2?: number | null;
  observacoes?: string | null;
  createdAt: string;
  etapa?: { id: number; nome: string; ordem: number };
  subServico?: { id: number; nome: string };
  verbo?: { id: number; nome: string };
  objeto?: { id: number; nome: string };
  local?: { id: number; nome: string } | null;
  caracteristica?: { id: number; nome: string } | null;
  unidade?: { id: number; nome: string } | null;
}

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
  itens?: VisitaItemVocabulario[];
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

export interface CriarVisitaItemInput {
  etapaId: number;
  subServicoId: number;
  verboId: number;
  objetoId: number;
  localId?: number | null;
  caracteristicaId?: number | null;
  unidadeId?: number | null;
  quantidade?: number | null;
  areaM2?: number | null;
  observacoes?: string | null;
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

export async function detalharVisita(id: number): Promise<VisitaItem> {
  return api.get<VisitaItem>(`/visitas/${id}`);
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

export async function adicionarItemVisita(
  visitaId: number,
  input: CriarVisitaItemInput,
): Promise<VisitaItem> {
  return api.post<VisitaItem>(`/visitas/${visitaId}/itens`, input);
}

export async function removerItemVisita(
  visitaId: number,
  itemId: number,
): Promise<VisitaItem> {
  return api.del<VisitaItem>(`/visitas/${visitaId}/itens/${itemId}`);
}

