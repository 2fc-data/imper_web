export interface LoginResponse {
  token: string;
  user: {
    id: number;
    nome: string;
    email: string;
    papel: string;
    permissoes: string[];
  };
}

export interface ApiError {
  status: number;
  message: string;
  details?: unknown;
}

const TOKEN_KEY = 'imper_token';

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ??
  '/api';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    if (!res.ok) {
      let message = res.statusText || 'Erro inesperado';
      let details: unknown;
      try {
        const body = await res.json();
        if (typeof body?.message === 'string') message = body.message;
        details = body?.details;
      } catch {
        /* corpo não-JSON */
      }
      const err = new Error(message) as Error & {
        status?: number;
        details?: unknown;
      };
      err.status = res.status;
      err.details = details;
      throw err;
    }

    if (res.status === 204) return undefined as T;
    const contentType = res.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      throw new Error(
        `Resposta inválida do servidor (${res.status}): esperava JSON mas recebeu ${contentType}`,
      );
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export async function login(
  email: string,
  senha: string,
): Promise<LoginResponse> {
  const data = await api.post<LoginResponse>('/auth/login', { email, senha });
  setToken(data.token);
  return data;
}

export async function fetchMe(): Promise<LoginResponse['user']> {
  return api.get<LoginResponse['user']>('/auth/me');
}

export function logout(): void {
  setToken(null);
}

export interface CadastroInput {
  nome: string;
  telefone: string;
  email?: string;
  senha: string;
  turnstileToken?: string;
}

export async function cadastrar(input: CadastroInput): Promise<LoginResponse> {
  const data = await api.post<LoginResponse>('/auth/cadastro', input);
  setToken(data.token);
  return data;
}

export async function recuperarSenha(
  input: { canal: 'email' | 'whatsapp'; email?: string; telefone?: string },
): Promise<{ ok: boolean; devToken?: string }> {
  return api.post<{ ok: boolean; devToken?: string }>('/auth/recuperar-senha', input);
}

export async function redefinirSenha(
  token: string,
  novaSenha: string,
): Promise<{ ok: boolean }> {
  return api.post<{ ok: boolean }>('/auth/redefinir-senha', {
    token,
    novaSenha,
  });
}

export interface PapelRbac {
  id: number;
  nome: string;
  descricao: string | null;
  ativo: boolean;
}

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  papel: string;
  papeis: PapelRbac[];
  ativo: boolean;
  cargoId: number | null;
  cargo?: { id: number; nome: string } | null;
  createdAt: string;
  cpfCnpj?: string | null;
  endereco?: {
    id: number;
    logradouro: string;
    numero: string | null;
    complemento: string | null;
    bairro: string | null;
    cidade: string | null;
    estado: string | null;
    cep: string | null;
  } | null;
}

export async function listarUsuarios(): Promise<Usuario[]> {
  return api.get<Usuario[]>('/usuarios');
}

export async function listarPapeis(): Promise<PapelRbac[]> {
  return api.get<PapelRbac[]>('/usuarios/papeis');
}

export async function definirPerfilUsuario(
  id: number,
  papelId: number,
): Promise<Usuario> {
  return api.patch<Usuario>(`/usuarios/${id}/perfil`, { papelId });
}

export async function atualizarUsuario(
  id: number,
  data: {
    nome?: string;
    telefone?: string;
    papelId?: number;
    cargoId?: number | null;
    ativo?: boolean;
    cpfCnpj?: string;
    cep?: string;
    endereco?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    numero?: string;
    complemento?: string;
  },
): Promise<Usuario> {
  return api.put<Usuario>(`/usuarios/${id}`, data);
}

export interface CriarUsuarioInput {
  nome: string;
  email?: string;
  senha: string;
  telefone?: string;
  papelId: number;
  cargoId?: number | null;
  cpfCnpj?: string;
  cep?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  numero?: string;
  complemento?: string;
}

export async function criarUsuario(input: CriarUsuarioInput): Promise<Usuario> {
  return api.post<Usuario>('/usuarios', input);
}

export interface Cargo {
  id: number;
  nome: string;
  descricao: string | null;
  ativo: boolean;
}

export async function listarCargos(): Promise<Cargo[]> {
  return api.get('/usuarios/cargos');
}

export async function criarCargo(data: {
  nome: string;
  descricao?: string;
}): Promise<Cargo> {
  return api.post('/usuarios/cargos', data);
}

export async function atualizarCargo(
  id: number,
  data: { nome?: string; descricao?: string; ativo?: boolean },
): Promise<Cargo> {
  return api.put(`/usuarios/cargos/${id}`, data);
}

export interface MeuCliente {
  id: number;
  nome: string;
  cpfCnpj: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
}

export interface MinhaConta {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  papel: string;
  permissoes: string[];
  cliente: MeuCliente | null;
}

export interface MinhaOS {
  id: number;
  codigo: string | null;
  status: string;
  urgencia: string;
  valorTotal: string;
  endereco: string | null;
  dataInicioPrevista: string | null;
  confirmadoPorCliente: boolean;
  confirmadoEm: string | null;
  createdAt: string;
  orcamento: {
    codigo: string | null;
    valorTotal: string;
    status: string;
  } | null;
}

export async function buscarMinhaConta(): Promise<MinhaConta> {
  return api.get<MinhaConta>('/cliente/me');
}

export async function buscarClientes(q: string): Promise<MeuCliente[]> {
  return api.get<MeuCliente[]>(`/cliente?q=${encodeURIComponent(q)}`);
}

export async function listarMinhasOS(): Promise<MinhaOS[]> {
  return api.get<MinhaOS[]>('/cliente/os');
}

export interface ServicoMarketing {
  id: number;
  titulo: string;
  descricao: string;
  icone: string;
  ativo: boolean;
  ordem: number;
  createdAt: string;
  updatedAt: string;
}

export async function listarServicos(): Promise<ServicoMarketing[]> {
  return api.get<ServicoMarketing[]>('/publico/servicos');
}

