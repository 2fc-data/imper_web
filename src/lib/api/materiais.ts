import { api } from './core.js';
import type {
  TipoMaterial,
  TipoMovimento,
  StatusMaterial,
  UnidadeMedida,
} from '../../schemas/index.js';
import type { LookupItem, SubcategoriaItem, FornecedorItem } from './lookups.js';

export interface TipoDespesa {
  id: number;
  nome: string;
  descricao: string | null;
  requerObra: boolean;
  ativo: boolean;
  ordem: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ObraLookupItem {
  id: number;
  codigo: string;
  atendimento?: {
    id?: number;
    user?: { id: number; nome: string } | null;
  } | null;
}

export interface MaterialSaldo {
  materialId: number;
  saldo: number | string;
  updatedAt: string;
}

export interface MaterialMovimentoItem {
  id: number;
  materialId: number;
  tipo: TipoMovimento;
  quantidade: number | string;
  saldoApos: number | string;
  registradoPorId: number | null;
  registradoPor?: { id: number; nome: string } | null;
  compraItemId: number | null;
  separacaoItemId: number | null;
  observacao: string | null;
  createdAt: string;
}

export interface MaterialItem {
  id: number;
  nome: string;
  tipo: TipoMaterial;
  categoriaId: number | null;
  categoria?: LookupItem;
  tipoDespesaId?: number | null;
  tipoDespesa?: TipoDespesa | null;
  obraId?: number | null;
  obra?: ObraLookupItem | null;
  unidadeId: number | null;
  unidade?: UnidadeMedida;
  quantidadeMinima: number | null;
  custoUnitario: number | string | null;
  status: StatusMaterial;
  createdAt: string;
  updatedAt: string;
  saldo?: MaterialSaldo | null;
  movimentos?: MaterialMovimentoItem[];
}

export interface MaterialInput {
  nome: string;
  tipo?: TipoMaterial;
  categoriaId?: number | null;
  unidadeId?: number | null;
  tipoDespesaId?: number | null;
  obraId?: number | null;
  quantidadeMinima?: number | null;
  custoUnitario?: number | null;
}

export interface MaterialLookups {
  categorias: LookupItem[];
  subcategorias: SubcategoriaItem[];
  marcas: LookupItem[];
  cores: LookupItem[];
  unidadesMedida: UnidadeMedida[];
  tiposDespesas?: TipoDespesa[];
  obras?: ObraLookupItem[];
  localizacoes?: LookupItem[];
  fornecedores?: FornecedorItem[];
  statuses?: LookupItem[];
  estadosConservacao?: LookupItem[];
  tiposManutencao?: LookupItem[];
  tamanhos?: LookupItem[];
}

export async function listarLookupsMateriais(): Promise<MaterialLookups> {
  return api.get<MaterialLookups>('/materiais/lookups');
}

export async function listarMateriais(params?: {
  q?: string;
  tipo?: TipoMaterial;
  tipoDespesaId?: number;
  obraId?: number;
}): Promise<MaterialItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.q) searchParams.set('q', params.q);
  if (params?.tipo) searchParams.set('tipo', params.tipo);
  if (params?.tipoDespesaId) searchParams.set('tipoDespesaId', String(params.tipoDespesaId));
  if (params?.obraId) searchParams.set('obraId', String(params.obraId));
  const queryStr = searchParams.toString();
  return api.get<MaterialItem[]>(`/materiais${queryStr ? `?${queryStr}` : ''}`);
}

export async function criarMaterial(
  input: MaterialInput,
): Promise<MaterialItem> {
  return api.post<MaterialItem>('/materiais', input);
}

export async function atualizarMaterial(
  id: number,
  input: Partial<Omit<MaterialInput, 'quantidadeMinima' | 'custoUnitario'>> & {
    quantidadeMinima?: number | null;
    custoUnitario?: number | null;
    status?: StatusMaterial;
  },
): Promise<MaterialItem> {
  return api.put<MaterialItem>(`/materiais/${id}`, input);
}

export async function excluirMaterial(id: number): Promise<MaterialItem> {
  return api.del<MaterialItem>(`/materiais/${id}`);
}

// --- CRUD Tipos de Despesas Extras ---

export async function listarTiposDespesas(
  ativo?: boolean,
): Promise<TipoDespesa[]> {
  return api.get<TipoDespesa[]>('/materiais/lookups/tipos-despesas', { ativo });
}

export async function criarTipoDespesa(data: {
  nome: string;
  descricao?: string;
  requerObra?: boolean;
  ordem?: number;
}): Promise<TipoDespesa> {
  return api.post<TipoDespesa>('/materiais/lookups/tipos-despesas', data);
}

export async function atualizarTipoDespesa(
  id: number,
  data: Partial<{
    nome: string;
    descricao: string;
    requerObra: boolean;
    ativo: boolean;
    ordem: number;
  }>,
): Promise<TipoDespesa> {
  return api.put<TipoDespesa>(`/materiais/lookups/tipos-despesas/${id}`, data);
}

export async function desativarTipoDespesa(id: number): Promise<TipoDespesa> {
  return api.del<TipoDespesa>(`/materiais/lookups/tipos-despesas/${id}`);
}
