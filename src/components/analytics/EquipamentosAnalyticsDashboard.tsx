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
import type { EquipamentoItem, EquipamentoLookups } from '../../lib/api';
import {
  AnalyticsFilterBar,
  type FiltrosAnalyticsState,
} from './AnalyticsFilterBar';
import { exportarCsv, exportarPdfRelatorio } from './exportReport';
import { KpiCard } from './KpiCard';
import { StorytellingPanel } from './StorytellingPanel';
import { ChartStorytellingNote } from './ChartStorytellingNote';

const CORES_PALETA = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];

interface EquipamentosAnalyticsDashboardProps {
  equipamentos: EquipamentoItem[];
  lookups?: EquipamentoLookups | null;
}

export function EquipamentosAnalyticsDashboard({
  equipamentos,
  lookups,
}: EquipamentosAnalyticsDashboardProps) {
  const [filtros, setFiltros] = useState<FiltrosAnalyticsState>({
    periodo: 'tudo',
  });

  // Filtragem
  const equipamentosFiltrados = useMemo(() => {
    return equipamentos.filter((e) => {
      // Categoria
      if (filtros.categoria && String(e.categoriaId) !== filtros.categoria) {
        return false;
      }

      // Status
      if (filtros.status) {
        if (filtros.status === 'RETIRADO' && !e.responsavel) return false;
        if (filtros.status === 'DISPONIVEL' && e.responsavel != null) return false;
        if (filtros.status === 'ATIVO' && !e.ativo) return false;
        if (filtros.status === 'INATIVO' && e.ativo) return false;
      }

      // Busca textual
      if (filtros.busca) {
        const texto = filtros.busca.toLowerCase();
        const desc = e.descricao.toLowerCase();
        const cod = e.codigo.toLowerCase();
        const pat = (e.numeroPatrimonio || '').toLowerCase();
        const resp = (e.responsavel?.nome || '').toLowerCase();
        const cat = (e.categoria?.nome || '').toLowerCase();
        if (
          !desc.includes(texto) &&
          !cod.includes(texto) &&
          !pat.includes(texto) &&
          !resp.includes(texto) &&
          !cat.includes(texto)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [equipamentos, filtros]);

  // KPIs
  const totalEquipamentos = equipamentosFiltrados.length;

  const totalRetirados = useMemo(
    () => equipamentosFiltrados.filter((e) => e.responsavel != null).length,
    [equipamentosFiltrados],
  );

  const totalDisponiveis = totalEquipamentos - totalRetirados;

  const taxaAlocacao = totalEquipamentos > 0 ? (totalRetirados / totalEquipamentos) * 100 : 0;

  // Gráfico 1: Equipamentos por Categoria (Barras Horizontais)
  const dadosPorCategoria = useMemo(() => {
    const agrupado: Record<string, number> = {};
    equipamentosFiltrados.forEach((e) => {
      const cat = e.categoria?.nome || 'Geral / Outros';
      agrupado[cat] = (agrupado[cat] || 0) + 1;
    });
    return Object.entries(agrupado)
      .map(([nome, quantidade]) => ({
        nome: nome.length > 20 ? `${nome.slice(0, 18)}...` : nome,
        nomeCompleto: nome,
        quantidade,
      }))
      .sort((a, b) => b.quantidade - a.quantidade);
  }, [equipamentosFiltrados]);

  // Gráfico 2: Status Operacional (Donut)
  const dadosStatusOperacional = useMemo(() => {
    return [
      { name: 'Disponível em Base', value: totalDisponiveis, fill: '#10b981' },
      { name: 'Em Obra / Retirado', value: totalRetirados, fill: '#3b82f6' },
    ].filter((x) => x.value > 0);
  }, [totalDisponiveis, totalRetirados]);

  // Gráfico 3: Alocação por Responsável
  const dadosPorResponsavel = useMemo(() => {
    const agrupado: Record<string, number> = {};
    equipamentosFiltrados
      .filter((e) => e.responsavel != null)
      .forEach((e) => {
        const resp = e.responsavel?.nome || 'Não identificado';
        agrupado[resp] = (agrupado[resp] || 0) + 1;
      });
    return Object.entries(agrupado)
      .map(([nome, quantidade]) => ({ nome, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 8);
  }, [equipamentosFiltrados]);

  // Storytelling Dinâmico
  const storytelling = useMemo(() => {
    const topCat = dadosPorCategoria[0];
    const topResp = dadosPorResponsavel[0];
    const percentVolumeCat = totalEquipamentos > 0 && topCat ? ((topCat.quantidade / totalEquipamentos) * 100).toFixed(1) : '0';

    let statusGeral: 'otimo' | 'atencao' | 'critico' | 'estavel' = 'estavel';
    if (totalDisponiveis === 0 && totalEquipamentos > 0) statusGeral = 'critico';
    else if (taxaAlocacao > 80) statusGeral = 'atencao';
    else if (taxaAlocacao > 30) statusGeral = 'otimo';

    const cenario = [
      `Inventário operacional conta com ${totalEquipamentos} ferramentas e maquinários cadastrados.`,
      `Taxa de utilização de ${taxaAlocacao.toFixed(1)}% com ${totalRetirados} equipamentos em campo e ${totalDisponiveis} disponíveis na base.`,
      topCat ? `Categoria '${topCat.nome}' lidera em volume concentrando ${percentVolumeCat}% dos equipamentos (${topCat.quantidade} unidades).` : 'Volume distribuído entre grupos.',
    ];

    const diagnostico = [
      totalDisponiveis === 0 && totalEquipamentos > 0
        ? `Gargalo crítico: nenhum equipamento de reserva disponível na base para suprir imprevistos ou novas frentes de obra.`
        : taxaAlocacao > 75
        ? `Alta produtividade: parque de equipamentos com ótima taxa de giro e baixa ociosidade.`
        : `Ociosidade operacional: parcela significativa de ferramentas paradas na base gerando custo de oportunidade.`,
      topResp
        ? `Concentração operacional: o colaborador '${topResp.nome}' detém a guarda de ${topResp.quantidade} equipamentos (${((topResp.quantidade / (totalRetirados || 1)) * 100).toFixed(0)}% do parque em campo).`
        : `Custódia bem distribuída entre os encarregados de obra.`,
      `Risco de extravio e depreciação acelerada caso o termo de cautela e a devolução física não sejam checados semanalmente.`,
    ];

    const recomendacoes = [
      totalDisponiveis === 0
        ? `Avaliar locação emergencial ou remanejamento de itens ociosos em obras menos prioritárias.`
        : `Realizar inventário físico cruzando os números de patrimônio com os comprovantes de cautela assinados.`,
      topResp && topResp.quantidade > 3
        ? `Verificar se todos os ${topResp.quantidade} itens em posse de '${topResp.nome}' estão sendo ativamente utilizados na obra designada.`
        : `Manter plano de manutenção preventiva para os equipamentos e ferramentas essenciais.`,
      `Padronizar a etiquetagem com QR Code / tombamento de patrimônio para acelerar os check-ins e check-outs.`,
    ];

    const resumoExecutivo = totalDisponiveis === 0 && totalEquipamentos > 0
      ? `Capacidade operacional esgotada com 100% dos equipamentos alocados. Risco de indisponibilidade para novas ordens de serviço.`
      : taxaAlocacao > 75
      ? `Alta ocupação (${taxaAlocacao.toFixed(1)}%) com ${totalRetirados} equipamentos em campo gerando produtividade contínua nas obras.`
      : `Parque de ferramentas com margem disponível na base (${totalDisponiveis} itens prontos para retirada).`;

    return { statusGeral, resumoExecutivo, cenario, diagnostico, recomendacoes };
  }, [totalEquipamentos, totalRetirados, totalDisponiveis, taxaAlocacao, dadosPorCategoria, dadosPorResponsavel]);

  // Exportações
  const handleExportarCsv = () => {
    const colunas = [
      'Código',
      'Descrição',
      'Patrimônio',
      'Categoria',
      'Status Operacional',
      'Responsável Atual',
    ];
    const linhas = equipamentosFiltrados.map((e) => [
      e.codigo,
      e.descricao,
      e.numeroPatrimonio ?? '—',
      e.categoria?.nome ?? '—',
      e.responsavel ? 'EM OBRA' : 'DISPONÍVEL',
      e.responsavel?.nome ?? 'Na base',
    ]);
    exportarCsv('relatorio_equipamentos_patrimonio', colunas, linhas);
  };

  const handleExportarPdf = () => {
    const colunas = ['Código', 'Descrição', 'Categoria', 'Status', 'Responsável'];
    const linhas = equipamentosFiltrados.map((e) => [
      e.codigo,
      e.descricao,
      e.categoria?.nome ?? '—',
      e.responsavel ? 'Em Obra' : 'Disponível',
      e.responsavel?.nome ?? 'Na base',
    ]);
    const kpis = [
      { rotulo: 'Total de Equipamentos', valor: `${totalEquipamentos} unidades` },
      { rotulo: 'Em Obra / Retirados', valor: `${totalRetirados} itens` },
      { rotulo: 'Disponíveis na Base', valor: `${totalDisponiveis} itens` },
      { rotulo: 'Taxa de Ocupação', valor: `${taxaAlocacao.toFixed(1)}%` },
    ];
    exportarPdfRelatorio(
      'Relatório Patrimonial e de Alocação de Equipamentos',
      'Inventário de Máquinas, Ferramentas, Localização e Responsáveis em Campo',
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
          Painel Executivo de Equipamentos & Alocação
        </h2>
        <p className="text-sm text-muted-foreground">
          Gestão operacional de equipamentos, rastreamento de ferramentas e taxa de utilização em obras.
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
          { valor: 'DISPONIVEL', rotulo: 'Disponível na Base' },
          { valor: 'RETIRADO', rotulo: 'Em Obra / Retirado' },
          { valor: 'ATIVO', rotulo: 'Ativo' },
          { valor: 'INATIVO', rotulo: 'Inativo' },
        ]}
        onExportarCsv={handleExportarCsv}
        onExportarPdf={handleExportarPdf}
      />

      {/* Grid de KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          titulo="Taxa de Ocupação"
          valor={`${taxaAlocacao.toFixed(1)}%`}
          subtitulo="Percentual de equipamentos em campo"
          destaque="primary"
          icone={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
        <KpiCard
          titulo="Total de Equipamentos"
          valor={totalEquipamentos}
          subtitulo="Ativos físicos catalogados"
          destaque="default"
          icone={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />
        <KpiCard
          titulo="Equipamentos em Campo"
          valor={totalRetirados}
          subtitulo="Alocados em execução de obras"
          destaque={taxaAlocacao > 50 ? 'info' : 'default'}
          icone={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          }
        />
        <KpiCard
          titulo="Disponíveis na Base"
          valor={totalDisponiveis}
          subtitulo="Prontos para retirada/uso"
          destaque={totalDisponiveis > 0 ? 'success' : 'destructive'}
          icone={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
        {/* Distribuição por Categoria */}
        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Distribuição por Categoria (Unidades)
            </h3>
            <p className="text-xs text-muted-foreground">
              Volume de equipamentos catalogados por grupo
            </p>
          </div>
          <div className="h-72 w-full">
            {dadosPorCategoria.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Sem equipamentos cadastrados
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosPorCategoria} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => `${v}`}
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
                      `${valor} un`,
                      'Quantidade',
                    ]}
                    contentStyle={{ backgroundColor: 'var(--color-card, #fff)', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="quantidade" radius={[0, 6, 6, 0]}>
                    {dadosPorCategoria.map((_, index) => (
                      <Cell key={`cell-eq-${index}`} fill={CORES_PALETA[index % CORES_PALETA.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <ChartStorytellingNote
            oQueAconteceu={
              dadosPorCategoria[0]
                ? `A categoria '${dadosPorCategoria[0].nome}' concentra o maior volume com ${dadosPorCategoria[0].quantidade} unidades.`
                : 'Distribuição uniforme entre categorias.'
            }
            impacto="Categorias com grande volume demandam inventários periódicos frequentes para evitar extravios e perdas."
            acaoRecomendada="Priorizar conferências preventivas para as categorias com maior número de itens em campo."
            destaque={dadosPorCategoria.length > 0 ? 'info' : 'neutro'}
          />
        </div>

        {/* Status Operacional */}
        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Status Operacional dos Equipamentos
            </h3>
            <p className="text-xs text-muted-foreground">
              Proporção entre ativos disponíveis na base e alocados em obras
            </p>
          </div>
          <div className="h-72 w-full">
            {dadosStatusOperacional.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Nenhum equipamento cadastrado
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosStatusOperacional}
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
                    {dadosStatusOperacional.map((item, index) => (
                      <Cell key={`cell-st-${index}`} fill={item.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [
                      `${Number(val).toLocaleString('pt-BR')} unidades`,
                      'Quantidade',
                    ]}
                    contentStyle={{ backgroundColor: 'var(--color-card, #fff)', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <ChartStorytellingNote
            oQueAconteceu={`Taxa de ocupação em ${taxaAlocacao.toFixed(1)}%, com ${totalRetirados} ativos em obras e ${totalDisponiveis} na base.`}
            impacto={
              taxaAlocacao > 80
                ? 'Alta demanda de campo deixa pouca margem de manobra para substituição em caso de quebra.'
                : 'Equipamentos ociosos na base representam capital sem retorno imediato e exigem guarda segura.'
            }
            acaoRecomendada={
              taxaAlocacao > 80
                ? 'Avaliar aquisição ou locação de contingência para as ferramentas com 100% de ocupação.'
                : 'Incentivar o compartilhamento e rotatividade de ferramentas entre canteiros.'
            }
            destaque={taxaAlocacao > 70 ? 'info' : 'neutro'}
          />
        </div>

        {/* Alocação por Responsável */}
        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4 lg:col-span-2">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Equipamentos em Campo por Responsável / Condutor
            </h3>
            <p className="text-xs text-muted-foreground">
              Distribuição de responsabilidade por ferramentas atualmente em posse de equipes externas
            </p>
          </div>
          <div className="h-64 w-full">
            {dadosPorResponsavel.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Nenhum equipamento retirado atualmente
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosPorResponsavel} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                  <XAxis dataKey="nome" stroke="var(--color-muted-foreground, #888)" fontSize={11} />
                  <YAxis stroke="var(--color-muted-foreground, #888)" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-card, #fff)', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  <Bar dataKey="quantidade" name="Equipamentos sob posse" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <ChartStorytellingNote
            oQueAconteceu={
              dadosPorResponsavel[0]
                ? `'${dadosPorResponsavel[0].nome}' é o colaborador com maior quantidade de ferramentas em custódia (${dadosPorResponsavel[0].quantidade} itens).`
                : 'Nenhum equipamento pendente de devolução em campo.'
            }
            impacto="A retenção prolongada de maquinários com um único responsável sem registro de avanço de obra prejudica outras equipes."
            acaoRecomendada="Auditar quinzenalmente o estado físico e a real necessidade dos equipamentos alocados com os encarregados líderes."
            destaque={dadosPorResponsavel.length > 0 ? 'info' : 'sucesso'}
          />
        </div>
      </div>
    </div>
  );
}
