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
import type { EpiItem, EpiLookups } from '../../lib/api';
import {
  AnalyticsFilterBar,
  type FiltrosAnalyticsState,
} from './AnalyticsFilterBar';
import { exportarCsv, exportarPdfRelatorio } from './exportReport';
import { KpiCard } from './KpiCard';
import { StorytellingPanel } from './StorytellingPanel';
import { ChartStorytellingNote } from './ChartStorytellingNote';

const CORES_PALETA = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];

interface EpisAnalyticsDashboardProps {
  epis: EpiItem[];
  lookups?: EpiLookups | null;
}

const ehVencido = (dataValidade: string | null) => {
  if (!dataValidade) return false;
  return new Date(dataValidade).getTime() < Date.now();
};

const venceEm30Dias = (dataValidade: string | null) => {
  if (!dataValidade) return false;
  const d = new Date(dataValidade).getTime();
  const hoje = Date.now();
  const limite = hoje + 30 * 24 * 60 * 60 * 1000;
  return d >= hoje && d <= limite;
};

const custoDe = (e: EpiItem) => (e.custoUnitario != null ? Number(e.custoUnitario) : 0);
const valorTotalDe = (e: EpiItem) => e.quantidade * custoDe(e);

export function EpisAnalyticsDashboard({
  epis,
  lookups,
}: EpisAnalyticsDashboardProps) {
  const [filtros, setFiltros] = useState<FiltrosAnalyticsState>({
    periodo: 'tudo',
  });

  // Normalize numeric fields to ensure they are numbers (not zero‑padded strings)
  const episNormalized = useMemo(() =>
    epis.map((e) => ({
      ...e,
      quantidade: Number(e.quantidade),
      custoUnitario: e.custoUnitario != null ? Number(e.custoUnitario) : undefined,
    })),
    [epis]
  );

  // Filtragem using normalized data
  const episFiltrados = useMemo(() => {
    return episNormalized.filter((e) => {
      // Categoria
      if (filtros.categoria && String(e.categoriaId) !== filtros.categoria) {
        return false;
      }

      // Status
      if (filtros.status) {
        if (filtros.status === 'VENCIDO' && !ehVencido(e.dataValidade)) return false;
        if (filtros.status === 'VENCENDO' && !venceEm30Dias(e.dataValidade)) return false;
        if (filtros.status === 'VALIDO' && (ehVencido(e.dataValidade) || venceEm30Dias(e.dataValidade))) return false;
        if (filtros.status === 'ABAIXO_MINIMO' && (e.quantidadeMinima == null || e.quantidade >= e.quantidadeMinima)) return false;
      }

      // Busca textual
      if (filtros.busca) {
        const texto = filtros.busca.toLowerCase();
        const nome = e.nome.toLowerCase();
        const cod = e.codigo.toLowerCase();
        const ca = (e.numeroCa || '').toLowerCase();
        const cat = (e.categoria?.nome || '').toLowerCase();
        if (!nome.includes(texto) && !cod.includes(texto) && !ca.includes(texto) && !cat.includes(texto)) {
          return false;
        }
      }

      return true;
    });
  }, [episNormalized, filtros]);

  // KPIs
  const totalEstoqueFisico = useMemo(
    () => episFiltrados.reduce((acc, e) => acc + Number(e.quantidade), 0),
    [episFiltrados],
  );

  const valorTotalEstoque = useMemo(
    () => episFiltrados.reduce((acc, e) => acc + valorTotalDe(e), 0),
    [episFiltrados],
  );

  const totalVencidos = useMemo(
    () => episFiltrados.filter((e) => ehVencido(e.dataValidade)).length,
    [episFiltrados],
  );

  const totalVencendo = useMemo(
    () => episFiltrados.filter((e) => venceEm30Dias(e.dataValidade)).length,
    [episFiltrados],
  );

  // Gráfico 1: Top 8 EPIs por Volume em Estoque
  const topPorEstoque = useMemo(() => {
    return [...episFiltrados]
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 8)
      .map((e) => ({
        nome: e.nome.length > 20 ? `${e.nome.slice(0, 18)}...` : e.nome,
        nomeCompleto: e.nome,
        quantidade: e.quantidade,
        valorTotal: valorTotalDe(e),
      }));
  }, [episFiltrados]);

  // Gráfico 2: Distribuição por Categoria de Proteção (Donut)
  const dadosPorCategoria = useMemo(() => {
    const agrupado: Record<string, number> = {};
    episFiltrados.forEach((e) => {
      const cat = e.categoria?.nome || 'Não categorizado';
      agrupado[cat] = (agrupado[cat] || 0) + e.quantidade;
    });
    return Object.entries(agrupado)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [episFiltrados]);

  // Gráfico 3: Status de Validade e Conformidade
  const dadosStatusValidade = useMemo(() => {
    let validos = 0;
    let vencendo = 0;
    let vencidos = 0;
    episFiltrados.forEach((e) => {
      if (ehVencido(e.dataValidade)) vencidos++;
      else if (venceEm30Dias(e.dataValidade)) vencendo++;
      else validos++;
    });
    return [
      { status: 'Válidos', quantidade: validos, fill: '#10b981' },
      { status: 'Vencendo (<30d)', quantidade: vencendo, fill: '#f59e0b' },
      { status: 'Vencidos', quantidade: vencidos, fill: '#ef4444' },
    ];
  }, [episFiltrados]);

  // Exportações
  // Storytelling Dinâmico
  const storytelling = useMemo(() => {
    const totalItens = episFiltrados.length;
    const topEpi = topPorEstoque[0];
    const topCat = dadosPorCategoria[0];

    let statusGeral: 'otimo' | 'atencao' | 'critico' | 'estavel' = 'otimo';
    if (totalVencidos > 0) statusGeral = 'critico';
    else if (totalVencendo > 0) statusGeral = 'atencao';
    else if (totalItens > 0) statusGeral = 'estavel';

    const cenario = [
      `Parque de proteção conta com ${totalEstoqueFisico === 0 ? '0' : totalEstoqueFisico.toLocaleString('pt-BR')} unidades de EPIs com patrimônio avaliado em R$ ${valorTotalEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
      topCat ? `Categoria '${topCat.name}' lidera a disponibilidade com ${topCat.value} unidades em almoxarifado.` : 'Distribuição uniforme entre categorias de proteção.',
      `${totalVencidos} modelos estão com Certificado de Aprovação (CA) vencido e ${totalVencendo} vencem nos próximos 30 dias.`,
    ];

    const diagnostico = [
      totalVencidos > 0
        ? `Risco jurídico e de segurança do trabalho: utilização de EPI com CA vencido invalida laudos de SST e sujeita a empresa a autuações da fiscalização.`
        : `100% dos modelos de proteção física estão dentro do prazo legal de validade de CA.`,
      totalVencendo > 0
        ? `Janela curta de 30 dias para renovação ou compra de substitutos para ${totalVencendo} lotes de proteção individual.`
        : `Sem risco iminente de expiração de certificados no curto prazo.`,
      topEpi
        ? `Volume de estoque mais expressivo concentrado em '${topEpi.nomeCompleto}' (${topEpi.quantidade} un).`
        : `Estoque balanceado conforme a demanda das equipes de campo.`,
    ];

    const recomendacoes = [
      totalVencidos > 0
        ? `Bloquear e segregar imediatamente em almoxarifado os ${totalVencidos} lotes com CA expirado, proibindo distribuição às equipes.`
        : `Manter a verificação mensal de certificados no portal do MTE.`,
      totalVencendo > 0
        ? `Consultar fornecedores sobre a renovação do CA dos ${totalVencendo} modelos ou encomendar marcas substitutas homologadas.`
        : `Auditar o preenchimento das fichas de entrega de EPI assinadas pelos colaboradores.`,
      `Adequar os pontos de pedido das categorias de maior desgaste (como luvas e calçados) para evitar desabastecimento em campo.`,
    ];

    const resumoExecutivo = totalVencidos > 0
      ? `Atenção crítica: identificados ${totalVencidos} modelos de EPIs com CA vencido. Ação imediata de descarte e bloqueio requerida.`
      : totalVencendo > 0
      ? `Operação regular com alerta para ${totalVencendo} EPIs cujos certificados expiram nos próximos 30 dias.`
      : `Conformidade total das normas de segurança do trabalho e estoque de EPIs plenamente regularizado.`;

    return { statusGeral, resumoExecutivo, cenario, diagnostico, recomendacoes };
  }, [episFiltrados, totalEstoqueFisico, valorTotalEstoque, totalVencidos, totalVencendo, topPorEstoque, dadosPorCategoria]);

  const handleExportarCsv = () => {
    const colunas = [
      'Código',
      'EPI',
      'Categoria',
      'CA',
      'Validade',
      'Estoque',
      'Mínimo',
      'Custo Unit. (R$)',
      'Valor Total (R$)',
      'Status Validade',
    ];
    const linhas = episFiltrados.map((e) => {
      const statusVal = ehVencido(e.dataValidade)
        ? 'VENCIDO'
        : venceEm30Dias(e.dataValidade)
          ? 'VENCENDO'
          : 'VÁLIDO';
      return [
        e.codigo,
        e.nome,
        e.categoria?.nome ?? '—',
        e.numeroCa ?? '—',
        e.dataValidade ? new Date(e.dataValidade).toLocaleDateString('pt-BR') : 'Indeterminada',
        e.quantidade,
        e.quantidadeMinima ?? '—',
        custoDe(e).toFixed(2),
        valorTotalDe(e).toFixed(2),
        statusVal,
      ];
    });
    exportarCsv('relatorio_epis_estoque', colunas, linhas);
  };

  const handleExportarPdf = () => {
    const colunas = ['Código', 'EPI', 'Categoria', 'CA', 'Validade', 'Estoque', 'Valor Total'];
    const linhas = episFiltrados.map((e) => [
      e.codigo,
      e.nome,
      e.categoria?.nome ?? '—',
      e.numeroCa ?? '—',
      e.dataValidade ? new Date(e.dataValidade).toLocaleDateString('pt-BR') : '—',
      `${e.quantidade} un`,
      `R$ ${valorTotalDe(e).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    ]);
    const kpis = [
      { rotulo: 'Estoque Físico Total', valor: `${totalEstoqueFisico} unidades` },
      {
        rotulo: 'Valor Total em Estoque',
        valor: `R$ ${valorTotalEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      },
      { rotulo: 'EPIs Vencidos', valor: `${totalVencidos} itens` },
      { rotulo: 'Vencendo em 30d', valor: `${totalVencendo} itens` },
    ];
    exportarPdfRelatorio(
      'Relatório de Gestão e Segurança de EPIs',
      'Controle de Validade de Certificados de Aprovação (CA), Estoque e Custos',
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
          Painel Executivo de EPIs & Segurança
        </h2>
        <p className="text-sm text-muted-foreground">
          Gestão de Equipamentos de Proteção Individual, monitoramento de CA, vencimento e saldos.
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
          { valor: 'VALIDO', rotulo: 'Dentro da Validade' },
          { valor: 'VENCENDO', rotulo: 'Vencendo em até 30 dias' },
          { valor: 'VENCIDO', rotulo: 'Certificado Vencido' },
          { valor: 'ABAIXO_MINIMO', rotulo: 'Abaixo do Mínimo' },
        ]}
        onExportarCsv={handleExportarCsv}
        onExportarPdf={handleExportarPdf}
      />

      {/* Grid de KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          titulo="Estoque Físico Total"
          valor={totalEstoqueFisico.toLocaleString('pt-BR')}
          subtitulo="Unidades de EPIs disponíveis"
          destaque="default"
        />
        <KpiCard
          titulo="Valor em Estoque"
          valor={`R$ ${valorTotalEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitulo="Patrimônio em equipamentos de proteção"
          destaque="primary"
        />
        <KpiCard
          titulo="EPIs com CA Vencido"
          valor={totalVencidos}
          subtitulo="Inconformidade / descarte necessário"
          destaque={totalVencidos > 0 ? 'destructive' : 'default'}
        />
        <KpiCard
          titulo="Vencendo em 30 Dias"
          valor={totalVencendo}
          subtitulo="Planejamento de reposição"
          destaque={totalVencendo > 0 ? 'warning' : 'default'}
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
        {/* Top EPIs por Estoque */}
        <div className="rounded-xl border bg-card p-5 shadow-2xs">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-foreground">
              Top EPIs com Maior Estoque Físico
            </h3>
            <p className="text-xs text-muted-foreground">
              Itens com maior quantidade disponível em almoxarifado
            </p>
          </div>
          <div className="h-72 w-full">
            {topPorEstoque.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Nenhum EPI em estoque
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topPorEstoque} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={false} />
                  <XAxis
                    type="number"
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
                      `${Number(valor).toLocaleString('pt-BR')} un`,
                      'Quantidade',
                    ]}
                  />
                  <Bar dataKey="quantidade" radius={[0, 6, 6, 0]}>
                    {topPorEstoque.map((_, index) => (
                      <Cell key={`cell-epi-${index}`} fill={CORES_PALETA[index % CORES_PALETA.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <ChartStorytellingNote
            oQueAconteceu={
              topPorEstoque[0]
                ? `O modelo '${topPorEstoque[0].nomeCompleto}' lidera o inventário físico com ${topPorEstoque[0].quantidade} unidades em depósito.`
                : 'Inventário distribuído sem disparidade quantitativa.'
            }
            impacto="Manter alto volume estocado de itens com validade de CA pode gerar perda de lotes caso o consumo não acompanhe o prazo legal."
            acaoRecomendada="Casar o volume de compra das unidades de maior saída com a taxa média de substituição em campo."
            destaque={topPorEstoque.length > 0 ? 'info' : 'neutro'}
          />
        </div>

        {/* Distribuição por Categoria de Proteção */}
        <div className="rounded-xl border bg-card p-5 shadow-2xs">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-foreground">
              Distribuição por Categoria de Proteção
            </h3>
            <p className="text-xs text-muted-foreground">
              Volume de EPIs agrupados por finalidade de proteção
            </p>
          </div>
          <div className="h-72 w-full">
            {dadosPorCategoria.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
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
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {dadosPorCategoria.map((_, index) => (
                      <Cell key={`cell-epic-${index}`} fill={CORES_PALETA[index % CORES_PALETA.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [
                      `${Number(val).toLocaleString('pt-BR')} unidades`,
                      'Total em Estoque',
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <ChartStorytellingNote
            oQueAconteceu={
              dadosPorCategoria[0]
                ? `A categoria '${dadosPorCategoria[0].name}' lidera a demanda física de proteção individual.`
                : 'Categorias de segurança equilibradas.'
            }
            impacto="Desequilíbrio entre grupos de proteção pode indicar negligência em categorias secundárias (como auditiva ou respiratória)."
            acaoRecomendada="Garantir que kits completos de segurança (EPIs de cabeça, tronco, membros e pés) estejam simultaneamente disponíveis."
            destaque={dadosPorCategoria.length > 0 ? 'info' : 'neutro'}
          />
        </div>

        {/* Conformidade e Validade de CA */}
        <div className="rounded-xl border bg-card p-5 shadow-2xs lg:col-span-2">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-foreground">
              Conformidade de Validade dos Certificados (CA)
            </h3>
            <p className="text-xs text-muted-foreground">
              Situação dos lotes de segurança em relação ao prazo de validade
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosStatusValidade} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                <XAxis dataKey="status" stroke="var(--color-muted-foreground, #888)" fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground, #888)" fontSize={11} />
                <Tooltip />
                <Bar dataKey="quantidade" name="Modelos de EPI" radius={[6, 6, 0, 0]}>
                  {dadosStatusValidade.map((item, index) => (
                    <Cell key={`cell-val-${index}`} fill={item.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ChartStorytellingNote
            oQueAconteceu={
              totalVencidos > 0
                ? `${totalVencidos} modelos estão com CA vencido e ${totalVencendo} vencem nos próximos 30 dias.`
                : totalVencendo > 0
                ? `${totalVencendo} modelos de EPI têm certificado expirando no próximo mês.`
                : '100% dos EPIs possuem Certificado de Aprovação válido e em conformidade.'
            }
            impacto={
              totalVencidos > 0
                ? 'Gravidade alta: risco de acidentes com equipamento sem respaldo técnico e penalidades severas em fiscalizações do trabalho.'
                : totalVencendo > 0
                ? 'Necessidade de planejar compra com antecedência para evitar desabastecimento de itens conformes.'
                : 'Conformidade legal assegurada, respaldando a empresa e preservando a integridade física dos colaboradores.'
            }
            acaoRecomendada={
              totalVencidos > 0
                ? 'Segregar lotes vencidos e contatar o fabricante para verificar renovação de CA ou adquirir novo lote compatível.'
                : totalVencendo > 0
                ? 'Emitir pedido de cotação para substituição dos itens antes do vencimento da janela de 30 dias.'
                : 'Manter a verificação periódica automatizada dos registros de CA.'
            }
            destaque={totalVencidos > 0 ? 'alerta' : totalVencendo > 0 ? 'info' : 'sucesso'}
          />
        </div>
      </div>
    </div>
  );
}
