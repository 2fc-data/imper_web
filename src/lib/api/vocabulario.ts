import { api } from './core.js';

export type DimensaoVocabulario =
  | 'verbos'
  | 'objetos'
  | 'locais'
  | 'caracteristicas';

export interface Termo {
  id: number;
  nome: string;
  ativo: boolean;
}

export interface Etapa {
  id: number;
  nome: string;
  ordem: number;
  ativo: boolean;
}

export interface SubServico {
  id: number;
  etapaId: number;
  nome: string;
  ativo: boolean;
}

export interface OpcaoCascata {
  id: number;
  nome: string;
}

export type Cascata = {
  verbo: (OpcaoCascata | null)[];
  objeto: (OpcaoCascata | null)[];
  local: (OpcaoCascata | null)[];
  caracteristica: (OpcaoCascata | null)[];
};

export type FiltrosCascata = {
  verboId?: number;
  objetoId?: number;
  localId?: number | null;
  caracteristicaId?: number | null;
};

export interface ComboInput {
  verboId: number;
  objetoId: number;
  localId?: number | null;
  caracteristicaId?: number | null;
}

export const listarEtapas = (ativo = true) =>
  api.get<Etapa[]>('/etapas', { ativo });

export const listarTermos = (
  dim: DimensaoVocabulario,
  params?: { q?: string; ativo?: boolean },
) => api.get<Termo[]>(`/vocabulario/${dim}`, params);

export const listarSubServicos = (etapaId: number, ativo = true) =>
  api.get<SubServico[]>('/vocabulario/sub-servicos', { etapaId, ativo });

export const getCascata = (subServicoId: number, filtros?: FiltrosCascata) =>
  api.get<Cascata>(`/vocabulario/sub-servicos/${subServicoId}/cascata`, filtros);

export const criarTermo = (dim: DimensaoVocabulario, nome: string) =>
  api.post<Termo>(`/vocabulario/${dim}`, { nome });

export const criarSubServico = (etapaId: number, nome: string) =>
  api.post<SubServico>('/vocabulario/sub-servicos', { etapaId, nome });

export const criarCombosLote = (subServicoId: number, combos: ComboInput[]) =>
  api.post('/vocabulario/combinaoes/lote', { subServicoId, combos });

export const excluirCombo = (id: number) =>
  api.del(`/vocabulario/combinaoes/${id}`);