export interface ServicoMarketingInput {
  titulo: string;
  descricao: string;
  icone: string;
  ativo?: boolean;
}

export async function listarServicosAdmin(params?: {
  q?: string;
}): Promise<ServicoMarketing[]> {
  const searchParams = new URLSearchParams();
  if (params?.q) searchParams.set('q', params.q);
  const queryStr = searchParams.toString();
  return api.get<ServicoMarketing[]>(
    `/servicos-admin${queryStr ? `?${queryStr}` : ''}`,
  );
}

export async function criarServico(
  input: ServicoMarketingInput,
): Promise<ServicoMarketing> {
  return api.post<ServicoMarketing>('/servicos-admin', input);
}

export async function atualizarServico(
  id: number,
  input: Partial<ServicoMarketingInput>,
): Promise<ServicoMarketing> {
  return api.put<ServicoMarketing>(`/servicos-admin/${id}`, input);
}

export async function excluirServico(id: number): Promise<{ ok: boolean }> {
  return api.del<{ ok: boolean }>(`/servicos-admin/${id}`);
}

export interface CidadeAtendida {
  id: number;
  nome: string;
  uf: string;
  lat: number;
  lng: number;
}

export async function listarCidades(): Promise<CidadeAtendida[]> {
  return api.get<CidadeAtendida[]>('/publico/cidades');
}

export interface OrcamentoInput {
  nome: string;
  telefone: string;
  email?: string;
  motivo?: string;
  mensagem?: string;
  cep?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  numero?: string;
  complemento?: string;
  turnstileToken?: string;
}

export interface OrcamentoResult {
  id: number;
  nome: string;
  canal: string;
  motivo: string;
  status: string;
  createdAt: string;
}

export async function solicitarOrcamento(
  input: OrcamentoInput,
): Promise<OrcamentoResult> {
  return api.post<OrcamentoResult>('/publico/orcamento', input);
}

import type {
  BaseLookup,
  CanalAtendimento,
  DadosEndereco,
  ResultadoVisita,
  StatusAgendamento,
  StatusAtendimento,
  StatusManutencao,
  StatusMaterial,
  StatusOrcamento,
  StatusOS,
  StatusVisita,
  TipoAgendamento,
  TipoCategoria,
  TipoItemServico,
  TipoMaterial,
  TipoMovimento,
  UnidadeMedida,
  Urgencia,
} from '../schemas/index.js';

export type {
  BaseLookup,
  CanalAtendimento,
  DadosEndereco,
  ResultadoVisita,
  StatusAgendamento,
  StatusAtendimento,
  StatusManutencao,
  StatusMaterial,
  StatusOrcamento,
  StatusOS,
  StatusVisita,
  TipoAgendamento,
  TipoCategoria,
  TipoItemServico,
  TipoMaterial,
  TipoMovimento,
  UnidadeMedida,
  Urgencia,
};

export interface AtendimentoItem {
  id: number;
  canal: CanalAtendimento;
  motivo: string;
  urgencia: Urgencia | null;
  status: StatusAtendimento;
  descricao: string | null;
  clienteId: number | null;
  cliente?: { id: number; nome: string; telefone: string | null } | null;
  atendenteId: number | null;
  atendente?: { id: number; nome: string } | null;
  createdAt: string;
  updatedAt: string;
  _count?: { visitas: number; os: number };
}

export interface AtendimentoLogItem {
  id: number;
  atendimentoId: number;
  atendenteId: number | null;
  atendente?: { id: number; nome: string } | null;
  tipo: 'TEXTO' | 'STATUS';
  descricao: string | null;
  statusDe: StatusAtendimento | null;
  statusPara: StatusAtendimento | null;
  createdAt: string;
}

export interface CriarAtendimentoInput {
  clienteId?: number | null;
  nome?: string;
  telefone?: string;
  email?: string;
  canal: CanalAtendimento;
  motivo: string;
  urgencia?: Urgencia;
  descricao?: string;
  enderecoNovo?: DadosEndereco;
}

export async function listarAtendimentos(params?: {
  status?: string;
  q?: string;
  criadoDe?: string;
  criadoAte?: string;
  atualizadoDe?: string;
  atualizadoAte?: string;
}): Promise<AtendimentoItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.q) searchParams.set('q', params.q);
  if (params?.criadoDe) searchParams.set('criadoDe', params.criadoDe);
  if (params?.criadoAte) searchParams.set('criadoAte', params.criadoAte);
  if (params?.atualizadoDe)
    searchParams.set('atualizadoDe', params.atualizadoDe);
  if (params?.atualizadoAte)
    searchParams.set('atualizadoAte', params.atualizadoAte);
  const queryStr = searchParams.toString();
  return api.get<AtendimentoItem[]>(
    `/atendimentos${queryStr ? `?${queryStr}` : ''}`,
  );
}

export async function criarAtendimento(
  input: CriarAtendimentoInput,
): Promise<AtendimentoItem> {
  return api.post<AtendimentoItem>('/atendimentos', input);
}

export async function atualizarStatusAtendimento(
  id: number,
  status: StatusAtendimento,
): Promise<AtendimentoItem> {
  return api.patch<AtendimentoItem>(`/atendimentos/${id}/status`, { status });
}

export async function listarLogsAtendimento(
  id: number,
): Promise<AtendimentoLogItem[]> {
  return api.get<AtendimentoLogItem[]>(`/atendimentos/${id}/atendimentos`);
}

export async function registrarLogAtendimento(
  id: number,
  descricao: string,
): Promise<AtendimentoLogItem> {
  return api.post<AtendimentoLogItem>(`/atendimentos/${id}/atendimentos`, {
    descricao,
  });
}

export interface ItemOrcamentoInput {
  servicoItemId?: number | null;
  nome: string;
  tipo: TipoItemServico;
  quantidade: number;
  unidadeId: number;
  valorUnitario: number;
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
  criadoPorId: number;
  aprovadoPorId: number | null;
  aprovadoEm: string | null;
  confirmadoPorCliente: boolean;
  dataConfirmacao: string | null;
  createdAt: string;
  updatedAt: string;
  atendimento?: { id: number; cliente: { id: number; nome: string } | null };
  cliente?: { id: number; nome: string } | null;
  ordemServico?: { id: number; codigo: string; status: string } | null;
  _count?: { itens: number };
}

