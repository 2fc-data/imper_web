import { api } from './core.js';

export interface CatalogoAtividadeItem {
  id: string;
  nome: string;
  descricao: string | null;
  especialidadeNecessaria: string;
  tempoEstimadoHoras: number | null;
  tempoEstimadoMinutos?: number | null;
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

export async function listarCatalogoAtividades(params?: {
  q?: string;
  especialidade?: string;
}): Promise<CatalogoAtividadeItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.q) searchParams.set('q', params.q);
  if (params?.especialidade)
    searchParams.set('especialidade', params.especialidade);
  const queryStr = searchParams.toString();
  return api.get<CatalogoAtividadeItem[]>(
    `/catalogo-atividades${queryStr ? `?${queryStr}` : ''}`,
  );
}

export async function criarCatalogoAtividade(
  input: Omit<CatalogoAtividadeItem, 'id' | 'ativo' | 'criadoEm'>,
): Promise<CatalogoAtividadeItem> {
  return api.post<CatalogoAtividadeItem>('/catalogo-atividades', input);
}
