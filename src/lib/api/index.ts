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
  alterarSenha,
} from './auth.js';
export type { CadastroInput } from './auth.js';

// Portal
export {
  listarAtendimentosPortal,
  obterAtendimentoPortal,
  listarAgendamentosPortal,
  listarOrcamentosPortal,
  obterOrcamentoPortal,
  listarObrasPortal,
  obterObraPortal,
  atualizarPerfil,
} from './portal.js';
export type {
  PerfilAtualizado,
  AtualizarPerfilInput,
  AtendimentoPortalDetalhe,
  ObraPortalItem,
  ObraPortalDetalhe,
  EnderecoPortal,
  ExecucaoPortal,
  EtapaPortal,
  AtividadePortal,
  StatusObraPortal,
  StatusExecucaoPortal,
} from './portal.js';

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

// Contato / Orcamento Publico
export {
  listarCidades,
  enviarContato,
} from './contato-publico.js';
export type {
  CidadeAtendida,
  ContatoInput,
  ContatoResult,
  OrcamentoInput,
  OrcamentoResult,
} from './contato-publico.js';

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
  StatusVisita,
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
  obterAtendimento,
  criarAtendimento,
  atualizarStatusAtendimento,
  atualizarAtendimento,
  encaminharParaOrcamento,
  listarLogsAtendimento,
  registrarLogAtendimento,
  adicionarItemAtendimento,
  removerItemAtendimento,
} from './atendimentos.js';
export type {
  AtendimentoItem,
  AtendimentoItemVocabulario,
  AtendimentoLogItem,
  CriarAtendimentoInput,
  CriarAtendimentoItemInput,
} from './atendimentos.js';

// Visitas
export {
  listarVisitas,
  detalharVisita,
  criarVisita,
  atualizarVisita,
  adicionarItemVisita,
  removerItemVisita,
} from './visitas.js';
export type {
  VisitaItem,
  VisitaItemVocabulario,
  CriarVisitaInput,
  AtualizarVisitaInput,
  CriarVisitaItemInput,
} from './visitas.js';

// Orcamentos Admin
export {
  listarOrcamentosAdmin,
  obterOrcamentoAdminDetalhe,
  criarOrcamentoAdmin,
  editarOrcamentoAdmin,
  excluirOrcamentoAdmin,
  enviarOrcamentoAdmin,
  aprovarOrcamentoAdmin,
  recusarOrcamentoAdmin,
  rascunhoParaRetomar,
} from './orcamentos-admin.js';
export type {
  FichaInput,
  OrcamentoAdminItem,
  OrcamentoAdminDetalhe,
  OrcamentoAtividadeRow,
  OrcamentoObraFichaDetalhe,
  CriarOrcamentoInput,
} from './orcamentos-admin.js';

// Vocabulario (etapas, termos, sub-servicos)
export {
  listarEtapas,
  listarEtapasTodas,
  criarEtapa,
  atualizarEtapa,
  removerEtapa,
  listarTermos,
  atualizarTermo,
  removerTermo,
  listarSubServicos,
  listarSubServicosTodas,
  criarTermo,
  criarSubServico,
  atualizarSubServico,
  removerSubServico,
} from './vocabulario.js';
export type {
  DimensaoVocabulario,
  Termo,
  Etapa,
  SubServico,
  OpcaoCascata,
} from './vocabulario.js';

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
  obterProximoCodigoEquipamento,
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
  obterProximoCodigoEpi,
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

// Listas de compras
export {
  obterListaCompras,
  salvarItensListaCompras,
  enviarListaCompras,
  aprovarListaCompras,
  recusarListaCompras,
  recusarItemListaCompras,
  reverterItemListaCompras,
  comprarItemListaCompras,
} from './listas-compras.js';
export type {
  ListaCompraDto,
  ListaCompraItemDto,
  OpcaoCatalogo,
} from './listas-compras.js';

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

// Execucao
export {
  listarExecucoes,
  detalharExecucao,
  planificarExecucao,
  mudarStatusExecucao,
} from './execucao.js';
export type {
  StatusExecucao,
  ExecucaoAtividadeItem,
} from './execucao.js';

// Separacao
export {
  listarSeparacoes,
  detalharSeparacao,
  confirmarSeparacao,
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

// Frota
export {
  listarVeiculos,
  buscarVeiculoLookups,
  buscarAnalisesFrota,
  obterVeiculo,
  obterProximoCodigoVeiculo,
  criarVeiculo,
  atualizarVeiculo,
  excluirVeiculo,
  listarRegistrosKm,
  registrarKm,
  atualizarRegistroKm,
  excluirRegistroKm,
  listarAbastecimentos,
  criarAbastecimento,
  atualizarAbastecimento,
  excluirAbastecimento,
  listarManutencoesVeiculos,
  buscarManutencoesVeiculosLookups,
  criarManutencaoVeiculo,
  atualizarManutencaoVeiculo,
  excluirManutencaoVeiculo,
} from './veiculos.js';
export type {
  VeiculoItem,
  VeiculoInput,
  RegistroKmItem,
  RegistroKmInput,
  AbastecimentoItem,
  AbastecimentoInput,
  ManutencaoVeiculoItem,
  ManutencaoVeiculoInput,
  AnalisesFrota,
  VeiculoLookups,
  ManutencoesVeiculosLookups,
} from './veiculos.js';
