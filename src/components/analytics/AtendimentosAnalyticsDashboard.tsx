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
import type { AtendimentoItem, CanalAtendimento, StatusAtendimento, Urgencia } from '../../lib/api';
import { CORES_STATUS, ROTULOS_STATUS } from '../../lib/atendimento-status';
import {
  AnalyticsFilterBar,
  type FiltrosAnalyticsState,
} from './AnalyticsFilterBar';
import { exportarCsv, exportarPdfRelatorio } from './exportReport';
import { KpiCard } from './KpiCard';
import { StorytellingPanel } from './StorytellingPanel';
import { ChartStorytellingNote } from './ChartStorytellingNote';

const rotulosCanal: Record<CanalAtendimento, string> = {
  WHATSAPP: 'WhatsApp',
  LOJA: 'Loja Física',
  TELEFONE: 'Telefone',
  FORMULARIO: 'Formulário',
};

const rotulosUrgencia: Record<Urgencia, string> = {
  NORMAL: 'Normal',
  URGENTE: 'Urgente',
  URGENTISSIMO: 'Urgentíssimo',
};

const CORES_CANAIS = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#64748b'];

const CORES_URGENCIA: Record<string, string> = {
  BAIXA: '#94a3b8',
  NORMAL: '#3b82f6',
  URGENTE: '#f59e0b',
  URGENTISSIMO: '#ef4444',
};

interface AtendimentosAnalyticsDashboardProps {
  atendimentos: AtendimentoItem[];
}

