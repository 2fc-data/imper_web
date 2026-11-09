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
import type { OrcamentoAdminItem } from '../../lib/api';
import {
  AnalyticsFilterBar,
  type FiltrosAnalyticsState,
} from './AnalyticsFilterBar';
import { exportarCsv, exportarPdfRelatorio } from './exportReport';
import { KpiCard } from './KpiCard';
import { StorytellingPanel } from './StorytellingPanel';
import { ChartStorytellingNote } from './ChartStorytellingNote';

const rotulosStatus: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  ENVIADO: 'Enviado',
  APROVADO: 'Aprovado',
  RECUSADO: 'Recusado',
  EXPIRADO: 'Expirado',
};

const CORES_STATUS: Record<string, string> = {
  APROVADO: '#10b981', // green
  ENVIADO: '#3b82f6', // blue
  RASCUNHO: '#f59e0b', // amber
  RECUSADO: '#ef4444', // red
  EXPIRADO: '#94a3b8', // slate
};

interface OrcamentosAnalyticsDashboardProps {
  orcamentos: OrcamentoAdminItem[];
}

export function OrcamentosAnalyticsDashboard({
  orcamentos,
}: OrcamentosAnalyticsDashboardProps) {
  const [filtros, setFiltros] = useState<FiltrosAnalyticsState>({
    periodo: '30d',
  });

  // Filtragem
  const orcamentosFiltrados = useMemo(() => {
    const agora = new Date();
    return orcamentos.filter((o) => {
      const dataItem = new Date(o.createdAt);

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

      if (filtros.status && o.status !== filtros.status) return false;

      return true;
    });
  }, [orcamentos, filtros]);

  // KPIs
  const total = orcamentosFiltrados.length;
  const aprovados = orcamentosFiltrados.filter((o) => o.status === 'APROVADO');
  const recusados = orcamentosFiltrados.filter((o) => o.status === 'RECUSADO');
  const emNegociacao = orcamentosFiltrados.filter(
    (o) => o.status === 'ENVIADO' || o.status === 'RASCUNHO',
  );

  const valorTotalPipeline = orcamentosFiltrados.reduce(
    (acc, o) => acc + Number(o.valorTotal || 0),
    0,
  );
  const valorAprovado = aprovados.reduce(
    (acc, o) => acc + Number(o.valorTotal || 0),
    0,
  );
  const ticketMedio =
    aprovados.length > 0 ? valorAprovado / aprovados.length : 0;

  // Taxa de conversão: aprovados / (aprovados + recusados) ou sobre o total
  const totalDecididos = aprovados.length + recusados.length;
  const taxaConversaoDecididos =
    totalDecididos > 0 ? Math.round((aprovados.length / totalDecididos) * 100) : 0;

  // Gráfico 1: Evolução Financeira Mensal/Semanal
  const dadosEvolucaoFinanceira = useMemo(() => {
    const agrupado: Record<string, { data: string; total: number; aprovado: number }> = {};
    orcamentosFiltrados.forEach((o) => {
      const d = new Date(o.createdAt);
      const chave = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!agrupado[chave]) {
        agrupado[chave] = { data: chave, total: 0, aprovado: 0 };
      }
      agrupado[chave].total += Number(o.valorTotal || 0);
      if (o.status === 'APROVADO') {
        agrupado[chave].aprovado += Number(o.valorTotal || 0);
      }
    });
    return Object.values(agrupado);
  }, [orcamentosFiltrados]);

  // Gráfico 2: Distribuição por Status (Pizza)
  const dadosPorStatus = useMemo(() => {
    const contagem: Record<string, number> = {};
    orcamentosFiltrados.forEach((o) => {
      const nome = rotulosStatus[o.status] ?? o.status;
      contagem[nome] = (contagem[nome] || 0) + 1;
    });
    return Object.entries(contagem).map(([name, value]) => ({ name, value }));
  }, [orcamentosFiltrados]);

  // Gráfico 3: Volume de Orçamentos vs Valor Médio
  const dadosVolumePorStatus = useMemo(() => {
    const contagem: Record<string, { totalValor: number; quantidade: number }> = {};
    orcamentosFiltrados.forEach((o) => {
      const st = o.status;
      if (!contagem[st]) contagem[st] = { totalValor: 0, quantidade: 0 };
      contagem[st].totalValor += Number(o.valorTotal || 0);
      contagem[st].quantidade += 1;
    });
    return Object.entries(contagem).map(([stKey, info]) => ({
      status: rotulosStatus[stKey] ?? stKey,
      rawStatus: stKey,
      valorTotal: info.totalValor,
      quantidade: info.quantidade,
    }));
  }, [orcamentosFiltrados]);

  // Storytelling Dinâmico
  const storytelling = useMemo(() => {
    const valorEmNegociacao = emNegociacao.reduce((acc, o) => acc + Number(o.valorTotal || 0), 0);
    const percentAprovado = valorTotalPipeline > 0 ? ((valorAprovado / valorTotalPipeline) * 100).toFixed(0) : '0';

    let statusGeral: 'otimo' | 'atencao' | 'critico' | 'estavel' = 'estavel';
    if (totalDecididos > 3 && taxaConversaoDecididos < 25) statusGeral = 'critico';
    else if (recusados.length > aprovados.length) statusGeral = 'atencao';
    else if (taxaConversaoDecididos >= 50 && aprovados.length > 0) statusGeral = 'otimo';

    const cenario = [
      `Pipeline total emitido de R$ ${valorTotalPipeline.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em ${total} propostas comerciais.`,
      `Faturamento aprovado de R$ ${valorAprovado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${aprovados.length} orçamentos fechados, ticket médio de R$ ${ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).`,
      `Taxa de conversão de propostas decididas em ${taxaConversaoDecididos}% (${recusados.length} recusadas vs ${aprovados.length} aprovadas).`,
    ];

    const diagnostico = [
      emNegociacao.length > 0
        ? `R$ ${valorEmNegociacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em ${emNegociacao.length} propostas em aberto/negociação requerem ação comercial ativa para não perder validade.`
        : `Sem propostas represadas em negociação.`,
      taxaConversaoDecididos < 40 && totalDecididos > 0
        ? `Índice de perda comercial acima do desejado: clientes podem estar optando por soluções parciais ou concorrentes com menor especificação técnica.`
        : `Conversão saudável das propostas apresentadas em contratos firmados.`,
    ];

    const recomendacoes = [
      emNegociacao.length > 0
        ? `Acionar equipe comercial para contato de fechamento com os clientes das maiores propostas em aberto nos próximos 3 dias úteis.`
        : `Manter a prospecção ativa para alimentar o topo do funil com novas oportunidades.`,
      `Em orçamentos de alto valor (> R$ 50k), oferecer condições de pagamento parcelado alinhadas ao cronograma físico da obra.`,
    ];

    const resumoExecutivo = total === 0
      ? 'Nenhum orçamento emitido no período selecionado.'
      : `Pipeline gerou R$ ${valorAprovado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em vendas aprovadas com ticket médio de R$ ${ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Conversão de propostas em ${taxaConversaoDecididos}% e R$ ${valorEmNegociacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em negociação aberta.`;

    return { statusGeral, cenario, diagnostico, recomendacoes, resumoExecutivo };
  }, [valorTotalPipeline, total, valorAprovado, aprovados.length, ticketMedio, taxaConversaoDecididos, recusados.length, emNegociacao, totalDecididos]);

  // Exportações
  const handleExportarCsv = () => {
    const colunas = ['ID', 'Cliente', 'Valor Total', 'Status', 'Validade', 'Criado em'];
    const linhas = orcamentosFiltrados.map((o) => [
      o.id,
      o.user?.nome ?? 'Sem nome',
      Number(o.valorTotal || 0).toFixed(2),
      rotulosStatus[o.status] ?? o.status,
      o.validade ? new Date(o.validade).toLocaleDateString('pt-BR') : '—',
      new Date(o.createdAt).toLocaleDateString('pt-BR'),
    ]);
    exportarCsv('relatorio_orcamentos', colunas, linhas);
  };

  const handleExportarPdf = () => {
    const colunas = ['ID', 'Cliente', 'Valor', 'Status', 'Data'];
    const linhas = orcamentosFiltrados.map((o) => [
      o.id,
      o.user?.nome ?? 'Sem nome',
      `R$ ${Number(o.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      rotulosStatus[o.status] ?? o.status,
      new Date(o.createdAt).toLocaleDateString('pt-BR'),
    ]);
    const kpis = [
      {
        rotulo: 'Pipeline Total',
        valor: `R$ ${valorTotalPipeline.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      },
      {
        rotulo: 'Faturamento Aprovado',
        valor: `R$ ${valorAprovado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      },
      { rotulo: 'Taxa Conversão', valor: `${taxaConversaoDecididos}%` },
      {
        rotulo: 'Ticket Médio',
        valor: `R$ ${ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      },
    ];
    exportarPdfRelatorio(
      'Relatório Executivo de Orçamentos',
      'Desempenho Comercial, Conversão de Vendas e Faturamento',
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
          Painel Executivo de Orçamentos
        </h2>
        <p className="text-sm text-muted-foreground">
          Performance comercial, conversão de orçamentos, ticket médio e pipeline financeiro.
        </p>
      </div>

      {/* Barra de Filtros */}
      <AnalyticsFilterBar
        filtros={filtros}
        onChange={setFiltros}
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
          titulo="Faturamento Aprovado"
          valor={`R$ ${valorAprovado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitulo={`${aprovados.length} orçamentos fechados com sucesso`}
          destaque="success"
          variacao={{ valor: `${aprovados.length} aprovados`, positiva: true }}
          icone={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <KpiCard
          titulo="Taxa de Conversão"
          valor={`${taxaConversaoDecididos}%`}
          subtitulo={`${aprovados.length} ganhos de ${totalDecididos} propostas finalizadas`}
          destaque="primary"
          icone={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />

        <KpiCard
          titulo="Ticket Médio Aprovado"
          valor={`R$ ${ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitulo="Média monetária por orçamento ganho"
          destaque="info"
          icone={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />

        <KpiCard
          titulo="Pipeline Total Emitido"
          valor={`R$ ${valorTotalPipeline.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitulo={`${total} propostas geradas no período`}
          destaque="warning"
          variacao={{ valor: `${emNegociacao.length} em aberto`, neutra: true }}
          icone={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
        {/* Gráfico 1: Evolução Financeira */}
        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
          <div>
            <h3 className="font-semibold text-base text-foreground">Evolução Financeira (R$)</h3>
            <p className="text-xs text-muted-foreground">Volume total emitido vs faturamento aprovado</p>
          </div>
          <div className="h-72 w-full">
            {dadosEvolucaoFinanceira.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Nenhum orçamento no período selecionado.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dadosEvolucaoFinanceira} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="corOrcTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="corOrcAprovado" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val) => [
                      `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                    ]}
                    contentStyle={{ backgroundColor: 'var(--color-card, #fff)', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="total" name="Total Emitido" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#corOrcTotal)" />
                  <Area type="monotone" dataKey="aprovado" name="Aprovado" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#corOrcAprovado)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <ChartStorytellingNote
            oQueAconteceu={`Curva financeira comparativa acumulando R$ ${valorTotalPipeline.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em propostas totais e R$ ${valorAprovado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} convertidos em receita garantida.`}
            impacto="O distanciamento entre a curva amarela (emitido) e a verde (aprovado) mede a ineficiência do funil de fechamento comercial."
            acaoRecomendada="Definir gatilhos de desconto e formas de pagamento flexíveis para reduzir o ciclo de decisão dos clientes."
            destaque="sucesso"
          />
        </div>

        {/* Gráfico 2: Proporção por Status (Pizza) */}
        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
          <div>
            <h3 className="font-semibold text-base text-foreground">Distribuição por Status</h3>
            <p className="text-xs text-muted-foreground">Proporção entre Aprovados, Recusados e Em Aberto</p>
          </div>
          <div className="h-72 w-full">
            {dadosPorStatus.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Nenhum dado registrado.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosPorStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {dadosPorStatus.map((entry) => {
                      const matchKey = Object.keys(rotulosStatus).find(
                        (k) => rotulosStatus[k] === entry.name,
                      );
                      const cor = matchKey ? CORES_STATUS[matchKey] : '#3b82f6';
                      return <Cell key={`cell-${entry.name}`} fill={cor} />;
                    })}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--color-card, #fff)', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <ChartStorytellingNote
            oQueAconteceu={`${aprovados.length} propostas aprovadas (${taxaConversaoDecididos}% das decididas) contra ${recusados.length} recusadas e ${emNegociacao.length} em aberto.`}
            impacto="Propostas paradas em 'Enviado' por mais de 15 dias têm 70% menos chance de conversão sem contato ativo."
            acaoRecomendada="Criar rotina de follow-up no 3º e 7º dia pós-envio para sanar dúvidas técnicas do cliente."
            destaque={taxaConversaoDecididos >= 50 ? 'sucesso' : 'alerta'}
          />
        </div>

        {/* Gráfico 3: Faturamento Total por Status (Barras) */}
        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4 lg:col-span-2">
          <div>
            <h3 className="font-semibold text-base text-foreground">Valor Financeiro Acumulado por Status</h3>
            <p className="text-xs text-muted-foreground">Soma em Reais (R$) por categoria de orçamento</p>
          </div>
          <div className="h-64 w-full">
            {dadosVolumePorStatus.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Nenhum dado registrado.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosVolumePorStatus} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val) => [
                      `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                      'Valor Total',
                    ]}
                    contentStyle={{ backgroundColor: 'var(--color-card, #fff)', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="valorTotal" name="Valor Total" radius={[6, 6, 0, 0]}>
                    {dadosVolumePorStatus.map((entry, index) => (
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
            oQueAconteceu={`Distribuição monetária absoluta apontando o capital represado em cada fase do funil de vendas.`}
            impacto="Concentração de valor em propostas recusadas exige revisão criteriosa da tabela de preços ou escopo técnico proposto."
            acaoRecomendada="Realizar pesquisa de perda com clientes que recusaram para mapear se o motivo principal foi preço, prazo ou confiança técnica."
            destaque="info"
          />
        </div>
      </div>
    </div>
  );
}
