import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { obterDashboardObras, type DashboardObrasResponse } from '../../lib/api';
import {
  formatarData,
  formatarMoeda,
  formatarMoedaCompacta,
  formatarNumero,
  formatarPercentual,
  gerarStorytelling,
  periodoParaIntervalo,
  rotuloStatusObra,
  rotuloUrgencia,
  STATUS_OBRA_OPCOES,
  URGENCIA_OPCOES,
} from '../../lib/obras-analytics';
import { cn } from '../../lib/utils';
import { EmptyState, ErrorState, LoadingState } from '../ui/states';
import {
  AnalyticsFilterBar,
  type FiltrosAnalyticsState,
} from './AnalyticsFilterBar';
import { ChartStorytellingNote } from './ChartStorytellingNote';
import { exportarCsv, exportarPdfRelatorio } from './exportReport';
import { KpiCard } from './KpiCard';
import { StorytellingPanel } from './StorytellingPanel';

interface ObrasAnalyticsDashboardProps {
  filtrosIniciais?: FiltrosAnalyticsState;
  className?: string;
}

const CORES = {
  criadas: '#4f46e5',
  concluidas: '#10b981',
  valor: '#f59e0b',
  aditivos: '#0ea5e9',
  pendentes: '#ef4444',
  status: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'],
  urgencia: ['#ef4444', '#f59e0b', '#0ea5e9'],
  barras: ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6'],
};

const icone = (d: string) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
);

function descreverPeriodo(dados: DashboardObrasResponse): string {
  if (dados.periodo.tudo) {
    return `Todo o histórico (${dados.periodo.dias} dias)`;
  }
  return `${formatarData(dados.periodo.de)} a ${formatarData(dados.periodo.ate)}`;
}

function variacaoKpi(valor: number | null | undefined) {
  if (valor === null || valor === undefined) return undefined;
  return {
    valor: formatarPercentual(valor),
    positiva: valor > 0,
    neutra: valor === 0,
  };
}

const badgeStatus: Record<string, string> = {
  EM_PREPARACAO: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  EM_EXECUCAO: 'bg-primary/10 text-primary',
  CONCLUIDA: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  CANCELADA: 'bg-muted text-muted-foreground',
};

const badgeUrgencia: Record<string, string> = {
  URGENTISSIMO: 'bg-destructive/10 text-destructive',
  URGENTE: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  NORMAL: 'bg-muted text-muted-foreground',
};

const corSeveridade: Record<string, string> = {
  alta: 'border-destructive/30 bg-destructive/5 text-destructive',
  media: 'border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300',
  baixa: 'border-border bg-muted/40 text-muted-foreground',
};

