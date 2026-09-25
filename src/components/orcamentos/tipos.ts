// Estado e helpers puros do wizard de orçamento (T14).
// Sem React: tudo aqui é coberto por tipos.test.ts.

import type {
  CriarOrcamentoInput,
  DimensaoVocabulario,
  FichaInput,
  OrcamentoAdminDetalhe,
  OrcamentoObraFichaDetalhe,
} from '../../lib/api';
import type { CatalogoAtividadeItem } from '../../lib/api';
import type { Urgencia } from '../../schemas';
import {
  calcularTotais,
  linhaValorTotal,
  type TotaisOrcamento,
} from '../../lib/orcamento-calculo';

export type PassoWizard = 1 | 2 | 3 | 4;

export const PASSOS: { passo: PassoWizard; titulo: string }[] = [
  { passo: 1, titulo: 'Cliente & Serviço' },
  { passo: 2, titulo: 'Cobertura' },
  { passo: 3, titulo: 'Precificação' },
  { passo: 4, titulo: 'Ficha & Resumo' },
];

export interface MaterialLinhaForm {
  materialId: number;
  nome: string;
  quantidade: number;
  custoUnitario: number | null;
}

export interface LinhaForm {
  verboId: number;
  objetoId: number;
  localId: number | null;
  caracteristicaId: number | null;
  verboNome: string;
  objetoNome: string;
  localNome: string | null;
  caracteristicaNome: string | null;
  descricao: string;
  unidadeId: number | null;
  quantidade: number | null;
  areaM2: number | null;
  moValorHora: number | null;
  moPessoas: number | null;
  moHoras: number | null;
  materiais: MaterialLinhaForm[];
}

export interface AtividadeForm {
  etapaId: number;
  subServicoId: number;
  catalogoAtividadeId: string;
  etapaNome: string;
  subServicoNome: string;
  catalogo: CatalogoAtividadeItem;
  linhas: LinhaForm[];
}

export interface WizardState {
  passo: PassoWizard;
  atendimentoId: number | null;
  visitaId: number | null;
  enderecoId: number | null;
  servicoMarketingId: number | null;
  urgencia: Urgencia;
  observacoes: string;
  validade: string; // yyyy-mm-dd
  areaM2: number | null;
  valorM2: number | null;
  atividades: AtividadeForm[];
  ficha: FichaInput;
}

export type AtualizarEstado = (fn: (s: WizardState) => WizardState) => void;

// ---------- classes compartilhadas ----------

export const labelClasses = 'text-xs font-semibold text-foreground';
export const inputClasses =
  'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';
export const selectClasses = inputClasses;
export const textareaClasses = inputClasses;
export const cardClasses = 'rounded-xl border bg-card p-4 shadow-sm';
export const btnPrimarioClasses =
  'rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none';
export const btnSecundarioClasses =
  'rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-muted transition-colors disabled:opacity-50 disabled:pointer-events-none';
export const btnPerigoClasses =
  'rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:pointer-events-none';

// ---------- utilitários ----------

