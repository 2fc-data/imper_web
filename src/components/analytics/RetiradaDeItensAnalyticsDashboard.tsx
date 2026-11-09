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
import type { SeparacaoItem } from '../../lib/api';
import {
  AnalyticsFilterBar,
  type FiltrosAnalyticsState,
} from './AnalyticsFilterBar';
import { exportarCsv, exportarPdfRelatorio } from './exportReport';
import { KpiCard } from './KpiCard';
import { StorytellingPanel } from './StorytellingPanel';
import { ChartStorytellingNote } from './ChartStorytellingNote';

const STATUS_LABELS: Record<string, string> = {
  SEPARACAO_PENDENTE: 'Separação Pendente',
  SEPARACAO_CONCLUIDA: 'Separação Concluída',
  RETIRADA_PENDENTE: 'Retirada Pendente',
  RETIRADA_CONCLUIDA: 'Retirada Concluída',
  DEVOLUCAO_PENDENTE: 'Devolução Pendente',
  DEVOLUCAO_CONCLUIDA: 'Devolução Concluída',
};

const STATUS_COLORS: Record<string, string> = {
  SEPARACAO_PENDENTE: '#f59e0b', // amber
  SEPARACAO_CONCLUIDA: '#3b82f6', // blue
  RETIRADA_PENDENTE: '#f97316', // orange
  RETIRADA_CONCLUIDA: '#10b981', // emerald
  DEVOLUCAO_PENDENTE: '#ec4899', // pink
  DEVOLUCAO_CONCLUIDA: '#059669', // dark emerald
};

interface RetiradaDeItensAnalyticsDashboardProps {
  separacoes: SeparacaoItem[];
}