export function ObrasAnalyticsDashboard({
  filtrosIniciais,
  className,
}: ObrasAnalyticsDashboardProps) {
  const [filtros, setFiltros] = useState<FiltrosAnalyticsState>({
    periodo: '90d',
    comparar: true,
    ...filtrosIniciais,
  });
  const [dados, setDados] = useState<DashboardObrasResponse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let cancelado = false;
    const timer = setTimeout(async () => {
      setCarregando(true);
      try {
        const intervalo = periodoParaIntervalo(
          filtros.periodo,
          filtros.dataInicio,
          filtros.dataFim,
        );
        const resposta = await obterDashboardObras({
          ...intervalo,
          status: filtros.status,
          urgencia: filtros.categoria,
          comparar: filtros.periodo === 'tudo' ? false : (filtros.comparar ?? true),
        });
        if (cancelado) return;
        setDados(resposta);
        setErro(null);
      } catch (err) {
        if (cancelado) return;
        setErro(
          err instanceof Error
            ? err.message
            : 'Não foi possível carregar o dashboard de obras',
        );
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }, 300);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [filtros, tentativa]);

  const storytelling = useMemo(
    () => (dados ? gerarStorytelling(dados) : null),
    [dados],
  );

  const serie = useMemo(() => dados?.serie ?? [], [dados]);
  const statusData = useMemo(
    () =>
      (dados?.distribuicoes.porStatus ?? []).map((item) => ({
        nome: rotuloStatusObra(item.chave),
        valor: item.valor,
      })),
    [dados],
  );
  const urgenciaData = useMemo(
    () =>
      (dados?.distribuicoes.porUrgencia ?? []).map((item) => ({
        nome: rotuloUrgencia(item.chave),
        valor: item.valor,
      })),
    [dados],
  );
  const clientesData = useMemo(
    () =>
      (dados?.distribuicoes.porCliente ?? []).map((item) => ({
        nome: item.label,
        valor: item.valor,
      })),
    [dados],
  );
  const cidadesData = useMemo(
    () =>
      (dados?.distribuicoes.porCidade ?? []).map((item) => ({
        nome: item.label,
        valor: item.valor,
      })),
    [dados],
  );

  const financeiroData = useMemo(() => {
    if (!dados) return [];
    return [
      {
        nome: 'Contratado',
        contratado: dados.financeiro.contratadoAtivo,
        aditivos: dados.financeiro.aditivosAprovadosAtivo,
        pendentes: dados.financeiro.aditivosPendentesAtivo,
      },
    ];
  }, [dados]);

  const totalCriadas = useMemo(
    () => serie.reduce((total, item) => total + item.criadas, 0),
    [serie],
  );
  const totalConcluidas = useMemo(
    () => serie.reduce((total, item) => total + item.concluidas, 0),
    [serie],
  );

  const recarregar = useCallback(() => setTentativa((valor) => valor + 1), []);

  const exportarCsvSerie = useCallback(() => {
    if (!dados) return;
    exportarCsv(
      'obras_serie',
      ['Período', 'Criadas', 'Concluídas', 'Valor contratado', 'Aditivos aprovados'],
      dados.serie.map((item) => [
        item.label,
        item.criadas,
        item.concluidas,
        item.valorContratado.toFixed(2).replace('.', ','),
        item.aditivosAprovados.toFixed(2).replace('.', ','),
      ]),
    );
  }, [dados]);

  const exportarPdf = useCallback(() => {
    if (!dados || !storytelling) return;
    exportarPdfRelatorio(
      'Dashboard de Obras',
      descreverPeriodo(dados),
      ['Obra', 'Cliente', 'Status', 'Urgência', 'Progresso', 'Atraso (dias)', 'Valor'],
      dados.obrasCriticas.map((obra) => [
        obra.codigo,
        obra.clienteNome,
        rotuloStatusObra(obra.status),
        rotuloUrgencia(obra.urgencia),
        `${obra.progresso}%`,
        obra.diasAtrasoMaximo,
        formatarMoeda(obra.valorContratado),
      ]),
      [
        { rotulo: 'Obras ativas', valor: formatarNumero(dados.kpis.obrasAtivas) },
        { rotulo: 'Em execução', valor: formatarNumero(dados.kpis.obrasEmExecucao) },
        { rotulo: 'Criadas', valor: formatarNumero(dados.kpis.obrasCriadas) },
        { rotulo: 'Valor novas', valor: formatarMoeda(dados.kpis.valorContratadoNovas) },
        { rotulo: 'Atrasadas', valor: formatarNumero(dados.kpis.execucoesAtrasadas) },
      ],
      storytelling,
    );
  }, [dados, storytelling]);

  const semDados =
    dados !== null &&
    dados.kpis.obrasAtivas === 0 &&
    dados.kpis.obrasCriadas === 0 &&
    dados.serie.every((item) => item.criadas === 0 && item.concluidas === 0);

  return (
    <div className={cn('space-y-5', className)} aria-busy={carregando}>
      <AnalyticsFilterBar
        filtros={filtros}
        onChange={setFiltros}
        opcoesStatus={[...STATUS_OBRA_OPCOES]}
        opcoesCategoria={[...URGENCIA_OPCOES]}
        labelCategoria="Urgência"
        onExportarCsv={dados ? exportarCsvSerie : undefined}
        onExportarPdf={dados ? exportarPdf : undefined}
        isExporting={carregando}
        periodosExtras={[{ id: '90d', label: '90 dias' }]}
        periodoReset="90d"
        permitirComparar
      />

      {erro && !dados ? (
        <ErrorState title="Não foi possível carregar as análises" description={erro} onRetry={recarregar} />
      ) : !dados ? (
        <LoadingState rows={5} />
      ) : semDados ? (
        <EmptyState
          title="Nenhuma obra no período"
          description="Ajuste o período ou limpe os filtros para visualizar as análises."
        />
      ) : (
        <>
          {erro && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {erro}
            </p>
          )}

          {storytelling && <StorytellingPanel {...storytelling} />}

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard
              titulo="Obras ativas"
              valor={formatarNumero(dados.kpis.obrasAtivas)}
              subtitulo={`${formatarNumero(dados.kpis.obrasEmExecucao)} em execução · ${formatarNumero(dados.kpis.obrasEmPreparacao)} em preparação`}
              destaque="primary"
              icone={icone('M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4')}
            />
            <KpiCard
              titulo="Criadas no período"
              valor={formatarNumero(dados.kpis.obrasCriadas)}
              subtitulo={descreverPeriodo(dados)}
              variacao={variacaoKpi(dados.variacoes?.obrasCriadas)}
              icone={icone('M12 5v14M5 12h14')}
            />
            <KpiCard
              titulo="Concluídas"
              valor={formatarNumero(dados.kpis.obrasConcluidas)}
              subtitulo="Obras finalizadas no período"
              variacao={variacaoKpi(dados.variacoes?.obrasConcluidas)}
              destaque="success"
              icone={icone('M20 6L9 17l-5-5')}
            />
            <KpiCard
              titulo="Valor contratado"
              valor={formatarMoedaCompacta(dados.kpis.valorContratadoNovas)}
              subtitulo="Novas obras no período"
              variacao={variacaoKpi(dados.variacoes?.valorContratadoNovas)}
              destaque="info"
              icone={icone('M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6')}
            />
            <KpiCard
              titulo="Aditivos aprovados"
              valor={formatarMoedaCompacta(dados.kpis.aditivosAprovadosValor)}
              subtitulo={`${formatarMoeda(dados.financeiro.aditivosAprovadosAtivo)} acumulados`}
              variacao={variacaoKpi(dados.variacoes?.aditivosAprovadosValor)}
              destaque="success"
              icone={icone('M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2')}
            />
            <KpiCard
              titulo="Ticket médio"
              valor={formatarMoedaCompacta(dados.kpis.ticketMedioNovas)}
              subtitulo="Média das novas obras"
              variacao={variacaoKpi(dados.variacoes?.ticketMedioNovas)}
              icone={icone('M3 3v18h18M7 15l4-4 4 4 5-6')}
            />
            <KpiCard
              titulo="Execuções atrasadas"
              valor={formatarNumero(dados.kpis.execucoesAtrasadas)}
              subtitulo={`${formatarNumero(dados.kpis.execucoesPendentes)} pendentes`}
              destaque={dados.kpis.execucoesAtrasadas > 0 ? 'destructive' : 'default'}
              icone={icone('M12 8v5M12 16.5h.01M12 3a9 9 0 100 18 9 9 0 000-18z')}
            />
            <KpiCard
              titulo="Aditivos pendentes"
              valor={formatarNumero(dados.kpis.aditivosPendentesQtd)}
              subtitulo={formatarMoeda(dados.kpis.aditivosPendentesValor)}
              destaque={dados.kpis.aditivosPendentesQtd > 0 ? 'warning' : 'default'}
              icone={icone('M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z')}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <section className="rounded-2xl border bg-card p-4.5 shadow-xs">
              <h3 className="text-sm font-semibold">Evolução no período</h3>
              <p className="text-xs text-muted-foreground">
                Obras criadas e concluídas por {dados.granularidade}
              </p>
              <div className="mt-4 h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={serie} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="qtd" allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis
                      yAxisId="valor"
                      orientation="right"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(valor: number) => formatarMoedaCompacta(valor)}
                    />
                    <Tooltip formatter={(valor: unknown) => formatarMoeda(Number(valor))} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar yAxisId="qtd" dataKey="criadas" name="Criadas" fill={CORES.criadas} radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="qtd" dataKey="concluidas" name="Concluídas" fill={CORES.concluidas} radius={[4, 4, 0, 0]} />
                    <Line
                      yAxisId="valor"
                      type="monotone"
                      dataKey="valorContratado"
                      name="Valor contratado"
                      stroke={CORES.valor}
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <ChartStorytellingNote
                oQueAconteceu={`Foram criadas ${formatarNumero(totalCriadas)} obras e concluídas ${formatarNumero(totalConcluidas)} no período, com ${formatarMoeda(dados.kpis.valorContratadoNovas)} em novos contratos.`}
                impacto={
                  totalCriadas >= totalConcluidas
                    ? 'O volume de entrada supera ou acompanha as entregas, sustentando o nível de obras ativas.'
                    : 'As entregas superam a entrada de novas obras, o que reduz o volume ativo se o ritmo continuar.'
                }
                acaoRecomendada="Monitorar os períodos de queda de criação e reforçar a conversão comercial para manter o pipeline de obras."
                destaque={totalCriadas >= totalConcluidas ? 'sucesso' : 'alerta'}
              />
            </section>

            <section className="rounded-2xl border bg-card p-4.5 shadow-xs">
              <h3 className="text-sm font-semibold">Financeiro das obras ativas</h3>
              <p className="text-xs text-muted-foreground">
                Valores contratados, aditivos aprovados e pendentes
              </p>
              <div className="mt-4 h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financeiroData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                    <XAxis dataKey="nome" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(valor: number) => formatarMoedaCompacta(valor)} />
                    <Tooltip formatter={(valor: unknown) => formatarMoeda(Number(valor))} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="contratado" name="Contratado" stackId="a" fill={CORES.criadas} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="aditivos" name="Aditivos aprovados" stackId="a" fill={CORES.aditivos} />
                    <Bar dataKey="pendentes" name="Aditivos pendentes" stackId="a" fill={CORES.pendentes} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <ChartStorytellingNote
                oQueAconteceu={`O total previsto das obras ativas é de ${formatarMoeda(dados.financeiro.totalPrevistoAtivo)}, com ${formatarMoeda(dados.financeiro.aditivosPendentesAtivo)} ainda pendentes de aprovação.`}
                impacto="Aditivos pendentes não entram no total previsto até serem aprovados, o que pode reduzir a margem esperada."
                acaoRecomendada="Regularizar os aditivos pendentes para incorporá-los ao valor previsto e reduzir a incerteza financeira."
                destaque={dados.financeiro.aditivosPendentesAtivo > 0 ? 'alerta' : 'sucesso'}
              />
            </section>

            <section className="rounded-2xl border bg-card p-4.5 shadow-xs">
              <h3 className="text-sm font-semibold">Distribuição por status</h3>
              <p className="text-xs text-muted-foreground">
                Obras do período agrupadas por situação
              </p>
              <div className="mt-4 h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="nome" width={100} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(valor: unknown) => formatarNumero(Number(valor))} />
                    <Bar dataKey="valor" name="Obras" radius={[0, 4, 4, 0]}>
                      {statusData.map((item, index) => (
                        <Cell key={item.nome} fill={CORES.status[index % CORES.status.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <ChartStorytellingNote
                oQueAconteceu={`${formatarNumero(dados.kpis.obrasEmExecucao)} obras estão em execução e ${formatarNumero(dados.kpis.obrasEmPreparacao)} em preparação.`}
                impacto="O equilíbrio entre preparação e execução indica a velocidade com que novos contratos viram entrega efetiva."
                acaoRecomendada="Acelerar a liberação das obras em preparação para ampliar a capacidade produtiva."
                destaque={dados.kpis.obrasEmPreparacao > dados.kpis.obrasEmExecucao ? 'alerta' : 'info'}
              />
            </section>

            <section className="rounded-2xl border bg-card p-4.5 shadow-xs">
              <h3 className="text-sm font-semibold">Distribuição por urgência</h3>
              <p className="text-xs text-muted-foreground">
                Prioridade das obras ativas
              </p>
              <div className="mt-4 h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={urgenciaData}
                      dataKey="valor"
                      nameKey="nome"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                      label
                    >
                      {urgenciaData.map((item, index) => (
                        <Cell key={item.nome} fill={CORES.urgencia[index % CORES.urgencia.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(valor: unknown) => formatarNumero(Number(valor))} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ChartStorytellingNote
                oQueAconteceu="A distribuição por urgência mostra a pressão de prioridade sobre a operação ativa."
                impacto="Obras urgentes tendem a consumir equipe e deslocar o cronograma das demais."
                acaoRecomendada="Revisar a fila de prioridades e garantir que as obras urgentes tenham execução iniciada."
                destaque="info"
              />
            </section>

            <section className="rounded-2xl border bg-card p-4.5 shadow-xs">
              <h3 className="text-sm font-semibold">Top clientes</h3>
              <p className="text-xs text-muted-foreground">
                Obras ativas por cliente
              </p>
              <div className="mt-4 h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={clientesData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="nome" width={110} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(valor: unknown) => formatarNumero(Number(valor))} />
                    <Bar dataKey="valor" name="Obras" radius={[0, 4, 4, 0]}>
                      {clientesData.map((item, index) => (
                        <Cell key={item.nome} fill={CORES.barras[index % CORES.barras.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <ChartStorytellingNote
                oQueAconteceu="Os clientes exibidos concentram a maior parte das obras ativas, acima da cauda de clientes menores."
                impacto="A concentração aumenta a dependência de poucos contratantes e o risco de receita."
                acaoRecomendada="Equilibrar a carteira com novos clientes e acompanhar de perto os contratos mais representativos."
                destaque="info"
              />
            </section>

            <section className="rounded-2xl border bg-card p-4.5 shadow-xs">
              <h3 className="text-sm font-semibold">Obras por cidade</h3>
              <p className="text-xs text-muted-foreground">
                Distribuição geográfica das obras ativas
              </p>
              <div className="mt-4 h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cidadesData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="nome" width={110} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(valor: unknown) => formatarNumero(Number(valor))} />
                    <Bar dataKey="valor" name="Obras" radius={[0, 4, 4, 0]}>
                      {cidadesData.map((item, index) => (
                        <Cell key={item.nome} fill={CORES.barras[index % CORES.barras.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <ChartStorytellingNote
                oQueAconteceu="A distribuição por cidade concentra a operação nas praças com maior volume de obras ativas."
                impacto="Praças concentradas exigem logística local, mas reduzem o custo de deslocamento das equipes."
                acaoRecomendada="Planejar equipes e materiais por praça para sustentar os prazos das obras mais próximas."
                destaque="neutro"
              />
            </section>
          </div>

          <section className="rounded-2xl border bg-card p-4.5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold">Obras críticas</h3>
                <p className="text-xs text-muted-foreground">
                  Atrasos, urgência sem início e aditivos pendentes
                </p>
              </div>
              <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                {dados.obrasCriticas.length} obra(s)
              </span>
            </div>

            {dados.alertas.length > 0 && (
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {dados.alertas.slice(0, 4).map((alerta) => (
                  <li
                    key={`${alerta.tipo}-${alerta.obraId}`}
                    className={cn(
                      'flex items-start gap-2 rounded-lg border px-3 py-2 text-xs',
                      corSeveridade[alerta.severidade],
                    )}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      className="mt-0.5 h-3.5 w-3.5 shrink-0"
                      aria-hidden="true"
                    >
                      <path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
                    </svg>
                    <span>
                      <strong className="font-semibold">{alerta.codigo}:</strong>{' '}
                      {alerta.mensagem}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {dados.obrasCriticas.length === 0 ? (
              <EmptyState
                className="mt-4"
                title="Nenhuma obra crítica"
                description="Não há atrasos, urgências sem início nem aditivos pendentes no período."
              />
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="pb-2 pr-3 font-medium">Obra</th>
                      <th className="pb-2 pr-3 font-medium">Cliente</th>
                      <th className="pb-2 pr-3 font-medium">Status</th>
                      <th className="pb-2 pr-3 font-medium">Urgência</th>
                      <th className="pb-2 pr-3 font-medium">Progresso</th>
                      <th className="pb-2 pr-3 font-medium">Atraso</th>
                      <th className="pb-2 text-right font-medium">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dados.obrasCriticas.map((obra) => (
                      <tr key={obra.id} className="border-b border-border/50 last:border-0">
                        <td className="py-2.5 pr-3">
                          <Link to={`/obras/${obra.id}`} className="font-medium text-primary hover:underline">
                            {obra.codigo}
                          </Link>
                          <p className="text-xs text-muted-foreground">{obra.cidade}</p>
                        </td>
                        <td className="py-2.5 pr-3">{obra.clienteNome}</td>
                        <td className="py-2.5 pr-3">
                          <span className={cn('rounded-md px-1.5 py-0.5 text-xs font-medium', badgeStatus[obra.status])}>
                            {rotuloStatusObra(obra.status)}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3">
                          <span className={cn('rounded-md px-1.5 py-0.5 text-xs font-medium', badgeUrgencia[obra.urgencia])}>
                            {rotuloUrgencia(obra.urgencia)}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${Math.min(100, obra.progresso)}%` }}
                              />
                            </div>
                            <span className="text-xs tabular-nums text-muted-foreground">
                              {obra.progresso}%
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 pr-3">
                          {obra.diasAtrasoMaximo > 0 ? (
                            <span className="font-medium text-destructive">
                              {formatarNumero(obra.diasAtrasoMaximo)} d
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-2.5 text-right tabular-nums">
                          {formatarMoeda(obra.valorContratado)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