export interface CriarOrcamentoInput {
  atendimentoId: number;
  visitaId?: number;
  enderecoId?: number;
  observacoes?: string;
  itens: ItemOrcamentoInput[];
}

export async function listarOrcamentosAdmin(params?: {
  status?: string;
  q?: string;
}): Promise<OrcamentoAdminItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.q) searchParams.set('q', params.q);
  const queryStr = searchParams.toString();
  return api.get<OrcamentoAdminItem[]>(
    `/orcamentos${queryStr ? `?${queryStr}` : ''}`,
  );
}

export async function criarOrcamentoAdmin(
  input: CriarOrcamentoInput,
): Promise<OrcamentoAdminItem> {
  return api.post<OrcamentoAdminItem>('/orcamentos', input);
}

export async function enviarOrcamentoAdmin(
  id: number,
): Promise<OrcamentoAdminItem> {
  return api.post<OrcamentoAdminItem>(`/orcamentos/${id}/enviar`);
}

export interface OrdemServicoAdminItem {
  id: number;
  codigo: string;
  orcamentoId: number;
  clienteId: number | null;
  atendimentoId: number | null;
  urgencia: Urgencia;
  status: StatusOS;
  valorTotal: string | number;
  endereco: string | null;
  dataInicioPrevista: string | null;
  tecnicoResponsavelId: number | null;
  createdAt: string;
  updatedAt: string;
  cliente?: { id: number; nome: string } | null;
  atendimento?: { id: number } | null;
  tecnicoResponsavel?: { id: number; nome: string } | null;
  _count?: { fases: number; compras: number };
}

export async function listarOSAdmin(params?: {
  status?: string;
  q?: string;
}): Promise<OrdemServicoAdminItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.q) searchParams.set('q', params.q);
  const queryStr = searchParams.toString();
  return api.get<OrdemServicoAdminItem[]>(
    `/os${queryStr ? `?${queryStr}` : ''}`,
  );
}

export async function aprovarOSAdmin(
  id: number,
): Promise<OrdemServicoAdminItem> {
  return api.post<OrdemServicoAdminItem>(`/os/${id}/aprovar`);
}

export async function iniciarOSAdmin(
  id: number,
): Promise<OrdemServicoAdminItem> {
  return api.post<OrdemServicoAdminItem>(`/os/${id}/iniciar`);
}

export async function concluirOSAdmin(
  id: number,
): Promise<OrdemServicoAdminItem> {
  return api.post<OrdemServicoAdminItem>(`/os/${id}/concluir`);
}

export async function cancelarOSAdmin(
  id: number,
  motivo?: string,
): Promise<OrdemServicoAdminItem> {
  return api.post<OrdemServicoAdminItem>(`/os/${id}/cancelar`, { motivo });
}

// ---------------------------------------------------------------------------
// Agendamentos
// ---------------------------------------------------------------------------

export interface EnderecoItem {
  id: number;
  rotulo?: string;
  logradouro: string;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  principal?: boolean;
}

export interface AgendamentoItem {
  id: number;
  clienteId: number;
  atendimentoId: number | null;
  enderecoId: number | null;
  userId: number | null;
  tipo: TipoAgendamento;
  status: StatusAgendamento;
  dataPrevista: string;
  dataRealizada: string | null;
  observacoes: string | null;
  criadoPorId: number | null;
  createdAt: string;
  updatedAt: string;
  cliente?: { id: number; nome: string; telefone: string | null } | null;
  user?: { id: number; nome: string } | null;
  criadoPor?: { id: number; nome: string } | null;
  endereco?: EnderecoItem | null;
  atendimento?: {
    id: number;
    descricao: string;
    urgencia?: Urgencia | null;
  } | null;
}

export interface CriarAgendamentoInput {
  clienteId: number;
  atendimentoId?: number | null;
  enderecoId?: number | null;
  userId?: number | null;
  tipo?: TipoAgendamento;
  status?: StatusAgendamento;
  dataPrevista: string;
  dataRealizada?: string | null;
  observacoes?: string;
}

export interface ListarAgendamentosParams {
  status?: StatusAgendamento;
  tipo?: TipoAgendamento;
  clienteId?: number;
  userId?: number;
  dataDe?: string;
  dataAte?: string;
}

export async function listarAgendamentos(
  params?: ListarAgendamentosParams,
): Promise<AgendamentoItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.tipo) searchParams.set('tipo', params.tipo);
  if (params?.clienteId)
    searchParams.set('clienteId', String(params.clienteId));
  if (params?.userId) searchParams.set('userId', String(params.userId));
  if (params?.dataDe) searchParams.set('dataDe', params.dataDe);
  if (params?.dataAte) searchParams.set('dataAte', params.dataAte);
  const queryStr = searchParams.toString();
  return api.get<AgendamentoItem[]>(
    `/agendamentos${queryStr ? `?${queryStr}` : ''}`,
  );
}

export async function criarAgendamento(
  input: CriarAgendamentoInput,
): Promise<AgendamentoItem> {
  return api.post<AgendamentoItem>('/agendamentos', input);
}

export async function detalharAgendamento(
  id: number,
): Promise<AgendamentoItem> {
  return api.get<AgendamentoItem>(`/agendamentos/${id}`);
}

export async function atualizarAgendamento(
  id: number,
  input: Partial<CriarAgendamentoInput>,
): Promise<AgendamentoItem> {
  return api.patch<AgendamentoItem>(`/agendamentos/${id}`, input);
}

export async function atualizarStatusAgendamento(
  id: number,
  status: StatusAgendamento,
  dataRealizada?: string | null,
): Promise<AgendamentoItem> {
  return api.patch<AgendamentoItem>(`/agendamentos/${id}/status`, {
    status,
    dataRealizada,
  });
}

