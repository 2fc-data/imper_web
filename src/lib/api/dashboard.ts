import { api } from './core.js';

export interface DashboardObrasParams {
  de?: string;
  ate?: string;
  status?: string;
  urgencia?: string;
  clienteId?: number;
  obraId?: number;
  comparar?: boolean;
  tudo?: boolean;
}

export type DashboardObrasGranularidade = 'dia' | 'semana' | 'mes';

export interface DashboardObrasPeriodo {
  de: string;
  ate: string;
  tudo: boolean;
  dias: number;
}

export interface DashboardObrasKpis {
  obrasAtivas: number;
  obrasEmExecucao: number;
  obrasEmPreparacao: number;
  obrasCriadas: number;
  obrasConcluidas: number;
  valorContratadoNovas: number;
  aditivosAprovadosValor: number;
  aditivosPendentesValor: number;
  aditivosPendentesQtd: number;
  ticketMedioNovas: number;
  areaTotalM2: number;
  valorMedioM2: number;
  execucoesAtrasadas: number;
  execucoesPendentes: number;
}

export interface DashboardObrasKpisAnterior {
  obrasCriadas: number;
  obrasConcluidas: number;
  valorContratadoNovas: number;
  aditivosAprovadosValor: number;
  ticketMedioNovas: number;
}

export interface DashboardObrasVariacoes {
  obrasCriadas: number | null;
  obrasConcluidas: number | null;
  valorContratadoNovas: number | null;
  aditivosAprovadosValor: number | null;
  ticketMedioNovas: number | null;
}

export interface DashboardObrasSerieItem {
  chave: string;
  label: string;
  criadas: number;
  concluidas: number;
  valorContratado: number;
  aditivosAprovados: number;
}

export interface DashboardObrasDistribuicaoItem {
  chave: string;
  label: string;
  valor: number;
}

export interface DashboardObrasDistribuicoes {
  porStatus: DashboardObrasDistribuicaoItem[];
  porUrgencia: DashboardObrasDistribuicaoItem[];
  porCliente: DashboardObrasDistribuicaoItem[];
  porCidade: DashboardObrasDistribuicaoItem[];
}

export interface DashboardObrasFinanceiro {
  contratadoAtivo: number;
  aditivosAprovadosAtivo: number;
  aditivosPendentesAtivo: number;
  totalPrevistoAtivo: number;
  contratadoNovas: number;
  aditivosAprovadosPeriodo: number;
}

export interface DashboardObraCritica {
  id: number;
  codigo: string;
  clienteNome: string;
  cidade: string;
  status: string;
  urgencia: string;
  valorContratado: number;
  execucoesTotal: number;
  execucoesConcluidas: number;
  execucoesAtrasadas: number;
  progresso: number;
  dataInicioPrevista: string | null;
  proximaPrevisao: string | null;
  diasAtrasoMaximo: number;
}

export type DashboardObraAlertaTipo =
  | 'EXECUCAO_ATRASADA'
  | 'URGENTE_SEM_INICIO'
  | 'ADITIVO_PENDENTE';

export type DashboardObraAlertaSeveridade = 'alta' | 'media' | 'baixa';

export interface DashboardObraAlerta {
  tipo: DashboardObraAlertaTipo;
  severidade: DashboardObraAlertaSeveridade;
  obraId: number;
  codigo: string;
  mensagem: string;
}

export interface DashboardObrasResponse {
  periodo: DashboardObrasPeriodo;
  periodoAnterior: DashboardObrasPeriodo | null;
  granularidade: DashboardObrasGranularidade;
  kpis: DashboardObrasKpis;
  kpisAnterior: DashboardObrasKpisAnterior | null;
  variacoes: DashboardObrasVariacoes | null;
  serie: DashboardObrasSerieItem[];
  distribuicoes: DashboardObrasDistribuicoes;
  financeiro: DashboardObrasFinanceiro;
  obrasCriticas: DashboardObraCritica[];
  alertas: DashboardObraAlerta[];
}

export function obterDashboardObras(
  params: DashboardObrasParams = {},
): Promise<DashboardObrasResponse> {
  return api.get<DashboardObrasResponse>('/dashboard/obras', {
    de: params.de,
    ate: params.ate,
    status: params.status,
    urgencia: params.urgencia,
    clienteId: params.clienteId,
    obraId: params.obraId,
    comparar: params.comparar,
    tudo: params.tudo,
  });
}