export function RetiradaDeItensAnalyticsDashboard({
  separacoes,
}: RetiradaDeItensAnalyticsDashboardProps) {
  const [filtros, setFiltros] = useState<FiltrosAnalyticsState>({
    periodo: '30d',
  });

  // Filtragem
  const separacoesFiltradas = useMemo(() => {
    const agora = new Date();
    return separacoes.filter((s) => {
      const dataItem = new Date(s.criadoEm || s.dataPrevista || Date.now());

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

      if (filtros.status && s.status !== filtros.status) return false;

      return true;
    });
  }, [separacoes, filtros]);

  // Contadores e KPIs
  const totalSeparacoes = separacoesFiltradas.length;
  const concluidas = separacoesFiltradas.filter(
    (s) => s.status === 'RETIRADA_CONCLUIDA' || s.status === 'DEVOLUCAO_CONCLUIDA',
  ).length;

  let totalItens = 0;
  let totalRetirados = 0;
  let totalDevolvidos = 0;
  let totalPendentes = 0;

  let qtdEquipamentos = 0;
  let qtdEpis = 0;
  let qtdMateriais = 0;

  separacoesFiltradas.forEach((s) => {
    const itens = s.itens ?? [];
    totalItens += s.totalItens ?? itens.length;
    itens.forEach((i) => {
      if (i.status === 'RETIRADO') totalRetirados += 1;
      else if (i.status === 'DEVOLVIDO') totalDevolvidos += 1;
      else totalPendentes += 1;

      if (i.equipamentoId) qtdEquipamentos += 1;
      else if (i.epiId) qtdEpis += 1;
      else if (i.materialId) qtdMateriais += 1;
    });
  });

  const taxaEfetivacao = totalSeparacoes > 0 ? Math.round((concluidas / totalSeparacoes) * 100) : 0;
  const taxaRetiradaItens = totalItens > 0 ? Math.round((totalRetirados / totalItens) * 100) : 0;

  // Gráfico 1: Distribuição por Categoria de Item (Equipamentos vs EPIs vs Materiais)
  const dadosPorCategoria = useMemo(() => {
    return [
      { name: 'Materiais', value: qtdMateriais },
      { name: 'Equipamentos', value: qtdEquipamentos },
      { name: 'EPIs', value: qtdEpis },
    ].filter((c) => c.value > 0);
  }, [qtdMateriais, qtdEquipamentos, qtdEpis]);

  const CORES_CATEGORIAS = ['#3b82f6', '#f59e0b', '#10b981'];

  // Gráfico 2: Status dos Pedidos de Separação (Barras)
  const dadosPorStatus = useMemo(() => {
    const contagem: Record<string, number> = {};
    separacoesFiltradas.forEach((s) => {
      contagem[s.status] = (contagem[s.status] || 0) + 1;
    });
    return Object.entries(contagem).map(([key, count]) => ({
      status: STATUS_LABELS[key] ?? key,
      rawStatus: key,
      total: count,
    }));
  }, [separacoesFiltradas]);

  // Gráfico 3: Estado dos Itens (Retirados, Pendentes, Devolvidos)
  const dadosEstadoItens = useMemo(() => {
    return [
      { name: 'Retirados em Campo', valor: totalRetirados },
      { name: 'Pendentes de Saída', valor: totalPendentes },
      { name: 'Devolvidos ao Estoque', valor: totalDevolvidos },
    ].filter((item) => item.valor > 0);
  }, [totalRetirados, totalPendentes, totalDevolvidos]);

  // Storytelling Dinâmico
  const storytelling = useMemo(() => {
    const catLider = [...dadosPorCategoria].sort((a, b) => b.value - a.value)[0];
    const percentCatLider = totalItens > 0 && catLider ? ((catLider.value / totalItens) * 100).toFixed(0) : '0';

    let statusGeral: 'otimo' | 'atencao' | 'critico' | 'estavel' = 'estavel';
    if (totalPendentes > 30) statusGeral = 'critico';
    else if (totalPendentes > 10) statusGeral = 'atencao';
    else if (totalSeparacoes > 0 && taxaEfetivacao >= 70) statusGeral = 'otimo';

    const cenario = [
      `Total de ${totalSeparacoes} ordens de separação emitidas, movimentando ${totalItens} itens no período.`,
      `Situação de itens: ${totalRetirados} retirados e em campo (${taxaRetiradaItens}%), ${totalDevolvidos} devolvidos ao estoque e ${totalPendentes} aguardando baixa.`,
      catLider ? `Categoria '${catLider.name}' representa ${percentCatLider}% do volume total de itens requisitados (${catLider.value} unidades).` : 'Demandas equilibradas entre categorias.',
    ];

    const diagnostico = [
      totalPendentes > 10
        ? `Risco de desabastecimento em obra: ${totalPendentes} itens em ordens pendentes de separação ou retirada física pelo encarregado.`
        : `Fluxo de expedição do almoxarifado operando com alta prontidão e baixo acúmulo de pedidos.`,
      qtdEquipamentos > 0 && totalDevolvidos < qtdEquipamentos * 0.3
        ? `Alerta de retenção de equipamentos: ferramentas e maquinários em posse prolongada nas obras aumentam custo de locação e risco de extravio.`
        : `Rotatividade e devolução de ferramentas controlada dentro dos prazos de obra.`,
    ];

    const recomendacoes = [
      totalPendentes > 0
        ? `Priorizar separação dos itens pendentes para liberar a saída matinal das equipes sem atraso no início das obras.`
        : `Manter a conferência diária de saídas e retornos no encerramento do expediente.`,
      `Auditar periodicamente os itens com status 'Retirado' há mais de 15 dias sem registro de devolução ou avaria.`,
    ];

    const resumoExecutivo = totalSeparacoes === 0
      ? 'Nenhuma ordem de separação registrada no período selecionado.'
      : `Almoxarifado processou ${totalSeparacoes} ordens (${totalItens} itens), com ${taxaEfetivacao}% de conclusão. '${catLider?.name || 'Itens'}' lidera as requisições (${percentCatLider}%), com ${totalRetirados} itens em campo e ${totalPendentes} pendentes de liberação.`;

    return { statusGeral, cenario, diagnostico, recomendacoes, resumoExecutivo };
  }, [dadosPorCategoria, totalSeparacoes, totalItens, totalRetirados, totalDevolvidos, totalPendentes, taxaEfetivacao, taxaRetiradaItens, qtdEquipamentos]);

  // Exportações
  const handleExportarCsv = () => {
    const colunas = ['ID', 'Código', 'Obra ID', 'Status', 'Total Itens', 'Criado em'];
    const linhas = separacoesFiltradas.map((s) => [
      s.id,
      s.codigo,
      s.obraId ? `#${s.obraId}` : '—',
      STATUS_LABELS[s.status] ?? s.status,
      s.totalItens ?? s.itens?.length ?? 0,
      s.criadoEm ? new Date(s.criadoEm).toLocaleDateString('pt-BR') : '—',
    ]);
    exportarCsv('relatorio_separacoes_retiradas', colunas, linhas);
  };

  const handleExportarPdf = () => {
    const colunas = ['ID', 'Código', 'Obra', 'Status', 'Total Itens', 'Data'];
    const linhas = separacoesFiltradas.map((s) => [
      s.id,
      s.codigo,
      s.obraId ? `#${s.obraId}` : '—',
      STATUS_LABELS[s.status] ?? s.status,
      s.totalItens ?? s.itens?.length ?? 0,
      s.criadoEm ? new Date(s.criadoEm).toLocaleDateString('pt-BR') : '—',
    ]);
    const kpis = [
      { rotulo: 'Ordens Separação', valor: totalSeparacoes },
      { rotulo: 'Total Itens', valor: totalItens },
      { rotulo: 'Taxa Conclusão', valor: `${taxaEfetivacao}%` },
      { rotulo: 'Itens Retirados', valor: totalRetirados },
    ];
    exportarPdfRelatorio(
      'Relatório de Retirada de Itens',
      'Painel Executivo de Almoxarifado, Separações e Retiradas para Obras',
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
          Painel Executivo de Retirada de Itens
        </h2>
        <p className="text-sm text-muted-foreground">
          Acompanhamento de separação de materiais, movimentação de equipamentos e entrega de EPIs em obras.
        </p>
      </div>

      {/* Barra de Filtros */}
      <AnalyticsFilterBar
        filtros={filtros}
        onChange={setFiltros}
        opcoesStatus={Object.entries(STATUS_LABELS).map(([valor, rotulo]) => ({
          valor,
          rotulo,
        }))}
        onExportarCsv={handleExportarCsv}
        onExportarPdf={handleExportarPdf}
      />

      {/* Grid de KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          titulo="Ordens de Separação"
          valor={totalSeparacoes}
          subtitulo="Lotes gerados para obras no período"
          destaque="default"
          icone={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />
        <KpiCard
          titulo="Total de Itens Movimentados"
          valor={totalItens}
          subtitulo={`${totalRetirados} retirados • ${totalDevolvidos} devolvidos`}
          destaque="primary"
          icone={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          }
        />
        <KpiCard
          titulo="Taxa de Conclusão / Baixa"
          valor={`${taxaEfetivacao}%`}
          subtitulo={`${concluidas} ordens finalizadas com sucesso`}
          destaque="success"
          variacao={{ valor: `${concluidas} ordens`, positiva: true }}
          icone={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <KpiCard
          titulo="Taxa Retirada de Itens"
          valor={`${taxaRetiradaItens}%`}
          subtitulo={`${totalPendentes} itens ainda no almoxarifado`}
          destaque="warning"
          variacao={{ valor: `${totalRetirados} em campo`, neutra: true }}
          icone={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
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
        {/* Gráfico 1: Itens por Categoria (Donut) */}
        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
          <div>
            <h3 className="font-semibold text-base text-foreground">Composição por Categoria de Item</h3>
            <p className="text-xs text-muted-foreground">Proporção entre Materiais, Equipamentos e EPIs</p>
          </div>
          <div className="h-72 w-full">
            {dadosPorCategoria.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Nenhum item registrado no período.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosPorCategoria}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {dadosPorCategoria.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CORES_CATEGORIAS[index % CORES_CATEGORIAS.length]} />
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
              dadosPorCategoria.length > 0
                ? `'${[...dadosPorCategoria].sort((a,b)=>b.value-a.value)[0]?.name}' lidera o mix de requisições de almoxarifado.`
                : 'Sem categorias requisitadas.'
            }
            impacto="Movimentação intensa de materiais consome estoque físico de giro rápido, exigindo reposição programada de insumos básicos."
            acaoRecomendada="Manter ponto de pedido automatizado para os itens de maior frequência na separação de obras."
            destaque="info"
          />
        </div>

        {/* Gráfico 2: Balanço de Situação dos Itens (Barras Verticais) */}
        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
          <div>
            <h3 className="font-semibold text-base text-foreground">Fluxo de Destino dos Itens</h3>
            <p className="text-xs text-muted-foreground">Contagem de itens em campo vs devolvidos vs pendentes</p>
          </div>
          <div className="h-72 w-full">
            {dadosEstadoItens.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Nenhum dado registrado.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosEstadoItens} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--color-card, #fff)', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="valor" name="Quantidade" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <ChartStorytellingNote
            oQueAconteceu={`${totalRetirados} itens em operação de campo, ${totalDevolvidos} já reintegrados ao estoque e ${totalPendentes} pendentes.`}
            impacto="Itens retidos em campo sem baixa definitiva geram distorção contábil no inventário e dificultam auditorias de perdas."
            acaoRecomendada="Exigir conferência digital no app mobile pelo encarregado na entrega e devolução dos materiais."
            destaque={totalPendentes > 10 ? 'alerta' : 'sucesso'}
          />
        </div>

        {/* Gráfico 3: Ordens por Status */}
        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4 lg:col-span-2">
          <div>
            <h3 className="font-semibold text-base text-foreground">Status Atual dos Pedidos de Separação</h3>
            <p className="text-xs text-muted-foreground">Volume de pedidos agrupados pelo estágio de movimentação</p>
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
                  <Bar dataKey="total" name="Ordens" radius={[6, 6, 0, 0]}>
                    {dadosPorStatus.map((entry, index) => (
                      <Cell
                        key={`bar-${index}`}
                        fill={STATUS_COLORS[entry.rawStatus] || '#3b82f6'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <ChartStorytellingNote
            oQueAconteceu={`Pipeline de almoxarifado distribuído entre as fases de separação, retirada e devolução pós-obra.`}
            impacto="Pedidos represados em 'Separação Pendente' atrasam a saída dos veículos no primeiro turno da manhã."
            acaoRecomendada="Efetuar a separação física no final do dia anterior para agilizar a liberação das equipes às 07h00."
            destaque="info"
          />
        </div>
      </div>
    </div>
  );
}
