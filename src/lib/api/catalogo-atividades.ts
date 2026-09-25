import { api } from './core.js';

export interface CatalogoAtividadeItem {
  id: string;
  nome: string;
  descricao: string | null;
  especialidadeNecessaria: string;
  tempoEstimadoHoras: number | null;
  tempoEstimadoMinutos?: number | null;
  etapaId?: number | null;
  subServicoId?: number | null;
  ativo: boolean;
  criadoEm: string;
  subSteps: SubStepItem[];
  recursos: RecursoAtividadeItem[];
}

export interface SubStepItem {
  id: string;
  ordem: number;
  descricao: string;
  observacao: string | null;
}

export interface RecursoAtividadeItem {
  id: string;
  tipo: string;
  itemCatalogoId: number;
  quantidade: number;
}

export interface CriarCatalogoAtividadeInput {
  nome: string;
  descricao: string | null;
  especialidadeNecessaria: string;
  tempoEstimadoHoras: number | null;
  etapaId?: number | null;
  subServicoId?: number | null;
  subSteps: SubStepItem[];
  recursos: RecursoAtividadeItem[];
}

export async function listarCatalogoAtividades(params?: {
  q?: string;
  especialidade?: string;
  etapaId?: number;
  subServicoId?: number;
}): Promise<CatalogoAtividadeItem[]> {
  return api.get<CatalogoAtividadeItem[]>('/catalogo-atividades', {
    q: params?.q,
    especialidade: params?.especialidade,
    etapaId: params?.etapaId,
    subServicoId: params?.subServicoId,
  });
}

export async function criarCatalogoAtividade(
  input: CriarCatalogoAtividadeInput,
): Promise<CatalogoAtividadeItem> {
  return api.post<CatalogoAtividadeItem>('/catalogo-atividades', input);
}
