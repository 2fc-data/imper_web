import { api } from './core.js';
import type { LookupItem } from './lookups.js';

export interface VeiculoItem {
  id: number;
  codigo: string;
  placa: string;
  descricao: string;
  modelo: string | null;
  ano: number | null;
  combustivel: string;
  odometroAtual: number;
  observacoes: string | null;
  marcaId: number | null;
  marca?: LookupItem | null;
  corId: number | null;
  cor?: LookupItem | null;
  tipoId: number;
  tipo?: LookupItem;
  statusId: number;
  status?: LookupItem;
  responsavelId: number | null;
  responsavel?: { id: number; nome: string } | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VeiculoInput {
  codigo: string;
  placa: string;
  descricao: string;
  modelo?: string;
  ano?: number;
  combustivel?: string;
  odometroAtual?: number;
  observacoes?: string;
  marcaId?: number;
  corId?: number;
  tipoId: number;
  statusId: number;
  responsavelId?: number;
  ativo?: boolean;
}

export interface RegistroKmItem {
  id: number;
  veiculoId: number;
  data: string;
  kmPercorrido: number;
  odometro: number;
  observacao: string | null;
  registradoPorId: number | null;
  registradoPor?: { id: number; nome: string } | null;
  veiculo?: { id: number; codigo: string; placa: string };
}

export interface RegistroKmInput {
  data?: string;
  kmPercorrido: number;
  observacao?: string;
}

export interface AbastecimentoItem {
  id: number;
  veiculoId: number;
  data: string;
  odometro: number;
  litros: number;
  valorTotal: number;
  precoLitro: number;
  kmDesdeUltimo: number | null;
  kmPorLitro: number | null;
  fornecedorId: number | null;
  fornecedor?: LookupItem | null;
  registradoPorId: number | null;
  registradoPor?: { id: number; nome: string } | null;
  veiculo?: { id: number; codigo: string; placa: string };
}

export interface AbastecimentoInput {
  veiculoId: number;
  data?: string;
  odometro?: number;
  litros: number;
  valorTotal: number;
  fornecedorId?: number;
}

export interface ManutencaoVeiculoItem {
  id: number;
  veiculoId: number;
  tipoId: number;
  data: string;
  descricao: string;
  local: string | null;
  custoPecas: number;
  custoMaoDeObra: number;
  custoTotal: number;
  proximaManutencao: string | null;
  status: string;
  responsavelManutencaoId: number | null;
  veiculo?: { id: number; codigo: string; placa: string };
  tipo?: LookupItem | null;
  responsavelManutencao?: { id: number; nome: string } | null;
}

export interface ManutencaoVeiculoInput {
  veiculoId: number;
  tipoId: number;
  data: string;
  descricao: string;
  local?: string;
  custoPecas?: number;
  custoMaoDeObra?: number;
  proximaManutencao?: string;
  status?: string;
  responsavelManutencaoId?: number;
}

export interface AnalisesFrota {
  kmTotalMes: number;
  abastecimentosMes: {
    totalLitros: number;
    totalValor: number;
    quantidade: number;
  };
  manutencoesPorStatus: { status: string; quantidade: number }[];
  veiculosSemKm: {
    id: number;
    codigo: string;
    placa: string;
    ultimoRegistro: string | null;
  }[];
  mes: number;
  ano: number;
}

export interface VeiculoLookups {
  tiposVeiculo: LookupItem[];
  statusVeiculos: LookupItem[];
  marcas: LookupItem[];
  cores: LookupItem[];
  tiposManutencao: LookupItem[];
  responsaveis: { id: number; nome: string }[];
}

export interface ManutencoesVeiculosLookups {
  veiculos: { id: number; codigo: string; placa: string }[];
  tiposManutencao: LookupItem[];
  responsaveis: { id: number; nome: string }[];
}

// ---- Veículos ----
export async function listarVeiculos(params?: {
  q?: string;
  statusId?: number;
  tipoId?: number;
}): Promise<VeiculoItem[]> {
  const sp = new URLSearchParams();
  if (params?.q) sp.set('q', params.q);
  if (params?.statusId) sp.set('statusId', String(params.statusId));
  if (params?.tipoId) sp.set('tipoId', String(params.tipoId));
  const qs = sp.toString();
  return api.get<VeiculoItem[]>(`/veiculos${qs ? `?${qs}` : ''}`);
}

export async function buscarVeiculoLookups(): Promise<VeiculoLookups> {
  return api.get<VeiculoLookups>('/veiculos/lookups');
}

export async function buscarAnalisesFrota(params?: {
  mes?: number;
  ano?: number;
}): Promise<AnalisesFrota> {
  const sp = new URLSearchParams();
  if (params?.mes) sp.set('mes', String(params.mes));
  if (params?.ano) sp.set('ano', String(params.ano));
  const qs = sp.toString();
  return api.get<AnalisesFrota>(`/veiculos/analises${qs ? `?${qs}` : ''}`);
}

export async function obterVeiculo(id: number): Promise<VeiculoItem> {
  return api.get<VeiculoItem>(`/veiculos/${id}`);
}

export async function obterProximoCodigoVeiculo(): Promise<{ codigo: string }> {
  return api.get<{ codigo: string }>('/veiculos/proximo-codigo');
}

export async function criarVeiculo(input: VeiculoInput): Promise<VeiculoItem> {
  return api.post<VeiculoItem>('/veiculos', input);
}

export async function atualizarVeiculo(
  id: number,
  input: Partial<VeiculoInput>,
): Promise<VeiculoItem> {
  return api.put<VeiculoItem>(`/veiculos/${id}`, input);
}

export async function excluirVeiculo(id: number): Promise<VeiculoItem> {
  return api.del<VeiculoItem>(`/veiculos/${id}`);
}

// ---- Registros KM ----
export async function listarRegistrosKm(
  veiculoId: number,
  params?: { mes?: number; ano?: number },
): Promise<RegistroKmItem[]> {
  const sp = new URLSearchParams();
  if (params?.mes) sp.set('mes', String(params.mes));
  if (params?.ano) sp.set('ano', String(params.ano));
  const qs = sp.toString();
  return api.get<RegistroKmItem[]>(
    `/veiculos/${veiculoId}/km${qs ? `?${qs}` : ''}`,
  );
}

export async function registrarKm(
  veiculoId: number,
  input: RegistroKmInput,
): Promise<RegistroKmItem> {
  return api.post<RegistroKmItem>(`/veiculos/${veiculoId}/km`, input);
}

export async function atualizarRegistroKm(
  id: number,
  input: Partial<RegistroKmInput>,
): Promise<RegistroKmItem> {
  return api.put<RegistroKmItem>(`/registros-km/${id}`, input);
}

export async function excluirRegistroKm(id: number): Promise<RegistroKmItem> {
  return api.del<RegistroKmItem>(`/registros-km/${id}`);
}

// ---- Abastecimentos ----
export async function listarAbastecimentos(params?: {
  veiculoId?: number;
}): Promise<AbastecimentoItem[]> {
  const sp = new URLSearchParams();
  if (params?.veiculoId) sp.set('veiculoId', String(params.veiculoId));
  const qs = sp.toString();
  return api.get<AbastecimentoItem[]>(
    `/abastecimentos-veiculos${qs ? `?${qs}` : ''}`,
  );
}

export async function criarAbastecimento(
  input: AbastecimentoInput,
): Promise<AbastecimentoItem> {
  return api.post<AbastecimentoItem>('/abastecimentos-veiculos', input);
}

export async function atualizarAbastecimento(
  id: number,
  input: Partial<AbastecimentoInput>,
): Promise<AbastecimentoItem> {
  return api.put<AbastecimentoItem>(`/abastecimentos-veiculos/${id}`, input);
}

export async function excluirAbastecimento(
  id: number,
): Promise<AbastecimentoItem> {
  return api.del<AbastecimentoItem>(`/abastecimentos-veiculos/${id}`);
}

// ---- Manutenções de Veículos ----
export async function listarManutencoesVeiculos(params?: {
  veiculoId?: number;
  status?: string;
}): Promise<ManutencaoVeiculoItem[]> {
  const sp = new URLSearchParams();
  if (params?.veiculoId) sp.set('veiculoId', String(params.veiculoId));
  if (params?.status) sp.set('status', params.status);
  const qs = sp.toString();
  return api.get<ManutencaoVeiculoItem[]>(
    `/manutencoes-veiculos${qs ? `?${qs}` : ''}`,
  );
}

export async function buscarManutencoesVeiculosLookups(): Promise<ManutencoesVeiculosLookups> {
  return api.get<ManutencoesVeiculosLookups>('/manutencoes-veiculos/lookups');
}

export async function criarManutencaoVeiculo(
  input: ManutencaoVeiculoInput,
): Promise<ManutencaoVeiculoItem> {
  return api.post<ManutencaoVeiculoItem>('/manutencoes-veiculos', input);
}

export async function atualizarManutencaoVeiculo(
  id: number,
  input: Partial<ManutencaoVeiculoInput>,
): Promise<ManutencaoVeiculoItem> {
  return api.put<ManutencaoVeiculoItem>(`/manutencoes-veiculos/${id}`, input);
}

export async function excluirManutencaoVeiculo(
  id: number,
): Promise<ManutencaoVeiculoItem> {
  return api.del<ManutencaoVeiculoItem>(`/manutencoes-veiculos/${id}`);
}
