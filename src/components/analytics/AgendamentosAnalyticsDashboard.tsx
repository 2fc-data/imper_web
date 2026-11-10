import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AgendamentoItem, StatusAgendamento, TipoAgendamento } from '../../lib/api';
import { formatarDataHora } from '../../lib/format';
import {
  AnalyticsFilterBar,
  type FiltrosAnalyticsState,
} from './AnalyticsFilterBar';
import { exportarCsv, exportarPdfRelatorio } from './exportReport';
import { KpiCard } from './KpiCard';
import { StorytellingPanel } from './StorytellingPanel';
import { ChartStorytellingNote } from './ChartStorytellingNote';

const rotulosTipo: Record<TipoAgendamento, string> = {
  VISITA: 'Visita',
  ORCAMENTO: 'Orçamento',
  RETORNO: 'Retorno',
  REUNIAO: 'Reunião',
};

const rotulosStatus: Record<StatusAgendamento, string> = {
  PENDENTE: 'Pendente',
  CONFIRMADO: 'Confirmado',
  REALIZADO: 'Realizado',
  CANCELADO: 'Cancelado',
  NAO_COMPARECEU: 'Não compareceu',
};

const CORES_STATUS: Record<string, string> = {
  REALIZADO: '#10b981', // green
  CONFIRMADO: '#3b82f6', // blue
  PENDENTE: '#f59e0b', // amber
  CANCELADO: '#ef4444', // red
  NAO_COMPARECEU: '#6b7280', // gray
};

const CORES_PALETA = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

interface AgendamentosAnalyticsDashboardProps {
  agendamentos: AgendamentoItem[];
}

