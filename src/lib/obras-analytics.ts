import type {
  DashboardObrasResponse,
  DashboardObraAlerta,
} from './api/index.js';

export type PeriodoObrasAnalytics =
  | '7d'
  | '30d'
  | '90d'
  | 'mes'
  | 'ano'
  | 'tudo'
  | 'custom';

export interface IntervaloDashboard {
  de?: string;
  ate?: string;
  tudo?: boolean;
}

export interface ObrasStorytelling {
  statusGeral: 'otimo' | 'atencao' | 'critico' | 'estavel';
  resumoExecutivo: string;
  cenario: string[];
  diagnostico: string[];
  recomendacoes: string[];
}

export const STATUS_OBRA_OPCOES = [
  { valor: 'EM_PREPARACAO', rotulo: 'Em Preparação' },
  { valor: 'EM_EXECUCAO', rotulo: 'Em Execução' },
  { valor: 'CONCLUIDA', rotulo: 'Concluída' },
  { valor: 'CANCELADA', rotulo: 'Cancelada' },
] as const;

export const URGENCIA_OPCOES = [
  { valor: 'URGENTISSIMO', rotulo: 'Urgentíssimo' },
  { valor: 'URGENTE', rotulo: 'Urgente' },
  { valor: 'NORMAL', rotulo: 'Normal' },
] as const;

