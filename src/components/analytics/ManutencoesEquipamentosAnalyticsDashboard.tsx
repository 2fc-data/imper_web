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
import type { ManutencaoItem } from '../../lib/api';
import {
  AnalyticsFilterBar,
  type FiltrosAnalyticsState,
} from './AnalyticsFilterBar';
import { exportarCsv, exportarPdfRelatorio } from './exportReport';
import { KpiCard } from './KpiCard';
import { StorytellingPanel } from './StorytellingPanel';
import { ChartStorytellingNote } from './ChartStorytellingNote';

const CORES_PALETA = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

const STATUS_LABEL: Record<string, string> = {
  PENDENTE: 'Pendente',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

interface ManutencoesEquipamentosAnalyticsDashboardProps {
  manutencoes: ManutencaoItem[];
}

export function ManutencoesEquipamentosAnalyticsDashboard({
  manutencoes,
}: ManutencoesEquipamentosAnalyticsDashboardProps) {
  const [filtros, setFiltros] = useState<FiltrosAnalyticsState>({
    periodo: '30d',
  });

  // Filtragem
  const manutencoesFiltradas = useMemo(() => {
    const agora = new Date();
    return manutencoes.filter((m) => {
      // Período
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

      // Status
      if (filtros.status && m.status !== filtros.status) {
        return false;
      }

      // Categoria (Tipo de manutenção)
      if (filtros.categoria && String(m.tipoId) !== filtros.categoria) {
        return false;
      }

      // Busca textual
      if (filtros.busca) {
        const texto = filtros.busca.toLowerCase();
        const desc = m.descricao.toLowerCase();
        const equip = (m.equipamento?.descricao || '').toLowerCase();
        const cod = (m.equipamento?.codigo || '').toLowerCase();
        const tipo = (m.tipo?.nome || '').toLowerCase();
        if (
          !desc.includes(texto) &&
          !equip.includes(texto) &&
          !cod.includes(texto) &&
          !tipo.includes(texto)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [manutencoes, filtros]);

  // Tipos únicos para o filtro
  const opcoesTipos = useMemo(() => {
    const mapa = new Map<number, string>();
    manutencoes.forEach((m) => {
      if (m.tipo) {
        mapa.set(m.tipo.id, m.tipo.nome);
      }
    });
    return Array.from(mapa.entries()).map(([valor, rotulo]) => ({
      valor: String(valor),
      rotulo,
    }));
  }, [manutencoes]);

  // KPIs
  const custoTotal = useMemo(
    () => manutencoesFiltradas.reduce((acc, m) => acc + (m.custo ?? 0), 0),
    [manutencoesFiltradas],
  );

  const totalOrdens = manutencoesFiltradas.length;

  const custoMedio = totalOrdens > 0 ? custoTotal / totalOrdens : 0;

  const emAberto = useMemo(
    () => manutencoesFiltradas.filter((m) => m.status === 'PENDENTE' || m.status === 'EM_ANDAMENTO').length,
    [manutencoesFiltradas],
  );

  // Gráfico 1: Evolução Temporal dos Custos (Área)
  const dadosEvolucaoCustos = useMemo(() => {
    const agrupado: Record<string, { data: string; custo: number; ordens: number }> = {};
    manutencoesFiltradas.forEach((m) => {
      const d = new Date(m.data);
      const chave = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!agrupado[chave]) {
        agrupado[chave] = { data: chave, custo: 0, ordens: 0 };
      }
      agrupado[chave].custo += m.custo ?? 0;
      agrupado[chave].ordens += 1;
    });
    return Object.values(agrupado);
  }, [manutencoesFiltradas]);

  // Gráfico 2: Top Equipamentos por Custo de Manutenção (Barras Horizontais)
  const topEquipamentosCusto = useMemo(() => {
    const agrupado: Record<string, number> = {};
    manutencoesFiltradas.forEach((m) => {
      const nome = m.equipamento ? `${m.equipamento.codigo || ''} - ${m.equipamento.descricao}` : `Equipamento #${m.equipamentoId}`;
      agrupado[nome] = (agrupado[nome] || 0) + (m.custo ?? 0);
    });
    return Object.entries(agrupado)
      .map(([nome, custo]) => ({
        nome: nome.length > 22 ? `${nome.slice(0, 20)}...` : nome,
        nomeCompleto: nome,
        custo,
      }))
      .filter((x) => x.custo > 0)
      .sort((a, b) => b.custo - a.custo)
      .slice(0, 8);
  }, [manutencoesFiltradas]);

  // Gráfico 3: Ordens por Tipo de Manutenção (Donut)
  const dadosPorTipo = useMemo(() => {
    const agrupado: Record<string, number> = {};
    manutencoesFiltradas.forEach((m) => {
      const nome = m.tipo?.nome || 'Geral / Corretiva';
      agrupado[nome] = (agrupado[nome] || 0) + 1;
    });
    return Object.entries(agrupado)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [manutencoesFiltradas]);

  // Storytelling Dinâmico
  const storytelling = useMemo(() => {
    const topItem = topEquipamentosCusto[0];
    const topTipo = dadosPorTipo[0];

    let statusGeral: 'otimo' | 'atencao' | 'critico' | 'estavel' = 'estavel';
    if (emAberto > 5) statusGeral = 'critico';
    else if (emAberto > 0) statusGeral = 'atencao';
    else if (totalOrdens > 0) statusGeral = 'otimo';

    const cenario = [
      `Gastos acumulados em reparos somam R$ ${custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em ${totalOrdens} ordens de serviço.`,
      `Ticket médio de reparo em R$ ${custoMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} por intervenção técnica.`,
      `${emAberto} ordens de serviço continuam em aberto (pendentes ou em andamento).`,
    ];

    const diagnostico = [
      emAberto > 0
        ? `Oficina com demanda reprimida: ${emAberto} ferramentas imobilizadas aguardando peças ou aprovação de conserto.`
        : `Oficina e manutenção operando com 100% das demandas concluídas.`,
      topItem
        ? `Item mais custoso: '${topItem.nomeCompleto}' acumula sozinho R$ ${topItem.custo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em reparos. Avaliar se o conserto já superou o valor venal do ativo.`
        : `Custos de manutenção distribuídos de forma equilibrada entre os maquinários.`,
      topTipo
        ? `Predomínio de intervenções do tipo '${topTipo.name}' (${topTipo.value} ordens).`
        : `Mix de manutenções balanceado.`,
    ];

    const recomendacoes = [
      emAberto > 0
        ? `Cobrar parecer da assistência técnica para liberar com urgência as ${emAberto} ordens em aberto.`
        : `Manter a rotina de limpeza e testes rápidos após a devolução das ferramentas na base.`,
      topItem && topItem.custo > 1500
        ? `Analisar histórico técnico de '${topItem.nomeCompleto}' e calcular o Payback de substituição por um equipamento novo com garantia.`
        : `Reforçar o treinamento de uso correto das ferramentas elétricas junto aos operadores de campo.`,
      `Instituir plano de lubrificação e troca periódica de carvão/filtros para diminuir as quebras corretivas não programadas.`,
    ];

    const resumoExecutivo = emAberto > 3
      ? `Atenção: ${emAberto} ordens em aberto geram indisponibilidade no canteiro. Necessário agilizar diagnósticos das oficinas terceirizadas.`
      : totalOrdens > 0
      ? `Custo total de R$ ${custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} com acompanhamento regular de reparos e vida útil das máquinas.`
      : `Nenhum custo relevante de manutenção registrado no período analisado.`;

    return { statusGeral, resumoExecutivo, cenario, diagnostico, recomendacoes };
  }, [custoTotal, totalOrdens, custoMedio, emAberto, topEquipamentosCusto, dadosPorTipo]);

  // Exportações
  const handleExportarCsv = () => {
    const colunas = ['ID', 'Data', 'Equipamento', 'Tipo', 'Status', 'Responsável', 'Custo (R$)'];
    const linhas = manutencoesFiltradas.map((m) => [
      m.id,
      new Date(m.data).toLocaleDateString('pt-BR'),
      m.equipamento?.descricao ?? `#${m.equipamentoId}`,
      m.tipo?.nome ?? '—',
      STATUS_LABEL[m.status] ?? m.status,
      m.responsavelManutencao?.nome ?? '—',
      (m.custo ?? 0).toFixed(2),
    ]);
    exportarCsv('relatorio_manutencoes_equipamentos', colunas, linhas);
  };

  const handleExportarPdf = () => {
    const colunas = ['Data', 'Equipamento', 'Tipo', 'Status', 'Custo'];
    const linhas = manutencoesFiltradas.map((m) => [
      new Date(m.data).toLocaleDateString('pt-BR'),
      m.equipamento?.descricao ?? `#${m.equipamentoId}`,
      m.tipo?.nome ?? '—',
      STATUS_LABEL[m.status] ?? m.status,
      `R$ ${(m.custo ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    ]);
    const kpis = [
      {
        rotulo: 'Custo Total',
        valor: `R$ ${custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      },
      { rotulo: 'Ordens Realizadas', valor: `${totalOrdens} manutenções` },
      {
        rotulo: 'Custo Médio / Ordem',
        valor: `R$ ${custoMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      },
      { rotulo: 'Em Aberto', valor: `${emAberto} ordens` },
    ];
    exportarPdfRelatorio(
      'Relatório de Manutenção de Equipamentos & Ferramentas',
      'Custos com Reparos, Manutenções Preventivas e Corretivas do Patrimônio',
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
          Painel Executivo de Manutenção de Equipamentos
        </h2>
        <p className="text-sm text-muted-foreground">
          Acompanhamento de custos de conserto, reparos preventivos e histórico de intervenções nas máquinas.
        </p>
      </div>

      {/* Barra de Filtros */}
      <AnalyticsFilterBar
        filtros={filtros}
        onChange={setFiltros}
        labelCategoria="Tipo"
        opcoesCategoria={opcoesTipos}
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
          titulo="Custo Total em Reparos"
          valor={`R$ ${custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitulo="Gastos acumulados em manutenção"
          destaque="primary"
        />
        <KpiCard
          titulo="Total de Ordens"
          valor={totalOrdens}
          subtitulo="Manutenções no período selecionado"
          destaque="default"
        />
        <KpiCard
          titulo="Custo Médio / Ordem"
          valor={`R$ ${custoMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitulo="Média por equipamento atendido"
          destaque="default"
        />
        <KpiCard
          titulo="Ordens em Aberto"
          valor={emAberto}
          subtitulo="Pendentes e em andamento"
          destaque={emAberto > 0 ? 'warning' : 'default'}
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
        {/* Evolução de Custos */}
        <div className="rounded-xl border bg-card p-5 shadow-2xs">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-foreground">
              Evolução Temporal dos Custos (R$)
            </h3>
            <p className="text-xs text-muted-foreground">
              Desembolsos diários realizados em reparos e peças
            </p>
          </div>
          <div className="h-72 w-full">
            {dadosEvolucaoCustos.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Nenhum custo registrado no período
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dadosEvolucaoCustos} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="corCustoEquip" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                  <XAxis dataKey="data" stroke="var(--color-muted-foreground, #888)" fontSize={11} />
                  <YAxis
                    stroke="var(--color-muted-foreground, #888)"
                    fontSize={11}
                    tickFormatter={(v) => `R$ ${v}`}
                  />
                  <Tooltip
                    formatter={(valor: any) => [
                      `R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                      'Custo',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="custo"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#corCustoEquip)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <ChartStorytellingNote
            oQueAconteceu={`Desembolso total de R$ ${custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} distribuído ao longo do período selecionado.`}
            impacto="Picos abruptos de custo no gráfico sinalizam quebras inesperadas ou queima de motores de equipamentos de grande porte."
            acaoRecomendada="Suavizar a curva de gastos adotando manutenções preventivas programadas em vez de reparos emergenciais pós-falha."
            destaque={custoTotal > 0 ? 'info' : 'neutro'}
          />
        </div>

        {/* Tipos de Manutenção */}
        <div className="rounded-xl border bg-card p-5 shadow-2xs">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-foreground">
              Distribuição por Tipo de Manutenção
            </h3>
            <p className="text-xs text-muted-foreground">
              Volume de manutenções preventivas vs corretivas
            </p>
          </div>
          <div className="h-72 w-full">
            {dadosPorTipo.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Nenhuma manutenção registrada
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
                      <Cell key={`cell-tipo-man-${index}`} fill={CORES_PALETA[index % CORES_PALETA.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [
                      `${Number(val).toLocaleString('pt-BR')} ordens`,
                      'Quantidade',
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
                ? `O tipo de intervenção '${dadosPorTipo[0].name}' é o mais recorrente com ${dadosPorTipo[0].value} ordens de serviço.`
                : 'Sem manutenções no período.'
            }
            impacto="Predomínio de manutenções corretivas sobre preventivas indica cultura reativa, aumentando paradas não programadas em canteiro."
            acaoRecomendada="Inverter a proporção para atingir a meta de 70% preventiva e 30% corretiva na frota de ferramentas."
            destaque={dadosPorTipo.length > 0 ? 'info' : 'neutro'}
          />
        </div>

        {/* Top Equipamentos com Maior Custo */}
        <div className="rounded-xl border bg-card p-5 shadow-2xs lg:col-span-2">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-foreground">
              Top Equipamentos com Maior Custo Acumulado (R$)
            </h3>
            <p className="text-xs text-muted-foreground">
              Ferramentas e máquinas que geraram maior despesa em manutenções
            </p>
          </div>
          <div className="h-72 w-full">
            {topEquipamentosCusto.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Sem custos registrados nos equipamentos
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topEquipamentosCusto} layout="vertical" margin={{ left: 10, right: 20 }}>
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
                    width={130}
                  />
                  <Tooltip
                    formatter={(valor: any) => [
                      `R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                      'Custo Total',
                    ]}
                  />
                  <Bar dataKey="custo" radius={[0, 6, 6, 0]}>
                    {topEquipamentosCusto.map((_, index) => (
                      <Cell key={`cell-top-eq-${index}`} fill={CORES_PALETA[index % CORES_PALETA.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <ChartStorytellingNote
            oQueAconteceu={
              topEquipamentosCusto[0]
                ? `'${topEquipamentosCusto[0].nomeCompleto}' lidera as despesas acumulando R$ ${topEquipamentosCusto[0].custo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em consertos.`
                : 'Custos de manutenção homogêneos.'
            }
            impacto="Equipamentos que acumulam custos de manutenção repetitivos consomem recursos que justificariam a compra de um ativo novo com garantia de fábrica."
            acaoRecomendada="Instaurar teto de despesa acumulada por ferramenta (máximo de 50% do valor de aquisição novo antes de sucatear)."
            destaque={topEquipamentosCusto.length > 0 ? 'info' : 'neutro'}
          />
        </div>
      </div>
    </div>
  );
}