export async function removerAgendamento(id: number): Promise<void> {
  return api.del(`/agendamentos/${id}`);
}

// ---------------------------------------------------------------------------
// Visitas (v2)
// ---------------------------------------------------------------------------

export interface VisitaItem {
  id: number;
  atendimentoId: number;
  tecnicoId: number | null;
  dataPrevista: string;
  dataRealizada: string | null;
  status: StatusVisita;
  urgencia: Urgencia | null;
  enderecoId: number | null;
  relatorio: string | null;
  resultado: ResultadoVisita | null;
  constatacao: string | null;
  necessitaOrcamento: boolean;
  necessitaObra: boolean;
  createdAt: string;
  updatedAt: string;
  atendimento?: {
    id: number;
    descricao: string;
    urgencia?: Urgencia | null;
    status?: string | null;
    cliente?: { id: number; nome: string } | null;
  } | null;
  endereco?: EnderecoItem | null;
  tecnico?: { id: number; nome: string } | null;
  _count?: { orcamentos: number };
}

export interface AgendarVisitaInput {
  atendimentoId: number;
  tecnicoId?: number | null;
  dataPrevista?: string;
  urgencia?: Urgencia;
  enderecoId?: number | null;
}

export interface RealizarVisitaV2Input {
  relatorio?: string;
  urgencia?: Urgencia;
  resultado?: ResultadoVisita;
  constatacao?: string;
  necessitaOrcamento?: boolean;
  necessitaObra?: boolean;
}

export async function listarVisitas(params?: {
  status?: StatusVisita;
}): Promise<VisitaItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  const queryStr = searchParams.toString();
  return api.get<VisitaItem[]>(`/visitas${queryStr ? `?${queryStr}` : ''}`);
}

export async function agendarVisita(
  input: AgendarVisitaInput,
): Promise<VisitaItem> {
  return api.post<VisitaItem>('/visitas', input);
}

export async function realizarVisitaV2(
  id: number,
  input: RealizarVisitaV2Input,
): Promise<VisitaItem> {
  return api.post<VisitaItem>(`/visitas/${id}/realizar`, input);
}

export async function cancelarVisita(id: number): Promise<VisitaItem> {
  return api.post<VisitaItem>(`/visitas/${id}/cancelar`);
}

// ---------------------------------------------------------------------------
// Equipamentos
// ---------------------------------------------------------------------------

export interface LookupItem extends BaseLookup {
  descricao: string | null;
  ordem: number;
  createdAt: string;
  updatedAt: string;
}

export interface LookupInput {
  nome: string;
  descricao?: string;
  ordem?: number;
}

export interface SubcategoriaItem extends LookupItem {
  categoriaId: number;
}

export interface SubcategoriaInput extends LookupInput {
  categoriaId: number;
}

