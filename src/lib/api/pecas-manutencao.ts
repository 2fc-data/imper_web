export type AcaoPecaManutencao = 'TROCADA' | 'CONSERTADA';

export type OrigemPecaManutencao =
  | 'ORIGINAL_NOVA'
  | 'ORIGINAL_USADA'
  | 'GENERICA_NOVA'
  | 'GENERICA_USADA';

export interface PecaManutencaoItem {
  id: number;
  manutencaoId: number;
  descricao: string;
  acao: AcaoPecaManutencao;
  origem: OrigemPecaManutencao | null;
  valor: number;
}

export interface PecaManutencaoInput {
  descricao: string;
  acao: AcaoPecaManutencao;
  origem?: OrigemPecaManutencao | null;
  valor?: number;
}

export const ACAO_PECA_LABEL: Record<AcaoPecaManutencao, string> = {
  TROCADA: 'Trocada',
  CONSERTADA: 'Consertada',
};

export const ORIGEM_PECA_LABEL: Record<OrigemPecaManutencao, string> = {
  ORIGINAL_NOVA: 'Original nova',
  ORIGINAL_USADA: 'Original usada',
  GENERICA_NOVA: 'Genérica nova',
  GENERICA_USADA: 'Genérica usada',
};
