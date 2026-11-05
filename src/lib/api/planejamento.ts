import { api } from './core.js';

export interface ColaboradorOption {
  id: number;
  nome: string;
  telefone: string | null;
  cargo: { id: number; nome: string } | null;
  papeis?: Array<{ papel: { id: number; nome: string } }>;
}

export interface VeiculoOption {
  id: number;
  nome: string;
  placa: string;
  modelo: string | null;
}

export interface EpiOption {
  id: number;
  nome: string;
  codigo: string;
  numeroCa: string | null;
}

export interface EquipamentoOption {
  id: number;
  descricao: string;
  codigo: string;
  modelo: string | null;
}

export interface MaterialOption {
  id: number;
  nome: string;
  unidade: { nome: string } | null;
}

export interface AtividadeInsumos {
  materiais: Array<{ materialId: number; quantidade: number }>;
  epis: Array<{ epiId: number; quantidade: number }>;
  equipamentos: Array<{ equipamentoId: number }>;
}

export interface PlanejamentoAtividadeItem {
  id: string;
  descricao: string;
  ordem: number;
  quantidade: number | null;
  areaM2: number | null;
  dataDisparoWhatsapp: string | null;
  statusWhatsapp: string | null;
  verbo?: { id: number; nome: string } | null;
  objeto?: { id: number; nome: string } | null;
  local?: { id: number; nome: string } | null;
  caracteristica?: { id: number; nome: string } | null;
  materiais: Array<{
    materialId: number;
    quantidade: number;
    material: { id: number; nome: string; unidade: { nome: string } | null };
  }>;
  execucoes?: Array<{
    id: string;
    atribuidoAId: number | null;
    atribuidoA?: ColaboradorOption | null;
    veiculoId: number | null;
    veiculo?: VeiculoOption | null;
    dataPrevisao: string | null;
    status: string;
    tokenAcesso?: string | null;
    separacoes?: Array<{
      id: number;
      itens: Array<{
        materialId?: number | null;
        material?: MaterialOption | null;
        epiId?: number | null;
        epi?: EpiOption | null;
        equipamentoId?: number | null;
        equipamento?: EquipamentoOption | null;
        quantidadeNecessaria: number;
      }>;
    }>;
  }>;
}

export interface PlanejamentoEtapaItem {
  id: number;
  nome: string;
  ordem: number;
  atividades: PlanejamentoAtividadeItem[];
}

export interface DadosPlanejamentoObra {
  obra: {
    id: number;
    codigo: string;
    status: string;
    dataInicioPrevista: string | null;
    dataDisparoWhatsapp: string | null;
    statusWhatsapp: string | null;
    cliente: string;
    enderecoCompleto: string;
    etapas: PlanejamentoEtapaItem[];
  };
  catalogos: {
    colaboradores: ColaboradorOption[];
    veiculos: VeiculoOption[];
    epis: EpiOption[];
    equipamentos: EquipamentoOption[];
    materiais: MaterialOption[];
  };
}

export interface SalvarPlanejamentoPayload {
  dataInicioPrevista?: string | null;
  dispararAgora?: boolean;
  atividades: Array<{
    atividadeId: string;
    colaboradorId?: number | null;
    colaboradoresIds?: number[];
    dataPrevisao?: string | null;
    dataDisparoWhatsapp?: string | null;
    veiculoId?: number | null;
    materiais: Array<{ materialId: number; quantidade: number }>;
    epis: Array<{ epiId: number; quantidade: number }>;
    equipamentos: Array<{ equipamentoId: number }>;
  }>;
}

export interface TarefaColaboradorItem {
  id: string;
  descricao: string;
  etapa: string;
  dataPrevisao: string | null;
  status: string;
  concluido: boolean;
  dataConclusao: string | null;
  fotoConclusaoUrl: string | null;
  observacaoConclusao: string | null;
  materiais: string[];
  epis: string[];
  equipamentos: string[];
}

export interface DadosPortalColaborador {
  colaborador: { id: number; nome: string; cargo?: { nome: string } | null };
  obra: { id: number; codigo: string; endereco: string };
  veiculo?: { id: number; nome: string; placa: string; modelo: string | null } | null;
  tarefas: TarefaColaboradorItem[];
}

export async function obterPlanejamentoObra(obraId: number): Promise<DadosPlanejamentoObra> {
  return api.get<DadosPlanejamentoObra>(`/obras/${obraId}/planejamento`);
}

export async function salvarPlanejamentoObra(
  obraId: number,
  payload: SalvarPlanejamentoPayload,
): Promise<DadosPlanejamentoObra> {
  return api.post<DadosPlanejamentoObra>(`/obras/${obraId}/planejamento`, payload);
}

export async function dispararWhatsappPlanejamento(obraId: number): Promise<{
  totalColaboradores: number;
  enviosSucesso: number;
}> {
  return api.post<{ totalColaboradores: number; enviosSucesso: number }>(
    `/obras/${obraId}/planejamento/disparar-whatsapp`,
    {},
  );
}

export async function obterTarefasColaborador(token: string): Promise<DadosPortalColaborador> {
  return api.get<DadosPortalColaborador>(`/colaborador/tarefas?token=${encodeURIComponent(token)}`);
}

export async function concluirTarefaColaborador(
  execucaoId: string,
  payload: {
    token: string;
    concluido: boolean;
    fotoWebpBase64?: string;
    observacao?: string;
  },
): Promise<any> {
  return api.post<any>(`/colaborador/tarefas/${execucaoId}/concluir`, payload);
}