export interface FornecedorItem {
  id: number;
  nome: string;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FornecedorInput {
  nome: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
}

export interface EquipamentoLookups {
  categorias: LookupItem[];
  subcategorias: SubcategoriaItem[];
  marcas: LookupItem[];
  fornecedores: FornecedorItem[];
  localizacoes: LookupItem[];
  statuses: LookupItem[];
  estadosConservacao: LookupItem[];
  tiposManutencao: LookupItem[];
  unidadesMedida: UnidadeMedida[];
}

export async function listarLookupsEquipamentos(): Promise<EquipamentoLookups> {
  return api.get<EquipamentoLookups>('/equipamentos/lookups');
}

export interface EpiLookups {
  categorias: LookupItem[];
  subcategorias: SubcategoriaItem[];
  marcas: LookupItem[];
  fornecedores: FornecedorItem[];
  localizacoes: LookupItem[];
  cores: LookupItem[];
  tamanhos: LookupItem[];
  colaboradores: { id: number; nome: string }[];
  statuses?: LookupItem[];
  estadosConservacao?: LookupItem[];
  unidadesMedida?: UnidadeMedida[];
  tiposManutencao?: LookupItem[];
}

export async function listarLookupsEpis(): Promise<EpiLookups> {
  const [
    categorias,
    subcategorias,
    marcas,
    fornecedores,
    localizacoes,
    cores,
    tamanhos,
    colaboradores,
    unidadesMedida,
  ] = await Promise.all([
    api.get<LookupItem[]>('/epis/lookups/categorias'),
    api.get<SubcategoriaItem[]>('/epis/lookups/subcategorias'),
    api.get<LookupItem[]>('/epis/lookups/marcas'),
    api.get<FornecedorItem[]>('/epis/lookups/fornecedores'),
    api.get<LookupItem[]>('/epis/lookups/localizacoes'),
    api.get<LookupItem[]>('/epis/lookups/cores'),
    api.get<LookupItem[]>('/epis/lookups/tamanhos'),
    api.get<{ id: number; nome: string }[]>('/epis/lookups/colaboradores'),
    api.get<UnidadeMedida[]>('/epis/lookups/unidades-medida'),
  ]);
  return {
    categorias,
    subcategorias,
    marcas,
    fornecedores,
    localizacoes,
    cores,
    tamanhos,
    colaboradores,
    unidadesMedida,
  };
}

function criarLookupApi<R extends BaseLookup>(base: string) {
  return {
    listar: () => api.get<R[]>(`${base}`),
    criar: (input: LookupInput) => api.post<R>(`${base}`, input),
    atualizar: (
      id: number,
      input: Partial<LookupInput> & { ativo?: boolean },
    ) => api.put<R>(`${base}/${id}`, input),
    desativar: (id: number) => api.del<R>(`${base}/${id}`),
  };
}

export const categoriasApi = criarLookupApi<LookupItem>(
  '/equipamentos/lookups/categorias',
);
export const marcasApi = criarLookupApi<LookupItem>(
  '/equipamentos/lookups/marcas',
);
export const localizacoesApi = criarLookupApi<LookupItem>(
  '/equipamentos/lookups/localizacoes',
);
export const statusEquipamentoApi = criarLookupApi<LookupItem>(
  '/equipamentos/lookups/status',
);
export const estadosConservacaoApi = criarLookupApi<LookupItem>(
  '/equipamentos/lookups/estados-conservacao',
);
export const tiposManutencaoApi = criarLookupApi<LookupItem>(
  '/equipamentos/lookups/tipos-manutencao',
);
export const unidadesMedidaApi = criarLookupApi<UnidadeMedida>(
  '/equipamentos/lookups/unidades-medida',
);

export const categoriasMaterialApi = criarLookupApi<LookupItem>(
  '/materiais/lookups/categorias',
);

export const subcategoriasMaterialApi = criarLookupApi<SubcategoriaItem>(
  '/materiais/lookups/subcategorias',
);

export const coresMaterialApi = criarLookupApi<LookupItem>(
  '/materiais/lookups/cores',
);

export const marcasMaterialApi = criarLookupApi<LookupItem>(
  '/materiais/lookups/marcas',
);

export const categoriasEpiApi = criarLookupApi<LookupItem>(
  '/epis/lookups/categorias',
);

export const subcategoriasEpiApi = criarLookupApi<SubcategoriaItem>(
  '/epis/lookups/subcategorias',
);

export const marcasEpiApi = criarLookupApi<LookupItem>('/epis/lookups/marcas');

export const coresEpiApi = criarLookupApi<LookupItem>('/epis/lookups/cores');

export const tamanhosEpiApi = criarLookupApi<LookupItem>(
  '/epis/lookups/tamanhos',
);

export const localizacoesEpiApi = criarLookupApi<LookupItem>(
  '/epis/lookups/localizacoes',
);

export const fornecedoresEpiApi = criarLookupApi<FornecedorItem>(
  '/epis/lookups/fornecedores',
);

export const subcategoriasApi = {
  listar: () =>
    api.get<SubcategoriaItem[]>('/equipamentos/lookups/subcategorias'),
  criar: (input: SubcategoriaInput) =>
    api.post<SubcategoriaItem>('/equipamentos/lookups/subcategorias', input),
  atualizar: (
    id: number,
    input: Partial<SubcategoriaInput> & { ativo?: boolean },
  ) =>
    api.put<SubcategoriaItem>(
      `/equipamentos/lookups/subcategorias/${id}`,
      input,
    ),
  desativar: (id: number) =>
    api.del<SubcategoriaItem>(`/equipamentos/lookups/subcategorias/${id}`),
};

export const fornecedoresApi = {
  listar: () => api.get<FornecedorItem[]>('/equipamentos/lookups/fornecedores'),
  criar: (input: FornecedorInput) =>
    api.post<FornecedorItem>('/equipamentos/lookups/fornecedores', input),
  atualizar: (
    id: number,
    input: Partial<FornecedorInput> & { ativo?: boolean },
  ) =>
    api.put<FornecedorItem>(`/equipamentos/lookups/fornecedores/${id}`, input),
  desativar: (id: number) =>
    api.del<FornecedorItem>(`/equipamentos/lookups/fornecedores/${id}`),
};

export interface RetiradaEquipamentoItem {
  id: number;
  equipamentoId: number;
  colaboradorId: number;
  colaborador?: { id: number; nome: string };
  observacao: string | null;
  registradoPorId: number;
  dataRetirada: string;
  dataDevolucao: string | null;
}

export interface EquipamentoItem {
  id: number;
  codigo: string;
  numeroPatrimonio: string | null;
  descricao: string;
  modelo: string | null;
  numeroSerie: string | null;
  marcaId: number | null;
  marca?: LookupItem | null;
  categoriaId: number | null;
  categoria?: LookupItem | null;
  subcategoriaId: number | null;
  subcategoria?: SubcategoriaItem | null;
  localizacaoId: number | null;
  localizacao?: LookupItem | null;
  fornecedorId: number | null;
  statusId: number;
  status?: LookupItem;
  estadoConservacaoId: number | null;
  estadoConservacao?: LookupItem | null;
  responsavelId: number | null;
  responsavel?: { id: number; nome: string } | null;
  unidadeMedidaId: number | null;
  unidadeMedida?: UnidadeMedida | null;
  dataAquisicao: string | null;
  valorAquisicao: number | null;
  dataGarantia: string | null;
  observacoes: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  retiradas?: RetiradaEquipamentoItem[];
}

export interface EquipamentoInput {
  codigo: string;
  numeroPatrimonio?: string;
  descricao: string;
  modelo?: string;
  numeroSerie?: string;
  marcaId?: number;
  categoriaId?: number;
  subcategoriaId?: number;
  localizacaoId?: number;
  fornecedorId?: number;
  statusId: number;
  estadoConservacaoId?: number;
  unidadeMedidaId?: number;
  dataAquisicao?: string;
  valorAquisicao?: number;
  dataGarantia?: string;
  observacoes?: string;
}

export async function listarEquipamentos(params?: {
  q?: string;
  statusId?: number;
  categoriaId?: number;
  ativo?: boolean;
}): Promise<EquipamentoItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.q) searchParams.set('q', params.q);
  if (params?.statusId) searchParams.set('statusId', String(params.statusId));
  if (params?.categoriaId)
    searchParams.set('categoriaId', String(params.categoriaId));
  if (params?.ativo !== undefined)
    searchParams.set('ativo', String(params.ativo));
  const queryStr = searchParams.toString();
  return api.get<EquipamentoItem[]>(
    `/equipamentos${queryStr ? `?${queryStr}` : ''}`,
  );
}

export async function detalharEquipamento(
  id: number,
): Promise<EquipamentoItem> {
  return api.get<EquipamentoItem>(`/equipamentos/${id}`);
}

export async function criarEquipamento(
  input: EquipamentoInput,
): Promise<EquipamentoItem> {
  return api.post<EquipamentoItem>('/equipamentos', input);
}

export async function atualizarEquipamento(
  id: number,
  input: Partial<EquipamentoInput> & { ativo?: boolean },
): Promise<EquipamentoItem> {
  return api.put<EquipamentoItem>(`/equipamentos/${id}`, input);
}

