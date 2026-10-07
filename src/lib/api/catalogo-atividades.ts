import { api } from './core.js';

export const ESPECIALIDADES_CATALOGO = [
  'IMPERMEABILIZACAO',
  'PINTURA',
  'ELETRICA',
  'HIDRAULICA',
  'CIVIL',
  'LIMPEZA',
  'OUTROS',
] as const;

export const TIPOS_RECURSO_ATIVIDADE = [
  'EQUIPAMENTO',
  'EPI',
  'MATERIAL',
] as const;

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

export interface SubStepInput {
  ordem: number;
  descricao: string;
  observacao?: string;
}

export interface RecursoInput {
  tipo: string;
  itemCatalogoId: number;
  quantidade?: number;
}

export interface CriarCatalogoAtividadeInput {
  nome: string;
  descricao: string | null;
  especialidadeNecessaria: string;
  tempoEstimadoHoras: number | null;
  etapaId?: number | null;
  subServicoId?: number | null;
  subSteps?: SubStepInput[];
  recursos?: RecursoInput[];
}

export interface AtualizarCatalogoAtividadeInput {
  nome?: string;
  descricao?: string | null;
  especialidadeNecessaria?: string;
  tempoEstimadoHoras?: number | null;
  etapaId?: number | null;
  subServicoId?: number | null;
  ativo?: boolean;
}

export async function listarCatalogoAtividades(params?: {
  q?: string;
  especialidade?: string;
  etapaId?: number;
  subServicoId?: number;
  ativo?: boolean;
}): Promise<CatalogoAtividadeItem[]> {
  return api.get<CatalogoAtividadeItem[]>('/catalogo-atividades', {
    q: params?.q,
    especialidade: params?.especialidade,
    etapaId: params?.etapaId,
    subServicoId: params?.subServicoId,
    ativo: params?.ativo,
  });
}

export async function detalharCatalogoAtividade(
  id: string,
): Promise<CatalogoAtividadeItem> {
  return api.get<CatalogoAtividadeItem>(`/catalogo-atividades/${id}`);
}

export async function criarCatalogoAtividade(
  input: CriarCatalogoAtividadeInput,
): Promise<CatalogoAtividadeItem> {
  return api.post<CatalogoAtividadeItem>('/catalogo-atividades', input);
}

export async function atualizarCatalogoAtividade(
  id: string,
  input: AtualizarCatalogoAtividadeInput,
): Promise<CatalogoAtividadeItem> {
  return api.patch<CatalogoAtividadeItem>(
    `/catalogo-atividades/${id}`,
    input,
  );
}

export async function excluirCatalogoAtividade(
  id: string,
): Promise<CatalogoAtividadeItem> {
  return api.del<CatalogoAtividadeItem>(`/catalogo-atividades/${id}`);
}

export async function adicionarSubStepCatalogo(
  catalogoId: string,
  input: SubStepInput,
): Promise<SubStepItem> {
  return api.post<SubStepItem>(
    `/catalogo-atividades/${catalogoId}/substeps`,
    input,
  );
}

export async function removerSubStepCatalogo(
  substepId: string,
): Promise<unknown> {
  return api.del(`/catalogo-atividades/substeps/${substepId}`);
}

export async function adicionarRecursoCatalogo(
  catalogoId: string,
  input: RecursoInput,
): Promise<RecursoAtividadeItem> {
  return api.post<RecursoAtividadeItem>(
    `/catalogo-atividades/${catalogoId}/recursos`,
    input,
  );
}

export async function removerRecursoCatalogo(
  recursoId: string,
): Promise<unknown> {
  return api.del(`/catalogo-atividades/recursos/${recursoId}`);
}
