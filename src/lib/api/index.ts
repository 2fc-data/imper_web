// Core
export {
  getToken,
  setToken,
  api,
} from './core.js';
export type { LoginResponse } from './core.js';

// Auth
export {
  login,
  fetchMe,
  logout,
  cadastrar,
  recuperarSenha,
  redefinirSenha,
} from './auth.js';
export type { CadastroInput } from './auth.js';

// Usuarios
export {
  listarUsuarios,
  listarPapeis,
  definirPerfilUsuario,
  atualizarUsuario,
  criarUsuario,
  listarCargos,
  criarCargo,
  atualizarCargo,
} from './usuarios.js';
export type {
  PapelRbac,
  Usuario,
  CriarUsuarioInput,
  Cargo,
} from './usuarios.js';

// Users
export {
  buscarUsuarios,
} from './users.js';
export type {
  MeuUser,
  MinhaConta,
} from './users.js';

// Servicos
export {
  listarServicos,
  listarServicosAdmin,
  criarServico,
  atualizarServico,
  excluirServico,
} from './servicos.js';
export type {
  ServicoMarketing,
  ServicoMarketingInput,
} from './servicos.js';

// Orcamento Publico
export {
  listarCidades,
  solicitarOrcamento,
} from './orcamento-publico.js';
export type {
  CidadeAtendida,
  OrcamentoInput,
  OrcamentoResult,
} from './orcamento-publico.js';

// Lookups (re-exports from schemas + lookup types/functions)
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
  TipoAgendamento,
  TipoItemServico,
  TipoMaterial,
  TipoMovimento,
  UnidadeMedida,
  Urgencia,
} from './lookups.js';
export {
  listarLookupsEquipamentos,
  listarLookupsEpis,
  categoriasApi,
  marcasApi,
  localizacoesApi,
  statusEquipamentoApi,
  estadosConservacaoApi,
  tiposManutencaoApi,
  unidadesMedidaApi,
  categoriasMaterialApi,
  subcategoriasMaterialApi,
  coresMaterialApi,
  marcasMaterialApi,
  categoriasEpiApi,
  subcategoriasEpiApi,
  marcasEpiApi,
  coresEpiApi,
  tamanhosEpiApi,
  localizacoesEpiApi,
  fornecedoresEpiApi,
  subcategoriasApi,
  fornecedoresApi,
} from './lookups.js';
export type {
  LookupItem,
  LookupInput,
  SubcategoriaItem,
  SubcategoriaInput,
  FornecedorItem,
  FornecedorInput,
  EquipamentoLookups,
  EpiLookups,
} from './lookups.js';

// Atendimentos
export {
  listarAtendimentos,
  criarAtendimento,
  atualizarStatusAtendimento,
  listarLogsAtendimento,
  registrarLogAtendimento,
} from './atendimentos.js';
export type {
  AtendimentoItem,
  AtendimentoLogItem,
  CriarAtendimentoInput,
} from './atendimentos.js';

// Orcamentos Admin
export {
  listarOrcamentosAdmin,
  criarOrcamentoAdmin,
  enviarOrcamentoAdmin,
} from './orcamentos-admin.js';
export type {
  ItemOrcamentoInput,
  OrcamentoAdminItem,
  CriarOrcamentoInput,
} from './orcamentos-admin.js';

// OS Admin
export {
  listarOSAdmin,
  aprovarOSAdmin,
  iniciarOSAdmin,
  concluirOSAdmin,
  cancelarOSAdmin,
} from './os-admin.js';
export type {
  OrdemServicoAdminItem,
} from './os-admin.js';

// Agendamentos
export {
  listarAgendamentos,
  criarAgendamento,
  detalharAgendamento,
  atualizarAgendamento,
  atualizarStatusAgendamento,
  getRotaAgendamento,
} from './agendamentos.js';
export type {
  EnderecoItem,
  AgendamentoItem,
  CriarAgendamentoInput,
  ListarAgendamentosParams,
  RotaAgendamento,
} from './agendamentos.js';

// Equipamentos
export {
  listarEquipamentos,
  criarEquipamento,
  atualizarEquipamento,
  excluirEquipamento,
} from './equipamentos.js';
export type {
  RetiradaEquipamentoItem,
  EquipamentoItem,
  EquipamentoInput,
} from './equipamentos.js';

// EPIs
export {
  listarEpis,
  criarEpi,
  atualizarEpi,
  excluirEpi,
} from './epis.js';
export type {
  EntregaEpiItem,
  EpiItem,
  EpiInput,
} from './epis.js';

// Manutencoes
export {
  listarManutencoes,
  criarManutencao,
  atualizarManutencao,
  excluirManutencao,
} from './manutencoes.js';
export type {
  ManutencaoItem,
  ManutencaoInput,
} from './manutencoes.js';

// Materiais
export {
  listarLookupsMateriais,
  listarMateriais,
  detalharMaterial,
  criarMaterial,
  atualizarMaterial,
  excluirMaterial,
} from './materiais.js';
export type {
  MaterialSaldo,
  MaterialMovimentoItem,
  MaterialItem,
  MaterialInput,
  MaterialLookups,
} from './materiais.js';

// RBAC
export {
  listarPapeisRbac,
  criarPapelRbac,
  atualizarPapelRbac,
  excluirPapelRbac,
  listarPermissoesRbac,
  definirPermissoesRbac,
} from './rbac.js';
export type {
  PermissaoRbac,
  PapelRbacAdmin,
} from './rbac.js';

// Catalogo de Atividades
export {
  listarCatalogoAtividades,
  criarCatalogoAtividade,
} from './catalogo-atividades.js';
export type {
  CatalogoAtividadeItem,
  SubStepItem,
  RecursoAtividadeItem,
} from './catalogo-atividades.js';

// Equipes
export {
  listarEquipes,
  criarEquipe,
} from './equipes.js';
export type {
  EquipeItem,
  MembroEquipeItem,
} from './equipes.js';

// Atividades OS
export {
  listarAtividadesOS,
  planificarAtividades,
} from './atividades-os.js';
export type {
  AtividadeOSItem,
} from './atividades-os.js';

// Checklist
export {
  listarChecklistPendentesEquipe,
} from './checklist.js';
export type {
  ChecklistItem,
} from './checklist.js';

// Separacao
export {
  listarSeparacoes,
  detalharSeparacao,
  confirmarSeparacao,
  notificarEquipeSeparacao,
  registrarRetiradaSeparacao,
  registrarDevolucaoSeparacao,
  registrarRetiradaItemSeparacao,
  registrarDevolucaoItemSeparacao,
  excluirSeparacao,
} from './separacao.js';
export type {
  SeparacaoItem,
  SeparacaoItemDetalhe,
} from './separacao.js';

// Disponibilidade
export {
  apiListarPadroes,
  apiCriarPadrao,
  apiAtualizarPadrao,
  apiExcluirPadrao,
  apiListarDatas,
  apiCriarData,
  apiAtualizarData,
  apiExcluirData,
  apiObterSlots,
} from './disponibilidade.js';
export type {
  DisponibilidadePadrao,
  DisponibilidadeData,
  DisponibilidadeSlot,
} from './disponibilidade.js';
