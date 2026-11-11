import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MaterialItem, MaterialLookups } from '../../lib/api';
import {
  AnalyticsFilterBar,
  type FiltrosAnalyticsState,
} from './AnalyticsFilterBar';
import { exportarCsv, exportarPdfRelatorio } from './exportReport';
import { KpiCard } from './KpiCard';
import { StorytellingPanel } from './StorytellingPanel';
import { ChartStorytellingNote } from './ChartStorytellingNote';

const CORES_PALETA = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#6366f1'];

interface MateriaisAnalyticsDashboardProps {
  materiais: MaterialItem[];
  lookups?: MaterialLookups | null;
}

const saldoDe = (m: MaterialItem) => (m.saldo?.saldo != null ? Number(m.saldo.saldo) : 0);
const custoDe = (m: MaterialItem) => (m.custoUnitario != null ? Number(m.custoUnitario) : 0);
const valorTotalDe = (m: MaterialItem) => saldoDe(m) * custoDe(m);
const ehAbaixoDoMinimo = (m: MaterialItem) => m.quantidadeMinima != null && saldoDe(m) < m.quantidadeMinima && saldoDe(m) > 0;
const ehSemEstoque = (m: MaterialItem) => saldoDe(m) <= 0;

export function MateriaisAnalyticsDashboard({
  materiais,
  lookups,
}: MateriaisAnalyticsDashboardProps) {
  const [filtros, setFiltros] = useState<FiltrosAnalyticsState>({
    periodo: 'tudo',
  });

  // Filtragem
  const materiaisFiltrados = useMemo(() => {
    return materiais.filter((m) => {
      // Categoria
      if (filtros.categoria && String(m.categoriaId) !== filtros.categoria) {
        return false;
      }

      // Status
      if (filtros.status) {
        if (filtros.status === 'SEM_ESTOQUE' && !ehSemEstoque(m)) return false;
        if (filtros.status === 'ABAIXO_MINIMO' && !ehAbaixoDoMinimo(m)) return false;
        if (filtros.status === 'NORMAL' && (ehSemEstoque(m) || ehAbaixoDoMinimo(m))) return false;
      }

      // Busca textual
      if (filtros.busca) {
        const texto = filtros.busca.toLowerCase();
        const nome = m.nome.toLowerCase();
        const cat = m.categoria?.nome?.toLowerCase() || '';
        if (!nome.includes(texto) && !cat.includes(texto)) {
          return false;
        }
      }

      return true;
    });
  }, [materiais, filtros]);

  // KPIs
  const valorTotalEstoque = useMemo(
    () => materiaisFiltrados.reduce((acc, m) => acc + valorTotalDe(m), 0),
    [materiaisFiltrados],
  );

  const saldoTotalFisico = useMemo(
    () => materiaisFiltrados.reduce((acc, m) => acc + saldoDe(m), 0),
    [materiaisFiltrados],
  );

  const totalAbaixoMinimo = useMemo(
    () => materiaisFiltrados.filter(ehAbaixoDoMinimo).length,
    [materiaisFiltrados],
  );

  const totalSemEstoque = useMemo(
    () => materiaisFiltrados.filter(ehSemEstoque).length,
    [materiaisFiltrados],
  );

  // Gráfico 1: Top 8 Materiais por Valor em Estoque (R$)
  const topPorValor = useMemo(() => {
    return [...materiaisFiltrados]
      .map((m) => ({
        nome: m.nome.length > 20 ? `${m.nome.slice(0, 18)}...` : m.nome,
        nomeCompleto: m.nome,
        valor: valorTotalDe(m),
        saldo: saldoDe(m),
      }))
      .filter((x) => x.valor > 0)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 8);
  }, [materiaisFiltrados]);

  // Gráfico 2: Distribuição por Categoria de Material (Donut)
  const dadosPorCategoria = useMemo(() => {
    const agrupado: Record<string, number> = {};
    materiaisFiltrados.forEach((m) => {
      const cat = m.categoria?.nome || 'Sem Categoria';
      agrupado[cat] = (agrupado[cat] || 0) + valorTotalDe(m);
    });
    return Object.entries(agrupado)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [materiaisFiltrados]);

  // Gráfico 3: Comparativo Saldo Atual vs Estoque Mínimo (Itens com Mínimo definido)
  const dadosComparativoEstoque = useMemo(() => {
    return materiaisFiltrados
      .filter((m) => m.quantidadeMinima != null && m.quantidadeMinima > 0)
      .slice(0, 8)
      .map((m) => ({
        nome: m.nome.length > 15 ? `${m.nome.slice(0, 13)}...` : m.nome,
        saldo: saldoDe(m),
        minimo: m.quantidadeMinima || 0,
      }));
  }, [materiaisFiltrados]);

  // Exportações
  // Storytelling Dinâmico
  const storytelling = useMemo(() => {
    const totalItens = materiaisFiltrados.length;
    const topItem = topPorValor[0];
    const topCat = dadosPorCategoria[0];
    const percentTopCat = valorTotalEstoque > 0 && topCat ? ((topCat.value / valorTotalEstoque) * 100).toFixed(1) : '0';
    const percentCritico = totalItens > 0 ? (((totalAbaixoMinimo + totalSemEstoque) / totalItens) * 100).toFixed(0) : '0';

    let statusGeral: 'otimo' | 'atencao' | 'critico' | 'estavel' = 'otimo';
    if (totalSemEstoque > 0) statusGeral = 'critico';
    else if (totalAbaixoMinimo > 0) statusGeral = 'atencao';
    else if (totalItens > 0) statusGeral = 'estavel';

    const cenario = [
      `Estoque total avaliado em R$ ${valorTotalEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} com ${saldoTotalFisico.toLocaleString('pt-BR')} unidades físicas armazenadas.`,
      topCat ? `Categoria '${topCat.name}' lidera com ${percentTopCat}% de todo o capital investido em materiais.` : 'Capital equilibrado entre as categorias de materiais.',
      `${totalAbaixoMinimo} materiais operam abaixo da margem mínima e ${totalSemEstoque} estão zerados (${percentCritico}% do catálogo filtrado).`,
    ];

    const diagnostico = [
      totalSemEstoque > 0
        ? `Risco de paralisação técnica: ${totalSemEstoque} itens em ruptura total exigem atendimento imediato para não impactar cronogramas de obra.`
        : `Nenhum material essencial com estoque esgotado no momento.`,
      topItem
        ? `Alta concentração financeira: o item '${topItem.nomeCompleto}' representa individualmente R$ ${topItem.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`
        : `Custos bem pulverizados sem dependência excessiva de um único item.`,
      totalAbaixoMinimo > 0
        ? `Ponto de ressuprimento atingido em ${totalAbaixoMinimo} itens, sinalizando necessidade de cotação antecipada.`
        : `Níveis físicos dentro da margem de segurança planejada.`,
    ];

    const recomendacoes = [
      totalSemEstoque > 0
        ? `Emitir pedido urgente de compra para os ${totalSemEstoque} itens em ruptura ou verificar remanejamento entre frentes.`
        : `Manter a rotina de conferência cíclica de inventário nos itens de maior giro.`,
      `Negociar compras programadas para a categoria líder visando ganhos de escala e redução do custo médio unitário.`,
      `Atualizar as quantidades mínimas de segurança dos itens que entram em alerta com frequência.`,
    ];

    const resumoExecutivo = totalSemEstoque > 0
      ? `Atenção prioritária à ruptura de ${totalSemEstoque} itens essenciais, apesar do patrimônio de R$ ${valorTotalEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em estoque.`
      : totalAbaixoMinimo > 0
      ? `Operação estável com necessidade de reposição preventiva em ${totalAbaixoMinimo} itens que atingiram o ponto de pedido.`
      : `Gestão de estoque equilibrada, sem rupturas e com níveis de segurança satisfatórios em todas as categorias.`;

    return { statusGeral, resumoExecutivo, cenario, diagnostico, recomendacoes };
  }, [materiaisFiltrados, valorTotalEstoque, saldoTotalFisico, totalAbaixoMinimo, totalSemEstoque, topPorValor, dadosPorCategoria]);

  const handleExportarCsv = () => {
    const colunas = [
      'ID',
      'Material',
      'Categoria',
      'Unidade',
      'Saldo Atual',
      'Qtd Mínima',
      'Custo Unitário (R$)',
      'Valor em Estoque (R$)',
      'Status',
    ];
    const linhas = materiaisFiltrados.map((m) => {
      const s = saldoDe(m);
      const c = custoDe(m);
      const statusLabel = ehSemEstoque(m)
        ? 'Sem Estoque'
        : ehAbaixoDoMinimo(m)
          ? 'Abaixo do Mínimo'
          : 'Normal';
      return [
        m.id,
        m.nome,
        m.categoria?.nome ?? 'Sem categoria',
        m.unidade?.nome ?? 'un',
        s,
        m.quantidadeMinima ?? '—',
        c.toFixed(2),
        (s * c).toFixed(2),
        statusLabel,
      ];
    });
    exportarCsv('relatorio_materiais_estoque', colunas, linhas);
  };

  const handleExportarPdf = () => {
    const colunas = ['Material', 'Categoria', 'Saldo', 'Mínimo', 'Custo Unit.', 'Valor Total'];
    const linhas = materiaisFiltrados.map((m) => [
      m.nome,
      m.categoria?.nome ?? '—',
      `${saldoDe(m)} ${m.unidade?.nome ?? 'un'}`,
      m.quantidadeMinima ? `${m.quantidadeMinima} ${m.unidade?.nome ?? 'un'}` : '—',
      `R$ ${custoDe(m).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${valorTotalDe(m).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
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
      'Relatório de Inventário & Saldo de Materiais',
      'Gestão de Insumos, Valor Imobilizado e Alertas de Ponto de Reposição',
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
          Painel Executivo de Materiais & Estoque
        </h2>
        <p className="text-sm text-muted-foreground">
          Visão patrimonial, saldo físico, ponto de pedido e controle de insumos operacionais.
        </p>
      </div>

      {/* Barra de Filtros */}
      <AnalyticsFilterBar
        filtros={filtros}
        onChange={setFiltros}
        labelCategoria="Categoria"
        opcoesCategoria={lookups?.categorias?.map((c) => ({
          valor: String(c.id),
          rotulo: c.nome,
        }))}
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
          titulo="Valor Total em Estoque"
          valor={`R$ ${valorTotalEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitulo="Patrimônio imobilizado em insumos"
          destaque="primary"
          icone={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <KpiCard
          titulo="Saldo Físico Total"
          valor={saldoTotalFisico.toLocaleString('pt-BR')}
          subtitulo="Unidades físicas em almoxarifado"
          destaque="default"
          icone={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />
        <KpiCard
          titulo="Itens Abaixo do Mínimo"
          valor={totalAbaixoMinimo}
          subtitulo="Necessitam de reposição imediata"
          destaque={totalAbaixoMinimo > 0 ? 'warning' : 'default'}
          icone={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
        <KpiCard
          titulo="Itens Sem Estoque"
          valor={totalSemEstoque}
          subtitulo="Estoque totalmente esgotado"
          destaque={totalSemEstoque > 0 ? 'destructive' : 'default'}
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

      {/* Gráficos Recharts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Materiais por Valor */}
        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Top Materiais por Valor em Estoque (R$)
            </h3>
            <p className="text-xs text-muted-foreground">
              Materiais com maior capital financeiro imobilizado
            </p>
          </div>
          <div className="h-72 w-full">
            {topPorValor.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Sem dados de estoque com valor cadastrado
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
                    contentStyle={{ backgroundColor: 'var(--color-card, #fff)', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="valor" radius={[0, 6, 6, 0]}>
                    {topPorValor.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CORES_PALETA[index % CORES_PALETA.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <ChartStorytellingNote
            oQueAconteceu={
              topPorValor[0]
                ? `O item '${topPorValor[0].nomeCompleto}' lidera o capital imobilizado com R$ ${topPorValor[0].valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`
                : 'Capital diluído sem concentração expressiva em um único item.'
            }
            impacto="A alta concentração de valor em poucos itens exige acurácia rigorosa no controle físico para mitigar riscos de avarias ou perdas financeiras."
            acaoRecomendada="Negociar prazos de entrega escalonados com fornecedores chave para reduzir o capital parado em almoxarifado."
            destaque={topPorValor.length > 0 ? 'info' : 'neutro'}
          />
        </div>

        {/* Distribuição por Categoria */}
        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Distribuição Financeira por Categoria
            </h3>
            <p className="text-xs text-muted-foreground">
              Proporção do capital imobilizado por grupo de materiais
            </p>
          </div>
          <div className="h-72 w-full">
            {dadosPorCategoria.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Nenhum dado categorizado
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosPorCategoria}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                    label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {dadosPorCategoria.map((_, index) => (
                      <Cell key={`cell-cat-${index}`} fill={CORES_PALETA[index % CORES_PALETA.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [
                      `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                      'Valor Total',
                    ]}
                    contentStyle={{ backgroundColor: 'var(--color-card, #fff)', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <ChartStorytellingNote
            oQueAconteceu={
              dadosPorCategoria[0]
                ? `A categoria '${dadosPorCategoria[0].name}' concentra a maior parcela dos recursos alocados em materiais.`
                : 'Distribuição homogênea entre categorias.'
            }
            impacto="Grupos com alta representatividade demandam políticas de compras centralizadas e homologação de múltiplos fornecedores."
            acaoRecomendada="Fixar orçamentos tetos por categoria e auditar periodicamente o consumo dos insumos de maior peso."
            destaque={dadosPorCategoria.length > 0 ? 'info' : 'neutro'}
          />
        </div>

        {/* Comparativo Saldo vs Mínimo */}
        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4 lg:col-span-2">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Saldo Atual vs Estoque Mínimo (Ponto de Reposição)
            </h3>
            <p className="text-xs text-muted-foreground">
              Comparativo entre o volume físico em almoxarifado e o limite operacional de segurança
            </p>
          </div>
          <div className="h-64 w-full">
            {dadosComparativoEstoque.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Nenhum material com quantidade mínima configurada
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosComparativoEstoque} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                  <XAxis dataKey="nome" stroke="var(--color-muted-foreground, #888)" fontSize={11} />
                  <YAxis stroke="var(--color-muted-foreground, #888)" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-card, #fff)', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  <Bar dataKey="saldo" name="Saldo Atual" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="minimo" name="Estoque Mínimo" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <ChartStorytellingNote
            oQueAconteceu={
              totalAbaixoMinimo > 0
                ? `${totalAbaixoMinimo} materiais estão operando abaixo do ponto mínimo de reposição estipulado.`
                : 'Todos os materiais monitorados atendem aos parâmetros mínimos de segurança.'
            }
            impacto={
              totalAbaixoMinimo > 0
                ? 'Operar próximo da margem mínima aumenta a probabilidade de parada de serviços por desabastecimento repentino.'
                : 'Margem de segurança confortável garante continuidade das obras sem interrupções por falta de insumos.'
            }
            acaoRecomendada={
              totalAbaixoMinimo > 0
                ? 'Gerar lista de compras imediatamente e disparar cotações com os fornecedores padrão.'
                : 'Manter a parametrização dos pontos de pedido alinhada com as metas dos próximos contratos.'
            }
            destaque={totalAbaixoMinimo > 0 ? 'alerta' : 'sucesso'}
          />
        </div>
      </div>
    </div>
  );
}