export async function excluirEquipamento(id: number): Promise<EquipamentoItem> {
  return api.del<EquipamentoItem>(`/equipamentos/${id}`);
}

export async function registrarRetiradaEquipamento(
  id: number,
  input: { colaboradorId: number; observacao?: string },
): Promise<RetiradaEquipamentoItem> {
  return api.post<RetiradaEquipamentoItem>(
    `/equipamentos/${id}/retirada`,
    input,
  );
}

export async function registrarDevolucaoEquipamento(
  id: number,
): Promise<RetiradaEquipamentoItem> {
  return api.post<RetiradaEquipamentoItem>(`/equipamentos/${id}/devolucao`);
}

// ---------------------------------------------------------------------------
// EPIs
// ---------------------------------------------------------------------------

export interface EntregaEpiItem {
  id: number;
  epiId: number;
  colaboradorId: number;
  colaborador?: { id: number; nome: string };
  quantidade: number;
  observacao: string | null;
  registradoPorId: number;
  registradoPor?: { id: number; nome: string };
  data: string;
}

export interface EpiItem {
  id: number;
  codigo: string;
  nome: string;
  numeroCa: string | null;
  numeroPatrimonio: string | null;
  dataValidade: string | null;
  quantidade: number;
  quantidadeMinima: number | null;
  ativo: boolean;
  marcaId: number | null;
  marca?: LookupItem | null;
  categoriaId: number | null;
  categoria?: LookupItem | null;
  subcategoriaId: number | null;
  subcategoria?: SubcategoriaItem | null;
  localizacaoId: number | null;
  localizacao?: LookupItem | null;
  fornecedorId: number | null;
  fornecedor?: FornecedorItem | null;
  unidadeMedidaId: number | null;
  unidadeMedida?: UnidadeMedida | null;
  createdAt: string;
  updatedAt: string;
  entregas?: EntregaEpiItem[];
}

export interface EpiInput {
  codigo: string;
  nome: string;
  numeroCa?: string;
  numeroPatrimonio?: string;
  dataValidade?: string;
  quantidade?: number;
  quantidadeMinima?: number;
  marcaId?: number;
  categoriaId?: number;
  subcategoriaId?: number;
  localizacaoId?: number;
  fornecedorId?: number;
  unidadeMedidaId?: number;
}

export async function listarEpis(params?: {
  q?: string;
  ativo?: boolean;
}): Promise<EpiItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.q) searchParams.set('q', params.q);
  if (params?.ativo !== undefined)
    searchParams.set('ativo', String(params.ativo));
  const queryStr = searchParams.toString();
  return api.get<EpiItem[]>(`/epis${queryStr ? `?${queryStr}` : ''}`);
}

export async function detalharEpi(id: number): Promise<EpiItem> {
  return api.get<EpiItem>(`/epis/${id}`);
}

export async function criarEpi(input: EpiInput): Promise<EpiItem> {
  return api.post<EpiItem>('/epis', input);
}

export async function atualizarEpi(
  id: number,
  input: Partial<Omit<EpiInput, 'dataValidade' | 'quantidadeMinima'>> & {
    dataValidade?: string | null;
    quantidadeMinima?: number | null;
    ativo?: boolean;
  },
): Promise<EpiItem> {
  return api.put<EpiItem>(`/epis/${id}`, input);
}

export async function excluirEpi(id: number): Promise<EpiItem> {
  return api.del<EpiItem>(`/epis/${id}`);
}

export async function registrarEntregaEpi(
  id: number,
  input: { colaboradorId: number; quantidade: number; observacao?: string },
): Promise<EntregaEpiItem> {
  return api.post<EntregaEpiItem>(`/epis/${id}/entrega`, input);
}

// ---------------------------------------------------------------------------
// Manutenções
// ---------------------------------------------------------------------------

export interface ManutencaoItem {
  id: number;
  equipamentoId: number;
  tipoId: number;
  data: string;
  descricao: string;
  custo: number | null;
  status: StatusManutencao;
  responsavelManutencaoId: number;
  proximaManutencao: string | null;
  createdAt: string;
  updatedAt: string;
  equipamento?: {
    id: number;
    codigo: string | null;
    descricao: string;
    numeroPatrimonio: string | null;
  };
  tipo?: LookupItem | null;
  responsavelManutencao?: { id: number; nome: string } | null;
}

export interface ManutencaoInput {
  equipamentoId: number;
  tipoId: number;
  data: string;
  descricao: string;
  custo?: number;
  responsavelManutencaoId?: number;
  proximaManutencao?: string;
}

export async function listarManutencoes(params?: {
  equipamentoId?: number;
  status?: StatusManutencao;
}): Promise<ManutencaoItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.equipamentoId)
    searchParams.set('equipamentoId', String(params.equipamentoId));
  if (params?.status) searchParams.set('status', params.status);
  const queryStr = searchParams.toString();
  return api.get<ManutencaoItem[]>(
    `/manutencoes${queryStr ? `?${queryStr}` : ''}`,
  );
}

export async function detalharManutencao(id: number): Promise<ManutencaoItem> {
  return api.get<ManutencaoItem>(`/manutencoes/${id}`);
}

export async function criarManutencao(
  input: ManutencaoInput,
): Promise<ManutencaoItem> {
  return api.post<ManutencaoItem>('/manutencoes', input);
}

export async function atualizarManutencao(
  id: number,
  input: Partial<
    Omit<
      ManutencaoInput,
      'custo' | 'responsavelManutencaoId' | 'proximaManutencao'
    >
  > & {
    custo?: number | null;
    responsavelManutencaoId?: number | null;
    proximaManutencao?: string | null;
    status?: StatusManutencao;
  },
): Promise<ManutencaoItem> {
  return api.put<ManutencaoItem>(`/manutencoes/${id}`, input);
}

export async function excluirManutencao(id: number): Promise<ManutencaoItem> {
  return api.del<ManutencaoItem>(`/manutencoes/${id}`);
}

