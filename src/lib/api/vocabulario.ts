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

export interface ComboRow extends ComboInput {
  id: number;
  subServicoId: number;
  ativo: boolean;
  subServico?: SubServico;
  verbo?: OpcaoCascata;
  objeto?: OpcaoCascata;
  local?: OpcaoCascata;
  caracteristica?: OpcaoCascata;
}

export interface ResultadoCriacaoCombos {
  criados: number;
  reativados?: number;
  ignorados: number;
}

export const listarEtapas = (ativo = true) =>
  api.get<Etapa[]>('/etapas', { ativo });

export const listarEtapasTodas = () => api.get<Etapa[]>('/etapas');

export const criarEtapa = (dados: { nome: string; ordem: number }) =>
  api.post<Etapa>('/etapas', dados);

export const atualizarEtapa = (
  id: number,
  dados: { nome?: string; ordem?: number; ativo?: boolean },
) => api.patch<Etapa>(`/etapas/${id}`, dados);

export const removerEtapa = (id: number) => api.del<Etapa>(`/etapas/${id}`);

export const listarTermos = (
  dim: DimensaoVocabulario,
  params?: { q?: string; ativo?: boolean },
) => api.get<Termo[]>(`/vocabulario/${dim}`, params);

export const atualizarTermo = (
  dim: DimensaoVocabulario,
  id: number,
  dados: { nome?: string; ativo?: boolean },
) => api.patch<Termo>(`/vocabulario/${dim}/${id}`, dados);

export const listarSubServicos = (etapaId?: number, ativo = true) =>
  api.get<SubServico[]>('/vocabulario/sub-servicos', {
    ...(etapaId !== undefined && { etapaId }),
    ativo,
  });

export const listarSubServicosTodas = () =>
  api.get<SubServico[]>('/vocabulario/sub-servicos');

export const getCascata = (subServicoId: number, filtros?: FiltrosCascata) =>
  api.get<Cascata>(`/vocabulario/sub-servicos/${subServicoId}/cascata`, filtros);

export const criarTermo = (dim: DimensaoVocabulario, nome: string) =>
  api.post<Termo>(`/vocabulario/${dim}`, { nome });

export const criarSubServico = (etapaId: number, nome: string) =>
  api.post<SubServico>('/vocabulario/sub-servicos', { etapaId, nome });

export const atualizarSubServico = (
  id: number,
  dados: { etapaId?: number; nome?: string; ativo?: boolean },
) => api.patch<SubServico>(`/vocabulario/sub-servicos/${id}`, dados);

export const removerSubServico = (id: number) =>
  api.del<SubServico>(`/vocabulario/sub-servicos/${id}`);

export const criarCombosLote = (
  subServicoId: number,
  combos: ComboInput[],
): Promise<ResultadoCriacaoCombos> =>
  api.post<ResultadoCriacaoCombos>('/vocabulario/combinaoes/lote', {
    subServicoId,
    combos,
  });

export const criarCombo = (
  subServicoId: number,
  combo: ComboInput,
): Promise<ResultadoCriacaoCombos> =>
  api.post<ResultadoCriacaoCombos>('/vocabulario/combinaoes', {
    subServicoId,
    ...combo,
  });

export const listarCombos = (params?: {
  subServicoId?: number;
  ativo?: boolean;
}) => api.get<ComboRow[]>('/vocabulario/combinaoes', params);

export const listarCombosDoSubServico = (
  subServicoId: number,
  ativo?: boolean,
) =>
  api.get<ComboRow[]>(`/vocabulario/sub-servicos/${subServicoId}/combos`, {
    ...(ativo !== undefined && { ativo }),
  });

export const excluirCombo = (id: number) =>
  api.del(`/vocabulario/combinaoes/${id}`);

export const reativarCombo = (id: number) =>
  api.patch(`/vocabulario/combinaoes/${id}/reativar`);