export function AgendamentosAnalyticsDashboard({
  agendamentos,
}: AgendamentosAnalyticsDashboardProps) {
  const [filtros, setFiltros] = useState<FiltrosAnalyticsState>({
    periodo: '30d',
  });

  // Filtragem de dados
  const agendamentosFiltrados = useMemo(() => {
    const agora = new Date();
    return agendamentos.filter((a) => {
      const dataItem = new Date(a.dataPrevista || a.createdAt);

      if (filtros.periodo === '7d') {
        const limite = new Date(agora);
        limite.setDate(limite.getDate() - 7);
        if (dataItem < limite) return false;
      } else if (filtros.periodo === '30d') {
        const limite = new Date(agora);
        limite.setDate(limite.getDate() - 30);
        if (dataItem < limite) return false;
      } else if (filtros.periodo === 'mes') {
        if (
          dataItem.getMonth() !== agora.getMonth() ||
          dataItem.getFullYear() !== agora.getFullYear()
        ) {
          return false;
        }
      } else if (filtros.periodo === 'ano') {
        if (dataItem.getFullYear() !== agora.getFullYear()) return false;
      } else if (filtros.periodo === 'custom') {
        if (filtros.dataInicio) {
          const inicio = new Date(`${filtros.dataInicio}T00:00:00`);
          if (dataItem < inicio) return false;
        }
        if (filtros.dataFim) {
          const fim = new Date(`${filtros.dataFim}T23:59:59`);
          if (dataItem > fim) return false;
        }
      }

      if (filtros.status && a.status !== filtros.status) return false;
      if (filtros.categoria && a.tipo !== filtros.categoria) return false;

      return true;
    });
  }, [agendamentos, filtros]);

  // KPIs
  const total = agendamentosFiltrados.length;
  const realizados = agendamentosFiltrados.filter((a) => a.status === 'REALIZADO').length;
  const cancelados = agendamentosFiltrados.filter(
    (a) => a.status === 'CANCELADO' || a.status === 'NAO_COMPARECEU',
  ).length;
  const pendentesConfirmados = agendamentosFiltrados.filter(
    (a) => a.status === 'PENDENTE' || a.status === 'CONFIRMADO',
  ).length;

  const taxaRealizacao = total > 0 ? Math.round((realizados / total) * 100) : 0;
  const taxaCancelamento = total > 0 ? Math.round((cancelados / total) * 100) : 0;

  // Gráfico 1: Evolução Temporal de Agendamentos (Agrupados por data)
  const dadosEvolucao = useMemo(() => {
    const agrupado: Record<string, { data: string; total: number; realizados: number }> = {};
    agendamentosFiltrados.forEach((a) => {
      const d = new Date(a.dataPrevista || a.createdAt);
      const chave = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!agrupado[chave]) {
        agrupado[chave] = { data: chave, total: 0, realizados: 0 };
      }
      agrupado[chave].total += 1;
      if (a.status === 'REALIZADO') agrupado[chave].realizados += 1;
    });
    return Object.values(agrupado);
  }, [agendamentosFiltrados]);

  // Gráfico 2: Distribuição por Tipo
  const dadosPorTipo = useMemo(() => {
    const contagem: Record<string, number> = {};
    agendamentosFiltrados.forEach((a) => {
      const nome = rotulosTipo[a.tipo] ?? a.tipo;
      contagem[nome] = (contagem[nome] || 0) + 1;
    });
    return Object.entries(contagem).map(([name, value]) => ({ name, value }));
  }, [agendamentosFiltrados]);

  // Gráfico 3: Distribuição por Status
  const dadosPorStatus = useMemo(() => {
    const contagem: Record<string, number> = {};
    agendamentosFiltrados.forEach((a) => {
      contagem[a.status] = (contagem[a.status] || 0) + 1;
    });
    return Object.entries(contagem).map(([statusKey, totalStatus]) => ({
      status: rotulosStatus[statusKey as StatusAgendamento] ?? statusKey,
      rawStatus: statusKey,
      total: totalStatus,
    }));
  }, [agendamentosFiltrados]);

  // Storytelling Dinâmico
  const storytelling = useMemo(() => {
    const tipoLider = [...dadosPorTipo].sort((a, b) => b.value - a.value)[0];
    const percentTipoLider = total > 0 && tipoLider ? ((tipoLider.value / total) * 100).toFixed(0) : '0';

    let statusGeral: 'otimo' | 'atencao' | 'critico' | 'estavel' = 'estavel';
    if (taxaCancelamento > 25) statusGeral = 'critico';
    else if (taxaCancelamento > 15 || pendentesConfirmados > 10) statusGeral = 'atencao';
    else if (total > 0 && taxaRealizacao >= 60) statusGeral = 'otimo';

    const cenario = [
      `Registrados ${total} agendamentos no período com taxa de comparecimento e realização de ${taxaRealizacao}% (${realizados} compromissos executados).`,
      tipoLider ? `Tipo '${tipoLider.name}' concentra ${percentTipoLider}% dos compromissos marcados (${tipoLider.value} agendamentos).` : 'Demandas distribuídas por tipo.',
      `Índice de cancelamentos e no-shows em ${taxaCancelamento}% (${cancelados} desistências ou ausências).`,
    ];

    const diagnostico = [
      taxaCancelamento > 15
        ? `Perda de produtividade: taxa de cancelamento de ${taxaCancelamento}% gera ociosidade no deslocamento dos consultores e técnicos.`
        : `Excelente adesão dos clientes aos horários acordados, mantendo a taxa de no-show sob controle.`,
      pendentesConfirmados > 0
        ? `Existem ${pendentesConfirmados} visitas pendentes ou confirmadas que exigem confirmação prévia para evitar desencontros.`
        : `Agenda sem pendências imediatas de execução.`,
    ];

    const recomendacoes = [
      taxaCancelamento > 10
        ? `Implantar régua de lembretes automáticos via WhatsApp 24h e 2h antes da visita com botão de confirmação.`
        : `Manter a pontualidade das equipes técnicas para preservar a boa taxa de conversão em orçamentos.`,
      `Para o tipo '${tipoLider?.name || 'líder'}', agrupar compromissos geograficamente por bairro ou região para reduzir tempo de trajeto.`,
    ];

    const resumoExecutivo = total === 0
      ? 'Nenhum agendamento registrado no período selecionado.'
      : `Agenda operou com ${total} compromissos e ${taxaRealizacao}% de realização efetiva. '${tipoLider?.name || 'Visita'}' lidera a demanda (${percentTipoLider}%), com ${pendentesConfirmados} visitas na fila de execução.`;

    return { statusGeral, cenario, diagnostico, recomendacoes, resumoExecutivo };
  }, [dadosPorTipo, total, realizados, cancelados, pendentesConfirmados, taxaRealizacao, taxaCancelamento]);

  // Exportações
  const handleExportarCsv = () => {
    const colunas = ['ID', 'Cliente', 'Tipo', 'Status', 'Data Prevista'];
    const linhas = agendamentosFiltrados.map((a) => [
      a.id,
      a.user?.nome ?? 'Sem nome',
      rotulosTipo[a.tipo] ?? a.tipo,
      rotulosStatus[a.status] ?? a.status,
      a.dataPrevista ? formatarDataHora(a.dataPrevista) : '—',
    ]);
    exportarCsv('relatorio_agendamentos', colunas, linhas);
  };

  const handleExportarPdf = () => {
    const colunas = ['ID', 'Cliente', 'Tipo', 'Status', 'Data'];
    const linhas = agendamentosFiltrados.map((a) => [
      a.id,
      a.user?.nome ?? 'Sem nome',
      rotulosTipo[a.tipo] ?? a.tipo,
      rotulosStatus[a.status] ?? a.status,
      a.dataPrevista ? formatarDataHora(a.dataPrevista) : '—',
    ]);
    const kpis = [
      { rotulo: 'Total', valor: total },
      { rotulo: 'Taxa Sucesso', valor: `${taxaRealizacao}%` },
      { rotulo: 'Taxa Cancelamento', valor: `${taxaCancelamento}%` },
      { rotulo: 'Pendentes/Conf.', valor: pendentesConfirmados },
    ];
    exportarPdfRelatorio(
      'Relatório de Agendamentos',
      'Painel Executivo de Agendamentos e Visitas Técnicas',
      colunas,
      linhas,
      kpis,
      {
        statusGeral: storytelling.statusGeral,
        resumoExecutivo: storytelling.resumoExecutivo,
        cenario: storytelling.cenario,
        diagnostico: storytelling.diagnostico,
        recomendacoes: storytelling.recomendacoes,
      },
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Painel Executivo de Agendamentos
        </h2>
        <p className="text-sm text-muted-foreground">
          Acompanhamento operacional, taxa de conversão em visitas e índice de comparecimento.
        </p>
      </div>

      {/* Barra de Filtros e Exportação */}
      <AnalyticsFilterBar
        filtros={filtros}
        onChange={setFiltros}
        labelCategoria="Tipo"
        opcoesCategoria={Object.entries(rotulosTipo).map(([valor, rotulo]) => ({
          valor,
          rotulo,
        }))}
        opcoesStatus={Object.entries(rotulosStatus).map(([valor, rotulo]) => ({
          valor,
          rotulo,
        }))}
        onExportarCsv={handleExportarCsv}
        onExportarPdf={handleExportarPdf}
      />

      {/* Grid de KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          titulo="Total de Agendamentos"
          valor={total}
          subtitulo="Agendamentos no período selecionado"
          destaque="default"
          icone={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <KpiCard
          titulo="Taxa de Comparecimento / Sucesso"
          valor={`${taxaRealizacao}%`}
          subtitulo={`${realizados} visitas/reuniões realizadas`}
          destaque="success"
          variacao={{ valor: `${realizados} concluídos`, positiva: true }}
          icone={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <KpiCard
          titulo="Em Aberto (Pend./Conf.)"
          valor={pendentesConfirmados}
          subtitulo="Visitas aguardando execução"
          destaque="info"
          icone={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <KpiCard
          titulo="Taxa de Cancelamento / No-Show"
          valor={`${taxaCancelamento}%`}
          subtitulo={`${cancelados} cancelados ou ausentes`}
          destaque="destructive"
          variacao={{ valor: `${cancelados} perdas`, positiva: false }}
          icone={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Painel Executivo de Storytelling */}
      <StorytellingPanel
        statusGeral={storytelling.statusGeral}
        resumoExecutivo={storytelling.resumoExecutivo}
        cenario={storytelling.cenario}
        diagnostico={storytelling.diagnostico}
        recomendacoes={storytelling.recomendacoes}
      />

      {/* Gráficos em Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gráfico 1: Volume Temporal */}
        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-base text-foreground">Volume de Agendamentos no Tempo</h3>
              <p className="text-xs text-muted-foreground">Distribuição diária de agendados vs realizados</p>
            </div>
          </div>
          <div className="h-72 w-full">
            {dadosEvolucao.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Nenhum agendamento no período selecionado.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dadosEvolucao} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="corTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="corRealizados" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--color-card, #fff)', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="total" name="Agendados" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#corTotal)" />
                  <Area type="monotone" dataKey="realizados" name="Realizados" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#corRealizados)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <ChartStorytellingNote
            oQueAconteceu={`Curva diária de compromissos registrando ${total} agendamentos com ${realizados} concluídos com sucesso.`}
            impacto="Dias com alta discrepância entre agendados e realizados apontam gargalo de capacidade técnica de atendimento presencial."
            acaoRecomendada="Dimensionar a escala dos consultores técnicos de acordo com os picos identificados nos dias de maior demanda."
            destaque="info"
          />
        </div>

        {/* Gráfico 2: Distribuição por Tipo (Pizza) */}
        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
          <div>
            <h3 className="font-semibold text-base text-foreground">Distribuição por Tipo de Compromisso</h3>
            <p className="text-xs text-muted-foreground">Proporção entre Visitas, Orçamentos e Reuniões</p>
          </div>
          <div className="h-72 w-full">
            {dadosPorTipo.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Nenhum dado registrado.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosPorTipo}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {dadosPorTipo.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CORES_PALETA[index % CORES_PALETA.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--color-card, #fff)', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <ChartStorytellingNote
            oQueAconteceu={
              dadosPorTipo.length > 0
                ? `'${[...dadosPorTipo].sort((a,b)=>b.value-a.value)[0]?.name}' representa a maior fatia das solicitações agendadas.`
                : 'Sem tipos registrados.'
            }
            impacto="Visitas técnicas in loco têm maior probabilidade de gerar orçamentos de ticket alto em impermeabilização."
            acaoRecomendada="Estimular que contatos preliminares evoluam para visita técnica diagnóstica presencial."
            destaque="sucesso"
          />
        </div>

        {/* Gráfico 3: Status dos Agendamentos (Barras) */}
        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4 lg:col-span-2">
          <div>
            <h3 className="font-semibold text-base text-foreground">Status Atual dos Agendamentos</h3>
            <p className="text-xs text-muted-foreground">Contagem absoluta de compromissos por estágio</p>
          </div>
          <div className="h-64 w-full">
            {dadosPorStatus.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Nenhum dado registrado.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosPorStatus} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--color-card, #fff)', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="total" name="Total" radius={[6, 6, 0, 0]}>
                    {dadosPorStatus.map((entry, index) => (
                      <Cell
                        key={`bar-${index}`}
                        fill={CORES_STATUS[entry.rawStatus] || '#3b82f6'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <ChartStorytellingNote
            oQueAconteceu={`Acompanhamento de funil: ${realizados} compromissos realizados com êxito vs ${cancelados} cancelados ou ausentes.`}
            impacto="Altos índices de 'Não Compareceu' geram custo improdutivo de combustível e tempo de deslocamento da equipe técnica."
            acaoRecomendada="Bloquear novos agendamentos sem confirmação ativa do cliente no turno anterior à visita."
            destaque={taxaCancelamento > 15 ? 'alerta' : 'neutro'}
          />
        </div>
      </div>
    </div>
  );
}

