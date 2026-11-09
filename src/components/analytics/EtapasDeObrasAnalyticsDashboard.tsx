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
import type { DimensaoVocabulario, Etapa, SubServico, Termo } from '../../lib/api';
import {
  AnalyticsFilterBar,
  type FiltrosAnalyticsState,
} from './AnalyticsFilterBar';
import { exportarCsv, exportarPdfRelatorio } from './exportReport';
import { KpiCard } from './KpiCard';
import { StorytellingPanel } from './StorytellingPanel';
import { ChartStorytellingNote } from './ChartStorytellingNote';

const DIMENSOES_ROTULOS: Record<string, string> = {
  verbos: 'Verbos (Ação)',
  objetos: 'Objetos (Elemento)',
  locais: 'Locais (Ambiente)',
  caracteristicas: 'Características (Especificação)',
};

const CORES_DIMENSOES = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

interface EtapasDeObrasAnalyticsDashboardProps {
  etapas: Etapa[];
  subServicos: SubServico[];
  termosPorDim: Record<DimensaoVocabulario, Termo[]>;
}

export function EtapasDeObrasAnalyticsDashboard({
  etapas,
  subServicos,
  termosPorDim,
}: EtapasDeObrasAnalyticsDashboardProps) {
  const [filtros, setFiltros] = useState<FiltrosAnalyticsState>({
    periodo: 'tudo',
  });

  // KPIs
  const totalEtapas = etapas.length;
  const etapasAtivas = etapas.filter((e) => e.ativo).length;
  const totalSubServicos = subServicos.length;
  const subServicosAtivos = subServicos.filter((s) => s.ativo).length;

  const totalVerbos = termosPorDim.verbos?.length ?? 0;
  const totalObjetos = termosPorDim.objetos?.length ?? 0;
  const totalLocais = termosPorDim.locais?.length ?? 0;
  const totalCaracteristicas = termosPorDim.caracteristicas?.length ?? 0;
  const totalTermos = totalVerbos + totalObjetos + totalLocais + totalCaracteristicas;

  // Gráfico 1: Sub-serviços por Etapa (Top etapas com mais sub-serviços)
  const dadosSubServicosPorEtapa = useMemo(() => {
    return etapas
      .map((e) => {
        const subsCount = subServicos.filter((s) => s.etapaId === e.id).length;
        return {
          nome: e.nome,
          total: subsCount,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [etapas, subServicos]);

  // Gráfico 2: Composição do Vocabulário Técnico (Pizza por dimensão)
  const dadosTermosPorDimensao = useMemo(() => {
    return [
      { name: 'Verbos', value: totalVerbos },
      { name: 'Objetos', value: totalObjetos },
      { name: 'Locais', value: totalLocais },
      { name: 'Características', value: totalCaracteristicas },
    ];
  }, [totalVerbos, totalObjetos, totalLocais, totalCaracteristicas]);

  // Gráfico 3: Taxa de Ativação do Catálogo
  const dadosAtivacao = useMemo(() => {
    return [
      { categoria: 'Etapas', Ativos: etapasAtivas, Inativos: totalEtapas - etapasAtivas },
      {
        categoria: 'Sub-serviços',
        Ativos: subServicosAtivos,
        Inativos: totalSubServicos - subServicosAtivos,
      },
    ];
  }, [etapasAtivas, totalEtapas, subServicosAtivos, totalSubServicos]);

  // Storytelling Dinâmico
  const storytelling = useMemo(() => {
    const topEtapa = dadosSubServicosPorEtapa[0];
    const densidade = totalEtapas > 0 ? (totalSubServicos / totalEtapas).toFixed(1) : '0';
    const percentAtivos = totalEtapas > 0 ? Math.round((etapasAtivas / totalEtapas) * 100) : 0;

    let statusGeral: 'otimo' | 'atencao' | 'critico' | 'estavel' = 'estavel';
    if (totalEtapas === 0) statusGeral = 'atencao';
    else if (etapasAtivas < totalEtapas * 0.6) statusGeral = 'atencao';
    else statusGeral = 'otimo';

    const cenario = [
      `Catálogo estruturado com ${totalEtapas} etapas de obra (${etapasAtivas} ativas, ${percentAtivos}% de disponibilidade) e ${totalSubServicos} sub-serviços técnicos especializados.`,
      `Taxonomia enriquecida com ${totalTermos} termos normalizados distribuídos entre Verbos (${totalVerbos}), Objetos (${totalObjetos}), Locais (${totalLocais}) e Características (${totalCaracteristicas}).`,
      topEtapa ? `Etapa '${topEtapa.nome}' possui a maior granularidade técnica com ${topEtapa.total} sub-serviços mapeados.` : 'Etapas com distribuição uniforme de escopos.',
    ];

    const diagnostico = [
      totalEtapas > 0 && densidade === '0.0'
        ? `Etapas cadastradas sem sub-serviços associados impossibilitam a composição de preços detalhada nos orçamentos.`
        : `Densidade de ${densidade} sub-serviços por etapa garante detalhamento técnico preciso para a montagem de composições de custos.`,
      totalTermos < 15
        ? `Vocabulário restrito: ampliar a base de locais e características para permitir descrições de serviço mais ricas para os clientes.`
        : `Base terminológica robusta para padronização de laudos técnicos e propostas de impermeabilização.`,
    ];

    const recomendacoes = [
      `Manter ativas apenas as etapas com procedimentos operacionais padronizados (POPs) validados pelo responsável técnico.`,
      `Revisar periodicamente etapas com menos de 2 sub-serviços para agrupar escopos ou desdobrar novas especificações técnicas.`,
    ];

    const resumoExecutivo = totalEtapas === 0
      ? 'Nenhuma etapa de obra cadastrada no catálogo.'
      : `Catálogo reúne ${totalEtapas} etapas e ${totalSubServicos} sub-serviços (densidade média de ${densidade}/etapa) com ${totalTermos} termos técnicos, suportando a padronização dos orçamentos e do planejamento de obras.`;

    return { statusGeral, cenario, diagnostico, recomendacoes, resumoExecutivo };
  }, [dadosSubServicosPorEtapa, totalEtapas, etapasAtivas, totalSubServicos, totalTermos, totalVerbos, totalObjetos, totalLocais, totalCaracteristicas]);

  // Exportações
  const handleExportarCsv = () => {
    const colunas = ['ID', 'Etapa', 'Ordem', 'Sub-serviços Vinculados', 'Status'];
    const linhas = etapas.map((e) => [
      e.id,
      e.nome,
      e.ordem,
      subServicos.filter((s) => s.etapaId === e.id).length,
      e.ativo ? 'Ativo' : 'Inativo',
    ]);
    exportarCsv('relatorio_etapas_vocabulario_obras', colunas, linhas);
  };

  const handleExportarPdf = () => {
    const colunas = ['ID', 'Etapa', 'Ordem', 'Sub-serviços', 'Status'];
    const linhas = etapas.map((e) => [
      e.id,
      e.nome,
      e.ordem,
      subServicos.filter((s) => s.etapaId === e.id).length,
      e.ativo ? 'Ativo' : 'Inativo',
    ]);
    const kpis = [
      { rotulo: 'Total Etapas', valor: totalEtapas },
      { rotulo: 'Sub-serviços', valor: totalSubServicos },
      { rotulo: 'Termos Técnicos', valor: totalTermos },
      { rotulo: 'Etapas Ativas', valor: etapasAtivas },
    ];
    exportarPdfRelatorio(
      'Relatório de Etapas de Obras',
      'Estrutura do Catálogo de Etapas, Sub-serviços e Vocabulário Operacional',
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
          Painel Executivo de Etapas e Vocabulário de Obras
        </h2>
        <p className="text-sm text-muted-foreground">
          Estrutura analítica da taxonomia técnica de obras, granularidade de etapas e catálogo de termos.
        </p>
      </div>

      {/* Barra de Filtros */}
      <AnalyticsFilterBar
        filtros={filtros}
        onChange={setFiltros}
        onExportarCsv={handleExportarCsv}
        onExportarPdf={handleExportarPdf}
      />

      {/* Grid de KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          titulo="Total de Etapas"
          valor={totalEtapas}
          subtitulo={`${etapasAtivas} etapas ativas no catálogo`}
          destaque="primary"
          icone={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
        />
        <KpiCard
          titulo="Sub-serviços Técnicos"
          valor={totalSubServicos}
          subtitulo={`${subServicosAtivos} ativos em orçamentos`}
          destaque="success"
          icone={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <KpiCard
          titulo="Termos Vocabulário"
          valor={totalTermos}
          subtitulo="Verbos, Objetos, Locais e Caracter."
          destaque="info"
          icone={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          }
        />
        <KpiCard
          titulo="Densidade Média"
          valor={totalEtapas > 0 ? (totalSubServicos / totalEtapas).toFixed(1) : 0}
          subtitulo="Sub-serviços por etapa de obra"
          destaque="warning"
          icone={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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
        {/* Gráfico 1: Sub-serviços por Etapa (Barras) */}
        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
          <div>
            <h3 className="font-semibold text-base text-foreground">Sub-serviços por Etapa</h3>
            <p className="text-xs text-muted-foreground">Volume de especialidades vinculadas a cada etapa</p>
          </div>
          <div className="h-72 w-full">
            {dadosSubServicosPorEtapa.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Nenhuma etapa cadastrada.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosSubServicosPorEtapa} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="nome" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--color-card, #fff)', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="total" name="Sub-serviços" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <ChartStorytellingNote
            oQueAconteceu={
              dadosSubServicosPorEtapa[0]
                ? `'${dadosSubServicosPorEtapa[0].nome}' lidera o catálogo com ${dadosSubServicosPorEtapa[0].total} sub-serviços estruturados.`
                : 'Sem etapas cadastradas.'
            }
            impacto="Etapas ricas em sub-serviços permitem parametrização minuciosa de mão de obra e insumos nos orçamentos."
            acaoRecomendada="Expandir o desdobramento de sub-serviços nas etapas que possuem apenas 1 item cadastrado."
            destaque="info"
          />
        </div>

        {/* Gráfico 2: Composição de Vocabulário (Donut) */}
        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
          <div>
            <h3 className="font-semibold text-base text-foreground">Composição do Vocabulário</h3>
            <p className="text-xs text-muted-foreground">Distribuição entre Verbos, Objetos, Locais e Características</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dadosTermosPorDimensao}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {dadosTermosPorDimensao.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CORES_DIMENSOES[index % CORES_DIMENSOES.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--color-card, #fff)', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ChartStorytellingNote
            oQueAconteceu={`Base semântica contendo ${totalTermos} termos técnicos distribuídos nas 4 dimensões canônicas.`}
            impacto="Padronização do vocabulário previne ambiguidades na redação de contratos e no diário de obra das equipes."
            acaoRecomendada="Estimular os engenheiros e orçamentistas a utilizarem as combinações padronizadas de termos nos novos serviços."
            destaque="sucesso"
          />
        </div>

        {/* Gráfico 3: Taxa de Ativação do Catálogo */}
        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4 lg:col-span-2">
          <div>
            <h3 className="font-semibold text-base text-foreground">Status do Catálogo (Ativos vs Inativos)</h3>
            <p className="text-xs text-muted-foreground">Proporção de elementos ativos no sistema</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosAtivacao} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="categoria" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--color-card, #fff)', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Ativos" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Inativos" fill="#94a3b8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ChartStorytellingNote
            oQueAconteceu={`${etapasAtivas} de ${totalEtapas} etapas e ${subServicosAtivos} de ${totalSubServicos} sub-serviços estão ativos para seleção.`}
            impacto="Itens inativos garantem que orçamentos históricos não quebrem ao mesmo tempo que limpam a esteira para novos projetos."
            acaoRecomendada="Arquivar definitivamente taxonomias descontinuadas há mais de 1 ano para manter a interface ágil."
            destaque="info"
          />
        </div>
      </div>
    </div>
  );
}