const ROTULOS_STATUS: Record<string, string> = {
  EM_PREPARACAO: 'Em preparação',
  EM_EXECUCAO: 'Em execução',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

const ROTULOS_URGENCIA: Record<string, string> = {
  URGENTISSIMO: 'Urgentíssimo',
  URGENTE: 'Urgente',
  NORMAL: 'Normal',
};

export function rotuloStatusObra(status: string): string {
  return ROTULOS_STATUS[status] ?? status;
}

export function rotuloUrgencia(urgencia: string): string {
  return ROTULOS_URGENCIA[urgencia] ?? urgencia;
}

function paraISO(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function somarDias(data: Date, dias: number): Date {
  const copia = new Date(data);
  copia.setDate(copia.getDate() + dias);
  return copia;
}

export function periodoParaIntervalo(
  periodo: PeriodoObrasAnalytics,
  dataInicio?: string,
  dataFim?: string,
  hoje: Date = new Date(),
): IntervaloDashboard {
  const fim = dataFim || paraISO(hoje);
  const hojeISO = paraISO(hoje);

  switch (periodo) {
    case '7d':
      return { de: paraISO(somarDias(hoje, -6)), ate: hojeISO };
    case '30d':
      return { de: paraISO(somarDias(hoje, -29)), ate: hojeISO };
    case '90d':
      return { de: paraISO(somarDias(hoje, -89)), ate: hojeISO };
    case 'mes':
      return {
        de: paraISO(new Date(hoje.getFullYear(), hoje.getMonth(), 1)),
        ate: hojeISO,
      };
    case 'ano':
      return { de: paraISO(new Date(hoje.getFullYear(), 0, 1)), ate: hojeISO };
    case 'tudo':
      return { tudo: true };
    case 'custom':
      return {
        de: dataInicio || undefined,
        ate: dataFim || undefined,
      };
    default:
      return { de: paraISO(somarDias(hoje, -89)), ate: fim };
  }
}

export function formatarMoeda(valor: number | null | undefined): string {
  return Number(valor ?? 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function formatarMoedaCompacta(valor: number | null | undefined): string {
  return Number(valor ?? 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  });
}

export function formatarNumero(valor: number | null | undefined): string {
  return Number(valor ?? 0).toLocaleString('pt-BR');
}

export function formatarPercentual(
  valor: number | null | undefined,
  casas = 1,
): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return '—';
  const sinal = valor > 0 ? '+' : '';
  return `${sinal}${valor.toFixed(casas).replace('.', ',')}%`;
}

export function formatarData(iso: string | null | undefined): string {
  if (!iso) return '—';
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '—';
  return data.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

export function formatarArea(area: number | null | undefined): string {
  return `${Number(area ?? 0).toLocaleString('pt-BR', {
    maximumFractionDigits: 1,
  })} m²`;
}

function principaisAlertas(alertas: DashboardObraAlerta[]): number {
  return alertas.filter((alerta) => alerta.severidade === 'alta').length;
}

export function gerarStorytelling(
  data: DashboardObrasResponse,
): ObrasStorytelling {
  const { kpis, variacoes, financeiro, obrasCriticas, alertas, periodo } = data;
  const atrasadas = kpis.execucoesAtrasadas;
  const aditivosPendentes = kpis.aditivosPendentesQtd;
  const altos = principaisAlertas(alertas);
  const variacaoValor = variacoes?.valorContratadoNovas ?? null;

  let statusGeral: ObrasStorytelling['statusGeral'] = 'estavel';
  if (atrasadas >= 5 || altos >= 3 || obrasCriticas.length >= 6) {
    statusGeral = 'critico';
  } else if (atrasadas > 0 || aditivosPendentes > 0 || altos > 0) {
    statusGeral = 'atencao';
  } else if (kpis.obrasAtivas > 0) {
    statusGeral = 'otimo';
  }

  const periodoTexto = periodo.tudo
    ? `todo o histórico (${periodo.dias} dias)`
    : `os últimos ${periodo.dias} dias`;

  const resumoExecutivo =
    kpis.obrasAtivas === 0
      ? 'Nenhuma obra ativa no período selecionado.'
      : `A operação reúne ${kpis.obrasAtivas} obras ativas, sendo ${kpis.obrasEmExecucao} em execução e ${kpis.obrasEmPreparacao} em preparação. Em ${periodoTexto}, ${kpis.obrasCriadas} novas obras foram criadas e ${kpis.obrasConcluidas} concluídas, movimentando ${formatarMoeda(kpis.valorContratadoNovas)} em novos contratos.`;

  const cenario = [
    `Valor contratado ativo de ${formatarMoeda(financeiro.contratadoAtivo)}, com ${formatarMoeda(financeiro.aditivosAprovadosAtivo)} em aditivos aprovados e previsão total de ${formatarMoeda(financeiro.totalPrevistoAtivo)}.`,
    `${formatarNumero(kpis.execucoesAtrasadas)} execuções atrasadas e ${formatarNumero(kpis.execucoesPendentes)} pendentes sobre ${formatarArea(kpis.areaTotalM2)} de área ativa (${formatarMoeda(kpis.valorMedioM2)}/m²).`,
    `No período, o ticket médio das novas obras ficou em ${formatarMoeda(kpis.ticketMedioNovas)} e os aditivos aprovados somaram ${formatarMoeda(kpis.aditivosAprovadosValor)}.`,
  ];

  const diagnostico: string[] = [];
  if (variacaoValor !== null) {
    diagnostico.push(
      variacaoValor >= 0
        ? `O valor contratado de novas obras cresceu ${formatarPercentual(variacaoValor)} frente ao período anterior.`
        : `O valor contratado de novas obras recuou ${formatarPercentual(variacaoValor)} frente ao período anterior.`,
    );
  }
  diagnostico.push(
    atrasadas > 0
      ? `${formatarNumero(atrasadas)} execuções estão fora do prazo, concentradas em ${obrasCriticas.length} obras que exigem tratativa imediata.`
      : 'Nenhuma execução atrasada registrada: o cronograma das obras ativas está sob controle.',
  );
  diagnostico.push(
    aditivosPendentes > 0
      ? `Há ${formatarNumero(aditivosPendentes)} aditivos pendentes de aprovação, totalizando ${formatarMoeda(kpis.aditivosPendentesValor)} sem reconhecimento contratual.`
      : 'Não há aditivos pendentes de aprovação no período.',
  );

  const recomendacoes: string[] = [];
  if (obrasCriticas.length > 0) {
    recomendacoes.push(
      `Priorizar as ${Math.min(obrasCriticas.length, 5)} obras mais críticas na reunião de produção, com plano de recuperação por execução atrasada.`,
    );
  }
  if (aditivosPendentes > 0) {
    recomendacoes.push(
      'Formalizar os aditivos pendentes antes do próximo medição para preservar o fluxo de caixa e a margem prevista.',
    );
  }
  if (variacaoValor !== null && variacaoValor < 0) {
    recomendacoes.push(
      'Reforçar a conversão de orçamentos abertos em contratos para retomar o ritmo de novas obras.',
    );
  }
  recomendacoes.push(
    'Manter a atualização diária das execuções para que o painel reflita o progresso real das obras.',
  );

  return {
    statusGeral,
    resumoExecutivo,
    cenario,
    diagnostico,
    recomendacoes,
  };
}