export function numero(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function dataLocalIso(d: Date): string {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function isoParaData(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return dataLocalIso(d);
}

export function dataValidadePadrao(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return dataLocalIso(d);
}

export function estadoInicialWizard(
  parcial?: Partial<WizardState>,
): WizardState {
  const base: WizardState = {
    passo: 1,
    atendimentoId: null,
    visitaId: null,
    enderecoId: null,
    servicoMarketingId: null,
    urgencia: 'NORMAL',
    observacoes: '',
    validade: dataValidadePadrao(),
    areaM2: null,
    valorM2: null,
    atividades: [],
    ficha: {},
  };
  return parcial ? { ...base, ...parcial } : base;
}

export function chaveAtividade(a: {
  etapaId: number;
  subServicoId: number;
  catalogoAtividadeId: string;
}): string {
  return `${a.etapaId}:${a.subServicoId}:${a.catalogoAtividadeId}`;
}

export function catalogoPlaceholder(id: string): CatalogoAtividadeItem {
  return {
    id,
    nome: `Atividade ${id.slice(0, 6)}`,
    descricao: null,
    especialidadeNecessaria: '',
    tempoEstimadoHoras: null,
    ativo: true,
    criadoEm: '',
    subSteps: [],
    recursos: [],
  };
}

// ---------- transições de estado ----------

export function adicionarLinha(
  state: WizardState,
  atividade: Omit<AtividadeForm, 'linhas'>,
  linha: LinhaForm,
): WizardState {
  const chave = chaveAtividade(atividade);
  const idx = state.atividades.findIndex((a) => chaveAtividade(a) === chave);
  if (idx === -1) {
    return {
      ...state,
      atividades: [...state.atividades, { ...atividade, linhas: [linha] }],
    };
  }
  const atividades = state.atividades.map((a, i) =>
    i === idx ? { ...a, linhas: [...a.linhas, linha] } : a,
  );
  return { ...state, atividades };
}

export function atualizarLinha(
  state: WizardState,
  aIdx: number,
  lIdx: number,
  patch: Partial<LinhaForm>,
): WizardState {
  const atividades = state.atividades.map((a, i) => {
    if (i !== aIdx) return a;
    const linhas = a.linhas.map((l, j) =>
      j === lIdx ? { ...l, ...patch } : l,
    );
    return { ...a, linhas };
  });
  return { ...state, atividades };
}

export function removerLinha(
  state: WizardState,
  aIdx: number,
  lIdx: number,
): WizardState {
  const atividades: AtividadeForm[] = [];
  state.atividades.forEach((a, i) => {
    if (i !== aIdx) {
      atividades.push(a);
      return;
    }
    const linhas = a.linhas.filter((_, j) => j !== lIdx);
    if (linhas.length > 0) atividades.push({ ...a, linhas });
  });
  return { ...state, atividades };
}

export function removerAtividade(
  state: WizardState,
  aIdx: number,
): WizardState {
  return { ...state, atividades: state.atividades.filter((_, i) => i !== aIdx) };
}

export function atualizarFicha(
  state: WizardState,
  patch: Partial<FichaInput>,
): WizardState {
  return { ...state, ficha: { ...state.ficha, ...patch } };
}

// ---------- validação ----------

export function validarPasso(
  state: WizardState,
  passo: PassoWizard,
): string | null {
  switch (passo) {
    case 1:
      if (state.atendimentoId == null)
        return 'Selecione um atendimento.';
      if (state.observacoes.length > 2000)
        return 'Observações excedem 2000 caracteres.';
      return null;
    case 2:
      if (state.atividades.length === 0)
        return 'Adicione ao menos uma atividade (passo Cobertura).';
      return null;
    case 3: {
      for (const a of state.atividades) {
        if (a.linhas.length === 0)
          return `Atividade "${a.catalogo.nome}" sem linhas.`;
        for (const l of a.linhas) {
          if (!l.descricao.trim())
            return 'Preencha a descrição de todas as linhas.';
          if (l.areaM2 != null && l.areaM2 <= 0)
            return `Linha "${l.descricao}": área (m²) deve ser maior que zero.`;
          if (l.quantidade != null && l.quantidade <= 0)
            return `Linha "${l.descricao}": quantidade deve ser maior que zero.`;
          if (l.moPessoas != null && l.moPessoas < 1)
            return `Linha "${l.descricao}": mão de obra precisa de ao menos 1 pessoa.`;
          if (l.moHoras != null && l.moHoras < 0)
            return `Linha "${l.descricao}": horas de mão de obra não podem ser negativas.`;
          if (l.moValorHora != null && l.moValorHora < 0)
            return `Linha "${l.descricao}": valor/hora não pode ser negativo.`;
          for (const m of l.materiais) {
            if (!(m.quantidade > 0))
              return `Material "${m.nome}" com quantidade inválida.`;
          }
        }
      }
      return null;
    }
    case 4: {
      if (!state.validade) return 'Informe a validade da proposta.';
      if (Number.isNaN(new Date(`${state.validade}T12:00:00`).getTime()))
        return 'Data de validade inválida.';
      return null;
    }
    default:
      return null;
  }
}

export function validarAte(state: WizardState, ate: PassoWizard): string | null {
  for (const p of [1, 2, 3, 4] as PassoWizard[]) {
    if (p >= ate) break;
    const erro = validarPasso(state, p);
    if (erro) return erro;
  }
  return null;
}

// ---------- montagem do input da API ----------

function temFicha(f: FichaInput): boolean {
  return Object.values(f).some((v) => {
    if (v == null || v === '') return false;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  });
}

function montarFicha(f: FichaInput): FichaInput {
  const texto = (v: string | null | undefined) =>
    v == null || !v.trim() ? null : v.trim();
  const cuidados = f.cuidados
    ? f.cuidados.map((c) => c.trim()).filter((c) => c.length > 0)
    : undefined;
  return {
    ...f,
    risco1: texto(f.risco1),
    acao1: texto(f.acao1),
    risco2: texto(f.risco2),
    acao2: texto(f.acao2),
    risco3: texto(f.risco3),
    acao3: texto(f.acao3),
    cuidados,
  };
}

export function montarInput(state: WizardState): CriarOrcamentoInput {
  if (state.atendimentoId == null) {
    throw new Error('Atendimento obrigatório.');
  }
  const input: CriarOrcamentoInput = {
    atendimentoId: state.atendimentoId,
    visitaId: state.visitaId,
    enderecoId: state.enderecoId,
    servicoMarketingId: state.servicoMarketingId,
    urgencia: state.urgencia,
    observacoes: state.observacoes.trim()
      ? state.observacoes.trim()
      : undefined,
    validade: new Date(`${state.validade}T12:00:00`).toISOString(),
    areaM2: state.areaM2,
    valorM2: state.valorM2,
    atividades: state.atividades.map((a) => ({
      etapaId: a.etapaId,
      subServicoId: a.subServicoId,
      catalogoAtividadeId: a.catalogoAtividadeId,
      linhas: a.linhas.map((l) => ({
        verboId: l.verboId,
        objetoId: l.objetoId,
        localId: l.localId,
        caracteristicaId: l.caracteristicaId,
        descricao: l.descricao.trim(),
        unidadeId: l.unidadeId,
        quantidade: l.quantidade,
        areaM2: l.areaM2,
        moValorHora: l.moValorHora,
        moPessoas: l.moPessoas,
        moHoras: l.moHoras,
        materiais: l.materiais.map((m) => ({
          materialId: m.materialId,
          quantidade: m.quantidade,
        })),
      })),
    })),
  };
  if (temFicha(state.ficha)) input.ficha = montarFicha(state.ficha);
  return input;
}

// ---------- totais ----------

export function totaisDoEstado(state: WizardState): TotaisOrcamento {
  return calcularTotais(
    state.atividades.map((a) => ({ linhas: linhasCalculo(a) })),
    { areaM2: state.areaM2, valorM2: state.valorM2 },
  );
}

export function subtotalLinha(l: LinhaForm): number {
  return linhaValorTotal(
    { moPessoas: l.moPessoas, moHoras: l.moHoras, moValorHora: l.moValorHora },
    l.materiais.map((m) => ({
      quantidade: m.quantidade,
      custoUnitario: m.custoUnitario ?? 0,
    })),
  );
}

function linhasCalculo(a: AtividadeForm) {
  return a.linhas.map((l) => ({
    moPessoas: l.moPessoas,
    moHoras: l.moHoras,
    moValorHora: l.moValorHora,
    materiais: l.materiais.map((m) => ({
      quantidade: m.quantidade,
      custoUnitario: m.custoUnitario ?? 0,
    })),
  }));
}

// ---------- hidratação (edição) ----------

export interface ResolverEdicao {
  etapaNome?: (id: number) => string | undefined;
  subServicoNome?: (id: number) => string | undefined;
  catalogo?: (id: string) => CatalogoAtividadeItem | undefined;
  termoNome?: (dim: DimensaoVocabulario, id: number) => string | undefined;
  materialNome?: (id: number) => string | undefined;
}

function hydrataFicha(f: OrcamentoObraFichaDetalhe | null): FichaInput {
  if (!f) return {};
  return {
    areaPisoM2: numero(f.areaPisoM2),
    areaParedeM2: numero(f.areaParedeM2),
    areaTetoM2: numero(f.areaTetoM2),
    perimetroM: numero(f.perimetroM),
    acabamentoPiso: f.acabamentoPiso ?? null,
    acabamentoParede: f.acabamentoParede ?? null,
    tipoForro: f.tipoForro ?? null,
    tipoEsquadria: f.tipoEsquadria ?? null,
    padraoAcabamento: f.padraoAcabamento ?? null,
    caixasLuz: f.caixasLuz ?? null,
    cuidados: f.cuidados ?? undefined,
    risco1: f.risco1 ?? null,
    acao1: f.acao1 ?? null,
    risco2: f.risco2 ?? null,
    acao2: f.acao2 ?? null,
    risco3: f.risco3 ?? null,
    acao3: f.acao3 ?? null,
  };
}

export function estadoDeEdicao(
  det: OrcamentoAdminDetalhe,
  resolver: ResolverEdicao = {},
): WizardState {
  const porChave = new Map<string, AtividadeForm>();
  const atividades: AtividadeForm[] = [];

  for (const row of [...det.atividades].sort((a, b) => a.ordem - b.ordem)) {
    const chave = `${row.etapaId}:${row.subServicoId}:${row.catalogoAtividadeId}`;
    let atividade = porChave.get(chave);
    if (!atividade) {
      const catalogo =
        resolver.catalogo?.(row.catalogoAtividadeId) ??
        catalogoPlaceholder(row.catalogoAtividadeId);
      atividade = {
        etapaId: row.etapaId,
        subServicoId: row.subServicoId,
        catalogoAtividadeId: row.catalogoAtividadeId,
        etapaNome:
          resolver.etapaNome?.(row.etapaId) ?? `#${row.etapaId}`,
        subServicoNome:
          resolver.subServicoNome?.(row.subServicoId) ?? `#${row.subServicoId}`,
        catalogo,
        linhas: [],
      };
      porChave.set(chave, atividade);
      atividades.push(atividade);
    }
    const nome = (dim: DimensaoVocabulario, id: number | null) =>
      id == null
        ? null
        : resolver.termoNome?.(dim, id) ?? `#${id}`;
    atividade.linhas.push({
      verboId: row.verboId,
      objetoId: row.objetoId,
      localId: row.localId,
      caracteristicaId: row.caracteristicaId,
      verboNome: nome('verbos', row.verboId) ?? `#${row.verboId}`,
      objetoNome: nome('objetos', row.objetoId) ?? `#${row.objetoId}`,
      localNome: nome('locais', row.localId),
      caracteristicaNome: nome('caracteristicas', row.caracteristicaId),
      descricao: row.descricao,
      unidadeId: row.unidadeId,
      quantidade: numero(row.quantidade),
      areaM2: numero(row.areaM2),
      moValorHora: numero(row.moValorHora),
      moPessoas: row.moPessoas,
      moHoras: numero(row.moHoras),
      materiais: (row.materiais ?? []).map((m) => ({
        materialId: m.materialId,
        nome:
          m.material?.nome ??
          resolver.materialNome?.(m.materialId) ??
          `#${m.materialId}`,
        quantidade: numero(m.quantidade) ?? 0,
        custoUnitario: numero(m.custoUnitario),
      })),
    });
  }

  return estadoInicialWizard({
    atendimentoId: det.atendimentoId,
    visitaId: det.visitaId ?? null,
    enderecoId: det.enderecoId ?? null,
    servicoMarketingId:
      det.servicoMarketingId ?? det.servicoMarketing?.id ?? null,
    urgencia: det.urgencia,
    observacoes: det.observacoes ?? '',
    validade: isoParaData(det.validade),
    areaM2: numero(det.areaM2),
    valorM2: numero(det.valorM2),
    atividades,
    ficha: hydrataFicha(det.ficha),
  });
}

// --- Cascata de vocabulário (passo 2) -------------------------------------

export interface ValorCascata {
  etapaId: number | null;
  etapaNome: string | null;
  subServicoId: number | null;
  subServicoNome: string | null;
  verboId: number | null;
  verboNome: string | null;
  objetoId: number | null;
  objetoNome: string | null;
  localId: number | null;
  localNome: string | null;
  caracteristicaId: number | null;
  caracteristicaNome: string | null;
}

export function cascataVazia(): ValorCascata {
  return {
    etapaId: null,
    etapaNome: null,
    subServicoId: null,
    subServicoNome: null,
    verboId: null,
    verboNome: null,
    objetoId: null,
    objetoNome: null,
    localId: null,
    localNome: null,
    caracteristicaId: null,
    caracteristicaNome: null,
  };
}

/** Nomes capturados no momento da seleção; null em ids nulos. */
export function linhaDaCascata(c: ValorCascata, descricao: string): LinhaForm {
  return {
    verboId: c.verboId ?? 0,
    objetoId: c.objetoId ?? 0,
    localId: c.localId,
    caracteristicaId: c.caracteristicaId,
    verboNome: c.verboNome ?? `#${c.verboId}`,
    objetoNome: c.objetoNome ?? `#${c.objetoId}`,
    localNome: c.localNome,
    caracteristicaNome: c.caracteristicaNome,
    descricao,
    unidadeId: null,
    quantidade: null,
    areaM2: null,
    moValorHora: null,
    moPessoas: null,
    moHoras: null,
    materiais: [],
  };
}
