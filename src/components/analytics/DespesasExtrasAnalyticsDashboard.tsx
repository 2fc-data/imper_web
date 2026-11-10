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
import type { MaterialItem } from '../../lib/api';
import {
  AnalyticsFilterBar,
  type FiltrosAnalyticsState,
} from './AnalyticsFilterBar';
import { exportarCsv, exportarPdfRelatorio } from './exportReport';
import { KpiCard } from './KpiCard';
import { StorytellingPanel } from './StorytellingPanel';
import { ChartStorytellingNote } from './ChartStorytellingNote';

const CORES_PALETA = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#06b6d4', '#eab308'];

interface DespesasExtrasAnalyticsDashboardProps {
  itens: MaterialItem[];
}

const saldoDe = (m: MaterialItem) => (m.saldo?.saldo != null ? Number(m.saldo.saldo) : 0);
const custoDe = (m: MaterialItem) => (m.custoUnitario != null ? Number(m.custoUnitario) : 0);
const valorTotalDe = (m: MaterialItem) => saldoDe(m) * custoDe(m);
const ehAbaixoDoMinimo = (m: MaterialItem) => m.quantidadeMinima != null && saldoDe(m) < m.quantidadeMinima && saldoDe(m) > 0;
const ehSemEstoque = (m: MaterialItem) => saldoDe(m) <= 0;

