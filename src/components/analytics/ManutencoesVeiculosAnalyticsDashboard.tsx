import { useMemo, useState } from 'react';
import {
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
import type {
  ManutencaoVeiculoItem,
  ManutencoesVeiculosLookups,
} from '../../lib/api';
import {
  AnalyticsFilterBar,
  type FiltrosAnalyticsState,
} from './AnalyticsFilterBar';
import { exportarCsv, exportarPdfRelatorio } from './exportReport';
import { KpiCard } from './KpiCard';
import { StorytellingPanel } from './StorytellingPanel';
import { ChartStorytellingNote } from './ChartStorytellingNote';

const STATUS_LABEL: Record<string, string> = {
  PENDENTE: 'Pendente',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

const CORES_STATUS: Record<string, string> = {
  CONCLUIDA: '#10b981', // green
  EM_ANDAMENTO: '#0284c7', // sky
  PENDENTE: '#f59e0b', // amber
  CANCELADA: '#64748b', // slate
};

const CORES_PALETA = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

interface ManutencoesVeiculosAnalyticsDashboardProps {
  manutencoes: ManutencaoVeiculoItem[];
  lookups: ManutencoesVeiculosLookups | null;
}

export function ManutencoesVeiculosAnalyticsDashboard({
  manutencoes,
  lookups,
}: ManutencoesVeiculosAnalyticsDashboardProps) {
  const [filtros, setFiltros] = useState<FiltrosAnalyticsState>({
    periodo: '30d',
  });

  // Filtragem
  const manutencoesFiltradas = useMemo(() => {
    const agora = new Date();
    return manutencoes.filter((m) => {
      const dataItem = new Date(m.data);

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

      if (filtros.status && m.status !== filtros.status) return false;
      if (filtros.categoria && String(m.veiculoId) !== filtros.categoria) return false;

      return true;
    });
  }, [manutencoes, filtros]);

  // KPIs
  const total = manutencoesFiltradas.length;
  const concluidas = manutencoesFiltradas.filter((m) => m.status === 'CONCLUIDA').length;
  const emAndamentoPendente = manutencoesFiltradas.filter(
    (m) => m.status === 'EM_ANDAMENTO' || m.status === 'PENDENTE',
  ).length;

  const custoTotal = manutencoesFiltradas.reduce(
    (acc, m) =>
      acc + Number(m.custoPecas || 0) + Number(m.custoMaoDeObra || 0),
    0,
  );
  const custoPecasTotal = manutencoesFiltradas.reduce(
    (acc, m) => acc + Number(m.custoPecas || 0),
    0,
  );
  const custoMaoDeObraTotal = manutencoesFiltradas.reduce(
    (acc, m) => acc + Number(m.custoMaoDeObra || 0),
    0,
  );

  const ticketMedioManutencao = total > 0 ? custoTotal / total : 0;

  // Gráfico 1: Custos por Veículo (Barras)
  const dadosCustosPorVeiculo = useMemo(() => {
    const agrupado: Record<string, number> = {};
    manutencoesFiltradas.forEach((m) => {
      const nome = m.veiculo?.placa || `Veículo #${m.veiculoId}`;
      agrupado[nome] =
        (agrupado[nome] || 0) +
        Number(m.custoPecas || 0) +
        Number(m.custoMaoDeObra || 0);
    });
    return Object.entries(agrupado)
      .map(([placa, custo]) => ({ placa, custo }))
      .sort((a, b) => b.custo - a.custo);
  }, [manutencoesFiltradas]);

  // Gráfico 2: Divisão entre Peças vs Mão de Obra (Donut)
  const dadosPecasVsMaoDeObra = useMemo(() => {
    return [
      { name: 'Peças & Componentes', value: custoPecasTotal },
      { name: 'Mão de Obra / Serviço', value: custoMaoDeObraTotal },
    ].filter((item) => item.value > 0);
  }, [custoPecasTotal, custoMaoDeObraTotal]);

  // Gráfico 3: Distribuição por Tipo de Manutenção (Preventiva vs Corretiva)
  const dadosPorTipo = useMemo(() => {
    const agrupado: Record<string, number> = {};
    manutencoesFiltradas.forEach((m) => {
      const tipoNome = m.tipo?.nome || 'Geral';
      agrupado[tipoNome] = (agrupado[tipoNome] || 0) + 1;
    });
    return Object.entries(agrupado).map(([name, totalTipo]) => ({
      name,
      total: totalTipo,
    }));
  }, [manutencoesFiltradas]);

  // Storytelling Dinâmico
  const storytelling = useMemo(() => {
    const topVeiculo = dadosCustosPorVeiculo[0];
    const topTipo = [...dadosPorTipo].sort((a, b) => b.total - a.total)[0];
    const percentPecas = custoTotal > 0 ? ((custoPecasTotal / custoTotal) * 100).toFixed(0) : '0';
    const percentMaoDeObra = custoTotal > 0 ? ((custoMaoDeObraTotal / custoTotal) * 100).toFixed(0) : '0';

    let statusGeral: 'otimo' | 'atencao' | 'critico' | 'estavel' = 'estavel';
    if (emAndamentoPendente > 3) statusGeral = 'critico';
    else if (emAndamentoPendente > 0) statusGeral = 'atencao';
    else if (total > 0 && concluidas === total) statusGeral = 'otimo';

    const cenario = [
      `Registradas ${total} ordens de serviço totalizando R$ ${custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em manutenção de frota.`,
      `Divisão orçamentária: ${percentPecas}% alocados em reposição de peças e ${percentMaoDeObra}% em serviços mecânicos especializados.`,
      topVeiculo ? `Veículo '${topVeiculo.placa}' concentrou o maior volume de despesas com R$ ${topVeiculo.custo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.` : 'Custos distribuídos uniformemente entre os veículos da frota.',
    ];

    const diagnostico = [
      emAndamentoPendente > 0
        ? `${emAndamentoPendente} veículo(s) indisponível(is) ou retido(s) em oficina, reduzindo a capacidade de atendimento das equipes de campo.`
        : `100% das manutenções do período estão concluídas, garantindo prontidão operacional plena da frota.`,
      topTipo
        ? `Maior frequência de intervenções no tipo '${topTipo.name}' (${topTipo.total} ordens).`
        : `Sem predomínio de um tipo específico de intervenção.`,
    ];

    const recomendacoes = [
      emAndamentoPendente > 0
        ? `Cobrar previsão de entrega das oficinas para os veículos pendentes e providenciar remanejamento temporário de equipes.`
        : `Manter o calendário de revisões preventivas (óleo, suspensão e freios) em dia para mitigar quebras inesperadas.`,
      `Auditar notas fiscais de peças do veículo '${topVeiculo?.placa || 'líder em custos'}' para avaliar viabilidade econômica de renovação do ativo.`,
    ];

    const resumoExecutivo = total === 0
      ? 'Nenhuma ordem de manutenção registrada no período selecionado.'
      : `Frota consumiu R$ ${custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em ${total} ordens (média de R$ ${ticketMedioManutencao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/ordem), com ${emAndamentoPendente} veículo(s) atualmente em oficina.`;

    return { statusGeral, cenario, diagnostico, recomendacoes, resumoExecutivo };
  }, [dadosCustosPorVeiculo, dadosPorTipo, custoTotal, custoPecasTotal, custoMaoDeObraTotal, total, concluidas, emAndamentoPendente, ticketMedioManutencao]);

  // Exportações
  const handleExportarCsv = () => {
    const colunas = ['ID', 'Veículo', 'Tipo', 'Data', 'Status', 'Peças (R$)', 'Mão de Obra (R$)', 'Total (R$)'];
    const linhas = manutencoesFiltradas.map((m) => [
      m.id,
      m.veiculo?.placa ?? `#${m.veiculoId}`,
      m.tipo?.nome ?? '—',
      new Date(m.data).toLocaleDateString('pt-BR'),
      STATUS_LABEL[m.status] ?? m.status,
      Number(m.custoPecas || 0).toFixed(2),
      Number(m.custoMaoDeObra || 0).toFixed(2),
      (Number(m.custoPecas || 0) + Number(m.custoMaoDeObra || 0)).toFixed(2),
    ]);
    exportarCsv('relatorio_manutencoes_frota', colunas, linhas);
  };

  const handleExportarPdf = () => {
    const colunas = ['ID', 'Veículo', 'Tipo', 'Data', 'Status', 'Total'];
    const linhas = manutencoesFiltradas.map((m) => [
      m.id,
      m.veiculo?.placa ?? `#${m.veiculoId}`,
      m.tipo?.nome ?? '—',
      new Date(m.data).toLocaleDateString('pt-BR'),
      STATUS_LABEL[m.status] ?? m.status,
      `R$ ${(Number(m.custoPecas || 0) + Number(m.custoMaoDeObra || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    ]);
    const kpis = [
      {
        rotulo: 'Custo Total',
        valor: `R$ ${custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      },
      { rotulo: 'Ordens Manutenção', valor: total },
      { rotulo: 'Concluídas', valor: concluidas },
      {
        rotulo: 'Custo Médio',
        valor: `R$ ${ticketMedioManutencao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      },
    ];
    exportarPdfRelatorio(
      'Relatório de Manutenções da Frota',
      'Despesas Mecânicas, Manutenções Preventivas e Corretivas de Veículos',
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
          Painel Executivo de Manutenções da Frota
        </h2>
        <p className="text-sm text-muted-foreground">
          Monitoramento de manutenções preventivas, corretivas e custos de peças/serviços veiculares.
        </p>
      </div>

      {/* Barra de Filtros */}
      <AnalyticsFilterBar
        filtros={filtros}
        onChange={setFiltros}
        labelCategoria="Veículo"
        opcoesCategoria={lookups?.veiculos?.map((v) => ({
          valor: String(v.id),
          rotulo: `${v.placa} (${v.nome})`,
        }))}
        opcoesStatus={Object.entries(STATUS_LABEL).map(([valor, rotulo]) => ({
          valor,
          rotulo,
        }))}
        onExportarCsv={handleExportarCsv}
        onExportarPdf={handleExportarPdf}
      />

      {/* Grid de KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          titulo="Custo Total de Manutenções"
          valor={`R$ ${custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitulo={`${total} ordens no período`}
          destaque="destructive"
          icone={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
          }
        />
        <KpiCard
          titulo="Total de Ordens"
          valor={total}
          subtitulo={`${concluidas} concluídas • ${emAndamentoPendente} em oficina`}
          destaque="default"
          icone={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <KpiCard
          titulo="Custo Médio por Ordem"
          valor={`R$ ${ticketMedioManutencao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitulo="Média gasta por intervenção"
          destaque="info"
          icone={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <KpiCard
          titulo="Em Oficina / Pendentes"
          valor={emAndamentoPendente}
          subtitulo="Veículos aguardando liberação"
          destaque="warning"
          icone={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gráfico 1: Custo por Veículo */}
        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
          <div>
            <h3 className="font-semibold text-base text-foreground">Custo Acumulado por Veículo (R$)</h3>
            <p className="text-xs text-muted-foreground">Veículos com maior despesa de manutenção</p>
          </div>
          <div className="h-72 w-full">
            {dadosCustosPorVeiculo.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Nenhuma manutenção registrada.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosCustosPorVeiculo} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="placa" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val) => [
                      `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                      'Custo Total',
                    ]}
                    contentStyle={{ backgroundColor: 'var(--color-card, #fff)', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="custo" name="Custo Total" fill="#ef4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <ChartStorytellingNote
            oQueAconteceu={
              dadosCustosPorVeiculo[0]
                ? `Veículo '${dadosCustosPorVeiculo[0].placa}' lidera o ranking de custos somando R$ ${dadosCustosPorVeiculo[0].custo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`
                : 'Nenhum custo veicular registrado.'
            }
            impacto="Concentração excessiva de custos em uma única placa pode sinalizar sinistro grave ou fim de vida útil do ativo."
            acaoRecomendada="Avaliar se o gasto cumulativo do veículo já superou 20% do valor de tabela FIPE antes de aprovar novas ordens."
            destaque={dadosCustosPorVeiculo[0] ? 'alerta' : 'neutro'}
          />
        </div>

        {/* Gráfico 2: Peças vs Mão de Obra */}
        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
          <div>
            <h3 className="font-semibold text-base text-foreground">Peças vs Mão de Obra (R$)</h3>
            <p className="text-xs text-muted-foreground">Distribuição orçamentária dos reparos</p>
          </div>
          <div className="h-72 w-full">
            {dadosPecasVsMaoDeObra.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Nenhum dado registrado.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosPecasVsMaoDeObra}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    <Cell fill="#f59e0b" />
                    <Cell fill="#3b82f6" />
                  </Pie>
                  <Tooltip
                    formatter={(val) => [
                      `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                      'Gasto',
                    ]}
                    contentStyle={{ backgroundColor: 'var(--color-card, #fff)', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <ChartStorytellingNote
            oQueAconteceu={`R$ ${custoPecasTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em peças e componentes contra R$ ${custoMaoDeObraTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em mão de obra especializada.`}
            impacto="Despesas elevadas em mão de obra indicam serviços complexos ou tabela horária da oficina parceira descalibrada."
            acaoRecomendada="Negociar pacote corporativo de mão de obra tabelada ou realizar cotações com ao menos 2 oficinas credenciadas."
            destaque="info"
          />
        </div>

        {/* Gráfico 3: Tipo de Manutenção */}
        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4 lg:col-span-2">
          <div>
            <h3 className="font-semibold text-base text-foreground">Tipos de Serviços Realizados</h3>
            <p className="text-xs text-muted-foreground">Frequência por categoria de manutenção</p>
          </div>
          <div className="h-64 w-full">
            {dadosPorTipo.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Nenhum dado registrado.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosPorTipo} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--color-card, #fff)', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="total" name="Ordens" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <ChartStorytellingNote
            oQueAconteceu={
              dadosPorTipo.length > 0
                ? `Categorização de serviços distribuída em ${dadosPorTipo.length} tipos de intervenções mecânicas.`
                : 'Sem tipos registrados.'
            }
            impacto="Predomínio de manutenções corretivas em detrimento de preventivas eleva o custo total e o risco de acidentes."
            acaoRecomendada="Estabelecer meta de ao menos 70% das ordens com escopo preventivo/revisão periódica."
            destaque="sucesso"
          />
        </div>
      </div>
    </div>
  );
}