// ---------------------------------------------------------------------------
// Materiais
// ---------------------------------------------------------------------------

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
  ordemServicoId: number | null;
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
  quantidadeMinima?: number;
  custoUnitario?: number;
}

export interface MaterialMovimentoInput {
  quantidade: number;
  observacao?: string;
}

export interface MaterialLookups {
  categorias: LookupItem[];
  subcategorias: SubcategoriaItem[];
  marcas: LookupItem[];
  cores: LookupItem[];
  unidadesMedida: UnidadeMedida[];
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
}): Promise<MaterialItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.q) searchParams.set('q', params.q);
  if (params?.tipo) searchParams.set('tipo', params.tipo);
  const queryStr = searchParams.toString();
  return api.get<MaterialItem[]>(`/materiais${queryStr ? `?${queryStr}` : ''}`);
}

export async function detalharMaterial(id: number): Promise<MaterialItem> {
  return api.get<MaterialItem>(`/materiais/${id}`);
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

export async function registrarEntradaMaterial(
  id: number,
  input: MaterialMovimentoInput,
): Promise<number> {
  return api.post<number>(`/materiais/${id}/entrada`, input);
}

export async function registrarSaidaMaterial(
  id: number,
  input: MaterialMovimentoInput,
): Promise<number> {
  return api.post<number>(`/materiais/${id}/saida`, input);
}

// ─── RBAC (Papéis e Permissões) ───────────────────────────────────────────

export interface PermissaoRbac {
  id: number;
  chave: string;
  descricao: string;
  categoria: string;
}

export interface PapelRbacAdmin {
  id: number;
  nome: string;
  descricao: string | null;
  permissoes: PermissaoRbac[];
}

export async function listarPapeisRbac(): Promise<PapelRbacAdmin[]> {
  const data = await api.get<{ papeis: PapelRbacAdmin[] }>('/rbac/papeis');
  return data.papeis;
}

export async function criarPapelRbac(input: {
  nome: string;
  descricao?: string;
}): Promise<PapelRbacAdmin> {
  const data = await api.post<{ papel: PapelRbacAdmin }>('/rbac/papeis', input);
  return data.papel;
}

export async function atualizarPapelRbac(
  id: number,
  input: { nome?: string; descricao?: string },
): Promise<PapelRbacAdmin> {
  const data = await api.put<{ papel: PapelRbacAdmin }>(
    `/rbac/papeis/${id}`,
    input,
  );
  return data.papel;
}

export async function excluirPapelRbac(id: number): Promise<void> {
  await api.del(`/rbac/papeis/${id}`);
}

export async function listarPermissoesRbac(): Promise<PermissaoRbac[]> {
  const data = await api.get<{ permissoes: PermissaoRbac[] }>(
    '/rbac/permissoes',
  );
  return data.permissoes;
}

export async function listarPermissoesPorPapel(
  papelId: number,
): Promise<number[]> {
  const data = await api.get<{ permissoesIds: number[] }>(
    `/rbac/papeis/${papelId}/permissoes`,
  );
  return data.permissoesIds;
}

export async function definirPermissoesRbac(
  papelId: number,
  permissoesIds: number[],
): Promise<void> {
  await api.put(`/rbac/papeis/${papelId}/permissoes`, { permissoesIds });
}

// ─── Catálogo de Atividades ────────────────────────────────────────────────

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

export async function detalharCatalogoAtividade(
  id: string,
): Promise<CatalogoAtividadeItem> {
  return api.get<CatalogoAtividadeItem>(`/catalogo-atividades/${id}`);
}

export async function criarCatalogoAtividade(
  input: Omit<CatalogoAtividadeItem, 'id' | 'ativo' | 'criadoEm'>,
): Promise<CatalogoAtividadeItem> {
  return api.post<CatalogoAtividadeItem>('/catalogo-atividades', input);
}

export async function atualizarCatalogoAtividade(
  id: string,
  input: Partial<Omit<CatalogoAtividadeItem, 'id' | 'criadoEm'>>,
): Promise<CatalogoAtividadeItem> {
  return api.put<CatalogoAtividadeItem>(`/catalogo-atividades/${id}`, input);
}

export async function excluirCatalogoAtividade(
  id: string,
): Promise<CatalogoAtividadeItem> {
  return api.del<CatalogoAtividadeItem>(`/catalogo-atividades/${id}`);
}

// ─── Equipes ───────────────────────────────────────────────────────────────

export interface EquipeItem {
  id: string;
  nome: string;
  descricao?: string | null;
  especialidade?: string | null;
  status: string;
  osId: number;
  liderId: number;
  criadoEm: string;
  os?: { id: number; codigo: string; numero?: string };
  lider?: { id: number; nome: string };
  membros?: MembroEquipeItem[];
  atividades?: AtividadeOSItem[];
}

export interface MembroEquipeItem {
  id: string;
  usuarioId: number;
  funcao: string | null;
  usuario?: { id: number; nome: string; telefone: string | null };
}

export async function listarEquipes(params?: {
  osId?: number;
  status?: string;
  q?: string;
}): Promise<EquipeItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.osId) searchParams.set('osId', String(params.osId));
  if (params?.status) searchParams.set('status', params.status);
  if (params?.q) searchParams.set('q', params.q);
  const queryStr = searchParams.toString();
  return api.get<EquipeItem[]>(`/equipes${queryStr ? `?${queryStr}` : ''}`);
}

export async function detalharEquipe(id: string): Promise<EquipeItem> {
  return api.get<EquipeItem>(`/equipes/${id}`);
}

export async function criarEquipe(input: {
  nome: string;
  descricao?: string | null;
  especialidade?: string | null;
  osId?: number;
  liderId?: number;
  membros?: { usuarioId: number; funcao?: string }[];
}): Promise<EquipeItem> {
  return api.post<EquipeItem>('/equipes', input);
}

export async function atualizarEquipe(
  id: string,
  input: { nome?: string; liderId?: number; status?: string },
): Promise<EquipeItem> {
  return api.put<EquipeItem>(`/equipes/${id}`, input);
}