export function AtendimentosAnalyticsDashboard({
  atendimentos,
}: AtendimentosAnalyticsDashboardProps) {
  const [filtros, setFiltros] = useState<FiltrosAnalyticsState>({
    periodo: '30d',
  });

  // Filtragem
  const atendimentosFiltrados = useMemo(() => {
    const agora = new Date();
    return atendimentos.filter((item) => {
      const dataItem = new Date(item.createdAt);

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

      if (filtros.status && item.status !== filtros.status) return false;
      if (filtros.categoria && item.canal !== filtros.categoria) return false;

      return true;
    });
  }, [atendimentos, filtros]);

  // KPIs
  const total = atendimentosFiltrados.length;
  const novos = atendimentosFiltrados.filter((c) => c.status === 'NOVO').length;
  const emAndamento = atendimentosFiltrados.filter((c) => c.status === 'EM_ANDAMENTO').length;
  const concluidos = atendimentosFiltrados.filter((c) => c.status === 'CONCLUIDO').length;
  const visitasSolicitadas = atendimentosFiltrados.filter((c) => c.visitaSolicitada).length;

  const taxaConversaoVisita = total > 0 ? Math.round((visitasSolicitadas / total) * 100) : 0;
  const taxaConclusao = total > 0 ? Math.round((concluidos / total) * 100) : 0;

  // Gráfico 1: Evolução Diária de Novos Atendimentos
  const dadosEvolucao = useMemo(() => {
    const agrupado: Record<string, { data: string; total: number; concluidos: number }> = {};
    atendimentosFiltrados.forEach((c) => {
      const d = new Date(c.createdAt);
      const chave = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!agrupado[chave]) {
        agrupado[chave] = { data: chave, total: 0, concluidos: 0 };
      }
      agrupado[chave].total += 1;
      if (c.status === 'CONCLUIDO') agrupado[chave].concluidos += 1;
    });
    return Object.values(agrupado);
  }, [atendimentosFiltrados]);

  // Gráfico 2: Distribuição por Canal (Donut)
  const dadosPorCanal = useMemo(() => {
    const contagem: Record<string, number> = {};
    atendimentosFiltrados.forEach((c) => {
      const canalNome = rotulosCanal[c.canal] ?? c.canal;
      contagem[canalNome] = (contagem[canalNome] || 0) + 1;
    });
    return Object.entries(contagem).map(([name, value]) => ({ name, value }));
  }, [atendimentosFiltrados]);

  // Gráfico 3: Distribuição por Urgência (Barras)
  const dadosPorUrgencia = useMemo(() => {
    const contagem: Record<string, number> = {};
    atendimentosFiltrados.forEach((c) => {
      const u = c.urgencia || 'NORMAL';
      contagem[u] = (contagem[u] || 0) + 1;
    });
    return Object.entries(contagem).map(([urgenciaKey, count]) => ({
      urgencia: rotulosUrgencia[urgenciaKey as Urgencia] ?? urgenciaKey,
      rawKey: urgenciaKey,
      total: count,
    }));
  }, [atendimentosFiltrados]);

  // Storytelling Dinâmico
  const storytelling = useMemo(() => {
    const canalLider = [...dadosPorCanal].sort((a, b) => b.value - a.value)[0];
    const urgentes = atendimentosFiltrados.filter((c) => c.urgencia === 'URGENTE' || c.urgencia === 'URGENTISSIMO').length;
    const percentCanalLider = total > 0 && canalLider ? ((canalLider.value / total) * 100).toFixed(0) : '0';

    let statusGeral: 'otimo' | 'atencao' | 'critico' | 'estavel' = 'estavel';
    if (novos > 8 || urgentes > 5) statusGeral = 'critico';
    else if (novos > 0 || urgentes > 0) statusGeral = 'atencao';
    else if (total > 0 && taxaConversaoVisita >= 40) statusGeral = 'otimo';

    const cenario = [
      `Registrados ${total} atendimentos no período, gerando ${visitasSolicitadas} visitas técnicas solicitadas (${taxaConversaoVisita}% de conversão).`,
      canalLider ? `Canal '${canalLider.name}' é a principal porta de entrada com ${percentCanalLider}% do volume total (${canalLider.value} leads).` : 'Entrada distribuída entre canais.',
      `${novos} novos contatos ainda aguardam triagem/primeiro retorno da equipe comercial.`,
    ];

    const diagnostico = [
      novos > 0
        ? `Gargalo inicial de resposta: ${novos} leads recém-chegados sem contato direto aumentam o risco de esfriamento comercial.`
        : `Fluxo de triagem ágil: todos os atendimentos recentes já foram encaminhados na esteira operacional.`,
      urgentes > 0
        ? `${urgentes} atendimento(s) com nível Urgente/Urgentíssimo requerem prioridade máxima na distribuição de visitas.`
        : `Demanda de chamados dentro dos parâmetros normais de criticidade.`,
    ];

    const recomendacoes = [
      novos > 0
        ? `Realizar mutirão de triagem para zerar a fila de novos leads dentro do SLA de no máximo 2 horas.`
        : `Manter cadência de follow-up com os ${emAndamento} clientes atualmente em andamento.`,
      `Alocar mais atendentes no canal '${canalLider?.name || 'predominante'}' nos horários de maior fluxo diário.`,
    ];

    const resumoExecutivo = total === 0
      ? 'Nenhum atendimento registrado no período selecionado.'
      : `Total de ${total} atendimentos com taxa de conversão em visitas técnicas de ${taxaConversaoVisita}%, tendo '${canalLider?.name || 'canal principal'}' como líder de captação e ${novos} contatos aguardando primeira resposta.`;

    return { statusGeral, cenario, diagnostico, recomendacoes, resumoExecutivo };
  }, [dadosPorCanal, atendimentosFiltrados, total, novos, emAndamento, visitasSolicitadas, taxaConversaoVisita]);

  // Exportações
  const handleExportarCsv = () => {
    const colunas = ['ID', 'Cliente', 'Canal', 'Prioridade', 'Status', 'Visita Solicitada', 'Data'];
    const linhas = atendimentosFiltrados.map((item) => [
      item.id,
      item.user?.nome ?? 'Sem nome',
      rotulosCanal[item.canal] ?? item.canal,
      item.urgencia ? rotulosUrgencia[item.urgencia] ?? item.urgencia : 'Normal',
      ROTULOS_STATUS[item.status] ?? item.status,
      item.visitaSolicitada ? 'Sim' : 'Não',
      new Date(item.createdAt).toLocaleDateString('pt-BR'),
    ]);
    exportarCsv('relatorio_atendimentos', colunas, linhas);
  };

  const handleExportarPdf = () => {
    const colunas = ['ID', 'Cliente', 'Canal', 'Status', 'Visita', 'Data'];
    const linhas = atendimentosFiltrados.map((item) => [
      item.id,
      item.user?.nome ?? 'Sem nome',
      rotulosCanal[item.canal] ?? item.canal,
      ROTULOS_STATUS[item.status] ?? item.status,
      item.visitaSolicitada ? 'Sim' : 'Não',
      new Date(item.createdAt).toLocaleDateString('pt-BR'),
    ]);
    const kpis = [
      { rotulo: 'Total Atendimentos', valor: total },
      { rotulo: 'Novos Leads', valor: novos },
      { rotulo: 'Visitas Solicitadas', valor: `${taxaConversaoVisita}%` },
      { rotulo: 'Taxa Conclusão', valor: `${taxaConclusao}%` },
    ];
    exportarPdfRelatorio(
      'Relatório de Atendimentos',
      'Painel de Atendimentos, Aquisição e Conversão de Leads',
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
          Painel Executivo de Atendimentos
        </h2>
        <p className="text-sm text-muted-foreground">
          Indicadores de entrada de leads, canais de aquisição e conversão em visitas presenciais.
        </p>
      </div>

      {/* Barra de Filtros */}
      <AnalyticsFilterBar
        filtros={filtros}
        onChange={setFiltros}
        labelCategoria="Canal"
        opcoesCategoria={Object.entries(rotulosCanal).map(([valor, rotulo]) => ({
          valor,
          rotulo,
        }))}
        opcoesStatus={Object.entries(ROTULOS_STATUS).map(([valor, rotulo]) => ({
          valor,
          rotulo,
        }))}
        onExportarCsv={handleExportarCsv}
        onExportarPdf={handleExportarPdf}
      />

      {/* Grid de KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          titulo="Total de Atendimentos"
          valor={total}
          subtitulo="Interações registradas no período"
          destaque="default"
          icone={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <KpiCard
          titulo="Novos Leads"
          valor={novos}
          subtitulo="Aguardando 1º contato ou triagem"
          destaque="info"
          variacao={{ valor: `${novos} pendentes`, neutra: true }}
          icone={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        />
        <KpiCard
          titulo="Taxa Conv. Visitas"
          valor={`${taxaConversaoVisita}%`}
          subtitulo={`${visitasSolicitadas} leads geraram visita técnica`}
          destaque="success"
          variacao={{ valor: `${visitasSolicitadas} visitas`, positiva: true }}
          icone={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <KpiCard
          titulo="Em Andamento"
          valor={emAndamento}
          subtitulo="Oportunidades ativas na esteira"
          destaque="warning"
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
        {/* Gráfico 1: Evolução de Leads */}
        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
          <div>
            <h3 className="font-semibold text-base text-foreground">Entrada de Atendimentos</h3>
            <p className="text-xs text-muted-foreground">Volume diário de novos contatos vs concluídos</p>
          </div>
          <div className="h-72 w-full">
            {dadosEvolucao.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Nenhum atendimento no período selecionado.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dadosEvolucao} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="corAtendTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--color-card, #fff)', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="total" name="Total Entrada" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#corAtendTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <ChartStorytellingNote
            oQueAconteceu={`Fluxo cronológico totalizando ${total} interações comerciais no período selecionado.`}
            impacto="Concentrações pontuais em determinados dias exigem plantão ágil de respostas para não perder o momento de compra do cliente."
            acaoRecomendada="Monitorar dias com mais de 5 entradas para alocar atendentes de apoio e garantir primeiro contato em até 15 minutos."
            destaque="info"
          />
        </div>

        {/* Gráfico 2: Canais de Entrada (Donut) */}
        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
          <div>
            <h3 className="font-semibold text-base text-foreground">Canais de Aquisição / Entrada</h3>
            <p className="text-xs text-muted-foreground">Onde os clientes estão buscando contato</p>
          </div>
          <div className="h-72 w-full">
            {dadosPorCanal.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Nenhum dado registrado.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosPorCanal}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {dadosPorCanal.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CORES_CANAIS[index % CORES_CANAIS.length]} />
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
              dadosPorCanal.length > 0
                ? `'${[...dadosPorCanal].sort((a,b)=>b.value-a.value)[0]?.name}' lidera os pontos de contato da empresa.`
                : 'Sem registros de canal.'
            }
            impacto="Dependência excessiva de um único canal expõe a operação a instabilidades externas ou limita a amplitude do público-alvo."
            acaoRecomendada="Fortalecer canais digitais secundários e otimizar campanhas locais para atrair leads de múltiplos pontos de contato."
            destaque="sucesso"
          />
        </div>

        {/* Gráfico 3: Nível de Urgência */}
        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4 lg:col-span-2">
          <div>
            <h3 className="font-semibold text-base text-foreground">Distribuição por Nível de Prioridade</h3>
            <p className="text-xs text-muted-foreground">Volume de atendimentos classificados por urgência</p>
          </div>
          <div className="h-64 w-full">
            {dadosPorUrgencia.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Nenhum dado registrado.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosPorUrgencia} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="urgencia" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--color-card, #fff)', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="total" name="Atendimentos" radius={[6, 6, 0, 0]}>
                    {dadosPorUrgencia.map((entry, index) => (
                      <Cell
                        key={`bar-${index}`}
                        fill={CORES_URGENCIA[entry.rawKey] || '#3b82f6'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <ChartStorytellingNote
            oQueAconteceu={`Classificação de criticidade com foco em chamados que requerem atendimento emergencial ou com risco de infiltração ativa.`}
            impacto="Atendimentos marcados como Urgentes ou Urgentíssimos sem agendamento imediato de visita geram churn e insatisfação grave."
            acaoRecomendada="Criar fila prioritária automática para chamados urgentes garantindo despacho técnico em até 24 horas."
            destaque="alerta"
          />
        </div>
      </div>
    </div>
  );
}
