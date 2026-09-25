import { api } from './core.js';
import type {
  TipoItemServico,
  Urgencia,
  StatusOrcamento,
} from '../../schemas/index.js';

/**
 * @deprecated Formato antigo de itens (T15 substitui pelo wizard de atividades).
 * Mantido até a página antiga ser migrada.
 */
export interface ItemOrcamentoInput {
  servicoItemId?: number | null;
  nome: string;
  tipo: TipoItemServico;
  quantidade: number;
  unidadeId: number;
  valorUnitario: number;
}

export interface MaterialLinha {
  materialId: number;
  quantidade: number;
}

export interface LinhaInput {
  verboId: number;
  objetoId: number;
  localId?: number | null;
  caracteristicaId?: number | null;
  descricao: string;
  unidadeId?: number | null;
  quantidade?: number | null;
  areaM2?: number | null;
  moValorHora?: number | null;
  moPessoas?: number | null;
  moHoras?: number | null;
  materiais: MaterialLinha[];
}

export interface AtividadeInput {
  etapaId: number;
  subServicoId: number;
  catalogoAtividadeId: string;
  linhas: LinhaInput[];
}

export interface FichaInput {
  areaPisoM2?: number | null;
  areaParedeM2?: number | null;
  areaTetoM2?: number | null;
  perimetroM?: number | null;
  acabamentoPiso?: 'CERAMICA' | 'PORCELANATO' | 'CIMENTO' | 'REVESTIMENTO' | 'OUTRO' | null;
  acabamentoParede?: 'PINTURA' | 'REVESTIMENTO_CERAMICO' | 'APLICACAO' | 'OUTRO' | null;
  tipoForro?: 'GESSO' | 'PVC' | 'DRYWALL' | 'ALVENARIA' | 'NENHUM' | null;
  tipoEsquadria?: 'ALUMINIO' | 'MADEIRA' | 'FERRO' | 'PVC' | 'OUTRO' | null;
  padraoAcabamento?: 'BASICO' | 'STANDARD' | 'PREMIUM' | null;
  caixasLuz?: number | null;
  cuidados?: string[];
  risco1?: string | null;
  acao1?: string | null;
  risco2?: string | null;
  acao2?: string | null;
  risco3?: string | null;
  acao3?: string | null;
}

export interface CriarOrcamentoInput {
  atendimentoId: number;
  visitaId?: number | null;
  enderecoId?: number | null;
  servicoMarketingId?: number | null;
  urgencia?: Urgencia;
  observacoes?: string;
  validade?: string;
  areaM2?: number | null;
  valorM2?: number | null;
  ficha?: FichaInput;
  atividades: AtividadeInput[];
}

/**
 * @deprecated Formato antigo com `itens` (T15 substitui pelo wizard de
 * atividades). Aceito temporariamente para a página atual continuar
 * compilando.
 */
export interface CriarOrcamentoInputLegado {
  atendimentoId: number;
  visitaId?: number;
  enderecoId?: number;
  observacoes?: string;
  itens: ItemOrcamentoInput[];
}

export interface OrcamentoAdminItem {
  id: number;
  codigo: string;
  atendimentoId: number;
  urgencia: Urgencia;
  status: StatusOrcamento;
  valorTotal: string | number;
  validade: string;
  observacoes: string | null;
  areaM2: string | number | null;
  valorM2: string | number | null;
  motivoRejeicao: string | null;
  criadoPorId: number;
  aprovadoPorId: number | null;
  aprovadoEm: string | null;
  confirmadoPorUser: boolean;
  dataConfirmacao: string | null;
  createdAt: string;
  updatedAt: string;
  atendimento?: { id: number; user: { id: number; nome: string } | null };
  user?: { id: number; nome: string } | null;
  ordemServico?: { id: number; codigo: string; status: string } | null;
  servicoMarketing?: { id: number; titulo: string } | null;
  _count?: { atividades: number };
}