export async function adicionarMembroEquipe(
  equipeId: string,
  input: { usuarioId: number; funcao?: string },
): Promise<MembroEquipeItem> {
  return api.post<MembroEquipeItem>(`/equipes/${equipeId}/membros`, input);
}

export async function removerMembroEquipe(membroId: string): Promise<void> {
  return api.del(`/equipes/membros/${membroId}`);
}

// ─── Atividades OS ─────────────────────────────────────────────────────────

export interface AtividadeOSItem {
  id: string;
  osId: number;
  faseOSId: number | null;
  catalogoAtividadeId: string;
  catalogoId?: string;
  equipeId: string | null;
  status: string;
  dataPrevisao: string | null;
  criadoEm: string;
  os?: { id: number; codigo: string; numero?: string };
  faseOS?: { id: number; nome: string };
  catalogoAtividade?: CatalogoAtividadeItem;
  catalogo?: CatalogoAtividadeItem;
  equipe?: EquipeItem;
  checklist?: ChecklistItem[];
}

export async function listarAtividadesOS(params?: {
  osId?: number;
  faseOSId?: number;
  status?: string;
}): Promise<AtividadeOSItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.osId) searchParams.set('osId', String(params.osId));
  if (params?.faseOSId) searchParams.set('faseOSId', String(params.faseOSId));
  if (params?.status) searchParams.set('status', params.status);
  const queryStr = searchParams.toString();
  return api.get<AtividadeOSItem[]>(
    `/atividades-os${queryStr ? `?${queryStr}` : ''}`,
  );
}

export async function detalharAtividadeOS(
  id: string,
): Promise<AtividadeOSItem> {
  return api.get<AtividadeOSItem>(`/atividades-os/${id}`);
}

export async function planificarAtividades(input: {
  osId: number;
  faseOSId: number;
  atividades: {
    catalogoAtividadeId: string;
    equipeId?: string;
    dataPrevisao?: string;
  }[];
}): Promise<AtividadeOSItem[]> {
  return api.post<AtividadeOSItem[]>('/atividades-os/planificar', input);
}

export async function atualizarStatusAtividadeOS(
  id: string,
  status: string,
): Promise<AtividadeOSItem> {
  return api.put<AtividadeOSItem>(`/atividades-os/${id}/status`, { status });
}

// ─── Checklist ─────────────────────────────────────────────────────────────

export interface ChecklistItem {
  id: string;
  atividadeOSId: string;
  subStepAtividadeId: string;
  status: string;
  descricao?: string;
  concluidoPorId: number | null;
  dataConclusao: string | null;
  observacao: string | null;
  subStepAtividade?: SubStepItem;
  concluidoPor?: { id: number; nome: string } | null;
}

export async function listarChecklistPorAtividade(
  atividadeOSId: string,
): Promise<ChecklistItem[]> {
  return api.get<ChecklistItem[]>(`/checklist/atividade/${atividadeOSId}`);
}

export async function concluirChecklist(id: string): Promise<ChecklistItem> {
  return api.put<ChecklistItem>(`/checklist/${id}/concluir`);
}

export async function bloquearChecklist(
  id: string,
  motivo: string,
): Promise<ChecklistItem> {
  return api.put<ChecklistItem>(`/checklist/${id}/bloquear`, { motivo });
}

export async function listarChecklistPendentesEquipe(
  equipeId?: string,
): Promise<ChecklistItem[]> {
  const queryStr = equipeId ? `/${equipeId}` : '';
  return api.get<ChecklistItem[]>(`/checklist/equipe${queryStr}/pendentes`);
}

// ─── Separação ─────────────────────────────────────────────────────────────

export interface SeparacaoItem {
  id: number;
  codigo: string;
  status: string;
  statusNovo?: string;
  osId: number | null;
  equipeId: string | null;
  dataPrevista: string | null;
  dataNecessidade?: string | null;
  dataConfirmacao: string | null;
  confirmadoPorId: number | null;
  totalItens?: number;
  criadoEm: string;
  os?: { id: number; codigo: string; numero?: string };
  equipe?: EquipeItem;
  confirmadoPor?: { id: number; nome: string } | null;
  itens?: SeparacaoItemDetalhe[];
}

export interface SeparacaoItemDetalhe {
  id: number;
  materialId: number;
  descricaoItem?: string;
  quantidade?: number | string;
  quantidadeNecessaria: number | string;
  quantidadeSeparada: number | string;
  localEstoque?: string | null;
  status: string;
  retiradoEm?: string | null;
  devolvidoEm?: string | null;
  material?: MaterialItem;
}

export async function listarSeparacoes(params?: {
  osId?: number;
  equipeId?: string;
  status?: string;
  q?: string;
}): Promise<SeparacaoItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.osId) searchParams.set('osId', String(params.osId));
  if (params?.equipeId) searchParams.set('equipeId', params.equipeId);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.q) searchParams.set('q', params.q);
  const queryStr = searchParams.toString();
  return api.get<SeparacaoItem[]>(
    `/separacao${queryStr ? `?${queryStr}` : ''}`,
  );
}

export async function detalharSeparacao(id: number): Promise<SeparacaoItem> {
  return api.get<SeparacaoItem>(`/separacao/${id}`);
}

export async function confirmarSeparacao(id: number): Promise<SeparacaoItem> {
  return api.put<SeparacaoItem>(`/separacao/${id}/confirmar`);
}

export async function notificarEquipeSeparacao(
  id: number,
): Promise<SeparacaoItem> {
  return api.put<SeparacaoItem>(`/separacao/${id}/notificar-equipe`);
}

export async function registrarRetiradaSeparacao(
  id: number,
): Promise<SeparacaoItem> {
  return api.put<SeparacaoItem>(`/separacao/${id}/retirada`);
}

export async function registrarDevolucaoSeparacao(
  id: number,
): Promise<SeparacaoItem> {
  return api.put<SeparacaoItem>(`/separacao/${id}/devolucao`);
}