export function DespesasExtrasAnalyticsDashboard({
  itens,
}: DespesasExtrasAnalyticsDashboardProps) {
  const [filtros, setFiltros] = useState<FiltrosAnalyticsState>({
    periodo: 'tudo',
  });

  // Opções de categorias / tipos de despesa únicos
  const opcoesTipoDespesa = useMemo(() => {
    const mapa = new Map<string, string>();
    itens.forEach((i) => {
      if (i.tipoDespesa) {
        mapa.set(String(i.tipoDespesa.id), i.tipoDespesa.nome);
      } else if (i.categoria) {
        mapa.set(String(i.categoria.id), i.categoria.nome);
      }
    });
    return Array.from(mapa.entries()).map(([valor, rotulo]) => ({ valor, rotulo }));
  }, [itens]);

  // Filtragem
  const itensFiltrados = useMemo(() => {
    return itens.filter((i) => {
      // Categoria / Tipo de Despesa
      if (filtros.categoria) {
        const idDespesa = i.tipoDespesaId ? String(i.tipoDespesaId) : '';
        const idCat = i.categoriaId ? String(i.categoriaId) : '';
        if (idDespesa !== filtros.categoria && idCat !== filtros.categoria) {
          return false;
        }
      }

      // Status
      if (filtros.status) {
        if (filtros.status === 'SEM_ESTOQUE' && !ehSemEstoque(i)) return false;
        if (filtros.status === 'ABAIXO_MINIMO' && !ehAbaixoDoMinimo(i)) return false;
        if (filtros.status === 'NORMAL' && (ehSemEstoque(i) || ehAbaixoDoMinimo(i))) return false;
      }

      // Busca textual
      if (filtros.busca) {
        const texto = filtros.busca.toLowerCase();
        const nome = i.nome.toLowerCase();
        const tipoNome = i.tipoDespesa?.nome?.toLowerCase() || '';
        const catNome = i.categoria?.nome?.toLowerCase() || '';
        if (!nome.includes(texto) && !tipoNome.includes(texto) && !catNome.includes(texto)) {
          return false;
        }
      }

      return true;
    });
  }, [itens, filtros]);

  // KPIs
  const valorTotalEstoque = useMemo(
    () => itensFiltrados.reduce((acc, i) => acc + valorTotalDe(i), 0),
    [itensFiltrados],
  );

  const saldoTotalFisico = useMemo(
    () => itensFiltrados.reduce((acc, i) => acc + saldoDe(i), 0),
    [itensFiltrados],
  );

  const totalAbaixoMinimo = useMemo(
    () => itensFiltrados.filter(ehAbaixoDoMinimo).length,
    [itensFiltrados],
  );

  const totalSemEstoque = useMemo(
    () => itensFiltrados.filter(ehSemEstoque).length,
    [itensFiltrados],
  );

  // Gráfico 1: Top 8 Despesas Extras por Custo Acumulado (R$)
  const topPorValor = useMemo(() => {
    return [...itensFiltrados]
      .map((i) => ({
        nome: i.nome.length > 20 ? `${i.nome.slice(0, 18)}...` : i.nome,
        nomeCompleto: i.nome,
        valor: valorTotalDe(i),
        saldo: saldoDe(i),
      }))
      .filter((x) => x.valor > 0)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 8);
  }, [itensFiltrados]);

  // Gráfico 2: Distribuição por Tipo de Despesa / Categoria (Donut)
  const dadosPorTipo = useMemo(() => {
    const agrupado: Record<string, number> = {};
    itensFiltrados.forEach((i) => {
      const chave = i.tipoDespesa?.nome || i.categoria?.nome || 'Geral / Outros';
      agrupado[chave] = (agrupado[chave] || 0) + valorTotalDe(i);
    });
    return Object.entries(agrupado)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [itensFiltrados]);

  // Gráfico 3: Saldo vs Mínimo de Despesas Extras
  const dadosComparativoEstoque = useMemo(() => {
    return itensFiltrados
      .filter((i) => i.quantidadeMinima != null && i.quantidadeMinima > 0)
      .slice(0, 8)
      .map((i) => ({
        nome: i.nome.length > 15 ? `${i.nome.slice(0, 13)}...` : i.nome,
        saldo: saldoDe(i),
        minimo: i.quantidadeMinima || 0,
      }));
  }, [itensFiltrados]);

  // Storytelling Dinâmico
  const storytelling = useMemo(() => {
    const totalItens = itensFiltrados.length;
    const topItem = topPorValor[0];
    const topClass = dadosPorTipo[0];
    const percentTopClass = valorTotalEstoque > 0 && topClass ? ((topClass.value / valorTotalEstoque) * 100).toFixed(1) : '0';

    let statusGeral: 'otimo' | 'atencao' | 'critico' | 'estavel' = 'estavel';
    if (totalSemEstoque > 0) statusGeral = 'critico';
    else if (totalAbaixoMinimo > 0) statusGeral = 'atencao';
    else if (totalItens > 0) statusGeral = 'otimo';

    const cenario = [
      `Gasto total imobilizado em despesas extras de R$ ${valorTotalEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em ${saldoTotalFisico.toLocaleString('pt-BR')} unidades cadastradas.`,
      topClass ? `A classificação '${topClass.name}' absorve ${percentTopClass}% de todo o orçamento de itens avulsos.` : 'Despesas extras balanceadas entre grupos.',
      `${totalAbaixoMinimo} itens abaixo do estoque mínimo e ${totalSemEstoque} zerados aguardando reposição.`,
    ];

    const diagnostico = [
      totalSemEstoque > 0
        ? `Ruptura pontual de suprimentos pode forçar compras de balcão não programadas com preço superior.`
        : `Fluxo de suprimentos extras sob controle, sem interrupção de abastecimento.`,
      topItem
        ? `Impacto financeiro relevante concentrado no item '${topItem.nomeCompleto}' (R$ ${topItem.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).`
        : `Gastos distribuídos uniformemente entre pequenos itens de consumo.`,
      `Classificação de despesas extras frequentemente esconde custos operacionais que deveriam ser alocados diretamente às obras.`,
    ];

    const recomendacoes = [
      `Auditar itens da classificação '${topClass?.name ?? 'principal'}' para identificar oportunidades de compras corporativas unificadas.`,
      `Estipular teto de aprovação para compras de emergência em despesas extras.`,
      `Reclassificar suprimentos de alto consumo contínuo para a categoria de Materiais operacionais regulares.`,
    ];

    const resumoExecutivo = totalSemEstoque > 0
      ? `Ruptura em ${totalSemEstoque} itens de suprimentos extras. Necessário avaliar compras emergenciais com controle de custo.`
      : totalAbaixoMinimo > 0
      ? `Operação estável com ${totalAbaixoMinimo} itens operando no limite mínimo de reposição de suprimentos.`
      : `Controle satisfatório de despesas extras e suprimentos, mantendo saldo equilibrado com o mínimo de segurança.`;

    return { statusGeral, resumoExecutivo, cenario, diagnostico, recomendacoes };
  }, [itensFiltrados, valorTotalEstoque, saldoTotalFisico, totalAbaixoMinimo, totalSemEstoque, topPorValor, dadosPorTipo]);

  // Exportações
  const handleExportarCsv = () => {
    const colunas = [
      'ID',
      'Item',
      'Tipo Despesa / Categoria',
      'Unidade',
      'Saldo Atual',
      'Mínimo',
      'Custo Unitário (R$)',
      'Valor em Estoque (R$)',
      'Status',
    ];
    const linhas = itensFiltrados.map((i) => {
      const s = saldoDe(i);
      const c = custoDe(i);
      const statusLabel = ehSemEstoque(i)
        ? 'Sem Estoque'
        : ehAbaixoDoMinimo(i)
          ? 'Abaixo do Mínimo'
          : 'Normal';
      return [
        i.id,
        i.nome,
        i.tipoDespesa?.nome || i.categoria?.nome || '—',
        i.unidade?.nome ?? 'un',
        s,
        i.quantidadeMinima ?? '—',
        c.toFixed(2),
        (s * c).toFixed(2),
        statusLabel,
      ];
    });
    exportarCsv('relatorio_despesas_extras_estoque', colunas, linhas);
  };

  const handleExportarPdf = () => {
    const colunas = ['Item', 'Classificação', 'Saldo', 'Mínimo', 'Custo Unit.', 'Valor Total'];
    const linhas = itensFiltrados.map((i) => [
      i.nome,
      i.tipoDespesa?.nome || i.categoria?.nome || '—',
      `${saldoDe(i)} ${i.unidade?.nome ?? 'un'}`,
      i.quantidadeMinima ? `${i.quantidadeMinima} ${i.unidade?.nome ?? 'un'}` : '—',
      `R$ ${custoDe(i).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${valorTotalDe(i).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    ]);
    const kpis = [
      {
        rotulo: 'Valor em Estoque',
        valor: `R$ ${valorTotalEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      },
      { rotulo: 'Saldo Físico Total', valor: `${saldoTotalFisico.toLocaleString('pt-BR')} itens` },
      { rotulo: 'Abaixo do Mínimo', valor: `${totalAbaixoMinimo} itens` },
      { rotulo: 'Sem Estoque', valor: `${totalSemEstoque} itens` },
    ];
    exportarPdfRelatorio(
      'Relatório de Despesas Extras & Suprimentos',
      'Acompanhamento de Itens Diversos, Custos e Níveis de Reposição',
      colunas,
      linhas,
      kpis,
      {
        resumo: storytelling.resumoExecutivo,
        destaques: storytelling.cenario,
        diagnostico: storytelling.diagnostico,
        recomendacoes: storytelling.recomendacoes,
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Painel Executivo de Despesas Extras
        </h2>
        <p className="text-sm text-muted-foreground">
          Controle de itens avulsos, suprimentos operacionais e monitoramento de saldo em almoxarifado.
        </p>
      </div>

      {/* Barra de Filtros */}
      <AnalyticsFilterBar
        filtros={filtros}
        onChange={setFiltros}
        labelCategoria="Classificação"
        opcoesCategoria={opcoesTipoDespesa}
        opcoesStatus={[
          { valor: 'NORMAL', rotulo: 'Estoque Normal' },
          { valor: 'ABAIXO_MINIMO', rotulo: 'Abaixo do Mínimo' },
          { valor: 'SEM_ESTOQUE', rotulo: 'Sem Estoque (Zerado)' },
        ]}
        onExportarCsv={handleExportarCsv}
        onExportarPdf={handleExportarPdf}
      />

      {/* Grid de KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          titulo="Valor Total de Despesas Extras"
          valor={`R$ ${valorTotalEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitulo="Custo imobilizado em itens extras"
          destaque="warning"
        />
        <KpiCard
          titulo="Saldo Físico Total"
          valor={saldoTotalFisico.toLocaleString('pt-BR')}
          subtitulo="Volume físico disponível"
          destaque="default"
        />
        <KpiCard
          titulo="Itens Abaixo do Mínimo"
          valor={totalAbaixoMinimo}
          subtitulo="Reposição de suprimentos necessária"
          destaque={totalAbaixoMinimo > 0 ? 'warning' : 'default'}
        />
        <KpiCard
          titulo="Itens Sem Estoque"
          valor={totalSemEstoque}
          subtitulo="Itens com saldo zerado"
          destaque={totalSemEstoque > 0 ? 'destructive' : 'default'}
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

      {/* Gráficos Recharts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Despesas Extras por Valor */}
        <div className="rounded-xl border bg-card p-5 shadow-2xs">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-foreground">
              Top Itens por Valor Financeiro (R$)
            </h3>
            <p className="text-xs text-muted-foreground">
              Despesas extras com maior valor imobilizado
            </p>
          </div>
          <div className="h-72 w-full">
            {topPorValor.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Sem dados de despesas extras com valor
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topPorValor} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
                    stroke="var(--color-muted-foreground, #888)"
                    fontSize={11}
                  />
                  <YAxis
                    dataKey="nome"
                    type="category"
                    stroke="var(--color-muted-foreground, #888)"
                    fontSize={11}
                    width={110}
                  />
                  <Tooltip
                    formatter={(valor: any) => [
                      `R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                      'Valor Total',
                    ]}
                  />
                  <Bar dataKey="valor" radius={[0, 6, 6, 0]}>
                    {topPorValor.map((_, index) => (
                      <Cell key={`cell-de-${index}`} fill={CORES_PALETA[index % CORES_PALETA.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <ChartStorytellingNote
            oQueAconteceu={
              topPorValor[0]
                ? `O item '${topPorValor[0].nomeCompleto}' lidera o custo acumulado em despesas extras com R$ ${topPorValor[0].valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`
                : 'Custos de despesas extras distribuídos uniformemente.'
            }
            impacto="Despesas avulsas recorrentes de alto valor costumam drenar margens de contratos sem previsão em planilha orçamentária."
            acaoRecomendada="Avaliar a integração formal dos 3 maiores itens ao escopo padrão de suprimentos ou contratação com fornecedores homologados."
            destaque={topPorValor.length > 0 ? 'info' : 'neutro'}
          />
        </div>

        {/* Distribuição por Classificação */}
        <div className="rounded-xl border bg-card p-5 shadow-2xs">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-foreground">
              Distribuição por Tipo de Despesa
            </h3>
            <p className="text-xs text-muted-foreground">
              Volume financeiro distribuído por classificação
            </p>
          </div>
          <div className="h-72 w-full">
            {dadosPorTipo.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Sem dados classificados
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosPorTipo}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {dadosPorTipo.map((_, index) => (
                      <Cell key={`cell-tipo-${index}`} fill={CORES_PALETA[index % CORES_PALETA.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [
                      `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                      'Valor Total',
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <ChartStorytellingNote
            oQueAconteceu={
              dadosPorTipo[0]
                ? `A classificação '${dadosPorTipo[0].name}' representa a maior concentração de despesas avulsas.`
                : 'Categorização pulverizada.'
            }
            impacto="Concentração em categorias como supermercado, fretes ou miudezas indica carência de planejamento logístico nas obras."
            acaoRecomendada="Fixar diretrizes claras de alçadas e requisições para os grupos com maior volume registrado."
            destaque={dadosPorTipo.length > 0 ? 'info' : 'neutro'}
          />
        </div>

        {/* Comparativo Saldo vs Mínimo */}
        <div className="rounded-xl border bg-card p-5 shadow-2xs lg:col-span-2">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-foreground">
              Saldo Atual vs Estoque Mínimo
            </h3>
            <p className="text-xs text-muted-foreground">
              Nível atual em comparação com o estoque mínimo de segurança
            </p>
          </div>
          <div className="h-72 w-full">
            {dadosComparativoEstoque.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Nenhum item com estoque mínimo configurado
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosComparativoEstoque} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                  <XAxis dataKey="nome" stroke="var(--color-muted-foreground, #888)" fontSize={11} />
                  <YAxis stroke="var(--color-muted-foreground, #888)" fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="saldo" name="Saldo Atual" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="minimo" name="Estoque Mínimo" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <ChartStorytellingNote
            oQueAconteceu={
              totalAbaixoMinimo > 0
                ? `${totalAbaixoMinimo} itens operam abaixo do estoque de segurança estipulado.`
                : 'Nenhum suprimento crítico com saldo abaixo do patamar mínimo.'
            }
            impacto={
              totalAbaixoMinimo > 0
                ? 'Atrasos no atendimento de pedidos internos de itens essenciais como insumos de limpeza e consumo diário.'
                : 'Fluxo contínuo sem gargalos operacionais no suprimento das equipes.'
            }
            acaoRecomendada={
              totalAbaixoMinimo > 0
                ? 'Disparar reposição dos itens em alerta antes do início do próximo ciclo de atendimentos.'
                : 'Monitorar giro e evitar compras em excesso para itens de baixa saída.'
            }
            destaque={totalAbaixoMinimo > 0 ? 'alerta' : 'sucesso'}
          />
        </div>
      </div>
    </div>
  );
}