export async function listarOrcamentosAdmin(params?: {
  status?: string;
  q?: string;
}): Promise<OrcamentoAdminItem[]> {
  return api.get<OrcamentoAdminItem[]>('/orcamentos', {
    status: params?.status,
    q: params?.q,
  });
}

export async function obterOrcamentoAdmin(
  id: number,
): Promise<OrcamentoAdminItem> {
  return api.get<OrcamentoAdminItem>(`/orcamentos/${id}`);
}

export async function criarOrcamentoAdmin(
  input: CriarOrcamentoInput | CriarOrcamentoInputLegado,
): Promise<OrcamentoAdminItem> {
  return api.post<OrcamentoAdminItem>('/orcamentos', input);
}

export async function editarOrcamentoAdmin(
  id: number,
  input: CriarOrcamentoInput | CriarOrcamentoInputLegado,
): Promise<OrcamentoAdminItem> {
  return api.patch<OrcamentoAdminItem>(`/orcamentos/${id}`, input);
}

export async function excluirOrcamentoAdmin(id: number): Promise<void> {
  await api.del(`/orcamentos/${id}`);
}

export async function enviarOrcamentoAdmin(
  id: number,
): Promise<OrcamentoAdminItem> {
  return api.post<OrcamentoAdminItem>(`/orcamentos/${id}/enviar`);
}

export async function aprovarOrcamentoAdmin(
  id: number,
): Promise<OrcamentoAdminItem> {
  return api.post<OrcamentoAdminItem>(`/orcamentos/${id}/aprovar`);
}

export async function recusarOrcamentoAdmin(
  id: number,
  motivo: string,
): Promise<OrcamentoAdminItem> {
  return api.post<OrcamentoAdminItem>(`/orcamentos/${id}/recusar`, { motivo });
}

// ---------- Detalhe (T14 — hidratação do wizard) ----------

export interface OrcamentoAtividadeMaterialRow {
  materialId: number;
  quantidade: string | number;
  custoUnitario: string | number;
  material?: { id: number; nome: string } | null;
}

export interface OrcamentoAtividadeRow {
  id: string;
  ordem: number;
  etapaId: number;
  subServicoId: number;
  catalogoAtividadeId: string;
  descricao: string;
  verboId: number;
  objetoId: number;
  localId: number | null;
  caracteristicaId: number | null;
  unidadeId: number | null;
  quantidade: string | number | null;
  areaM2: string | number | null;
  moValorHora: string | number | null;
  moPessoas: number | null;
  moHoras: string | number | null;
  materiais: OrcamentoAtividadeMaterialRow[];
}

export interface OrcamentoObraFichaDetalhe {
  id?: number;
  orcamentoId?: number;
  areaPisoM2?: string | number | null;
  areaParedeM2?: string | number | null;
  areaTetoM2?: string | number | null;
  perimetroM?: string | number | null;
  acabamentoPiso?: NonNullable<FichaInput['acabamentoPiso']>;
  acabamentoParede?: NonNullable<FichaInput['acabamentoParede']>;
  tipoForro?: NonNullable<FichaInput['tipoForro']>;
  tipoEsquadria?: NonNullable<FichaInput['tipoEsquadria']>;
  padraoAcabamento?: NonNullable<FichaInput['padraoAcabamento']>;
  caixasLuz?: number | null;
  cuidados?: string[] | null;
  risco1?: string | null;
  acao1?: string | null;
  risco2?: string | null;
  acao2?: string | null;
  risco3?: string | null;
  acao3?: string | null;
}

export interface OrcamentoAdminDetalhe extends OrcamentoAdminItem {
  visitaId: number | null;
  enderecoId: number | null;
  servicoMarketingId: number | null;
  ficha: OrcamentoObraFichaDetalhe | null;
  atividades: OrcamentoAtividadeRow[];
}

export async function obterOrcamentoAdminDetalhe(
  id: number,
): Promise<OrcamentoAdminDetalhe> {
  return api.get<OrcamentoAdminDetalhe>(`/orcamentos/${id}`);
}
