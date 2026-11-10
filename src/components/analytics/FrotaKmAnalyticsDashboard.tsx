import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { RegistroKmItem, VeiculoItem } from '../../lib/api';
import {
  AnalyticsFilterBar,
  type FiltrosAnalyticsState,
} from './AnalyticsFilterBar';
import { exportarCsv, exportarPdfRelatorio } from './exportReport';
import { KpiCard } from './KpiCard';
import { StorytellingPanel } from './StorytellingPanel';
import { ChartStorytellingNote } from './ChartStorytellingNote';

interface FrotaKmAnalyticsDashboardProps {
  registros: RegistroKmItem[];
  veiculos: VeiculoItem[];
}

export function FrotaKmAnalyticsDashboard({
  registros,
  veiculos,
}: FrotaKmAnalyticsDashboardProps) {
  const [filtros, setFiltros] = useState<FiltrosAnalyticsState>({
    periodo: '30d',
  });

  // Filtragem
  const registrosFiltrados = useMemo(() => {
    const agora = new Date();
    return registros.filter((r) => {
      const dataItem = new Date(r.data);

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

      if (filtros.categoria && String(r.veiculoId) !== filtros.categoria) return false;

      return true;
    });
  }, [registros, filtros]);

  // KPIs
  const totalApontamentos = registrosFiltrados.length;
  const kmRodadosTotal = registrosFiltrados.reduce(
    (acc, r) => acc + Number(r.kmPercorrido || 0),
    0,
  );
  const mediaKmPorDia = totalApontamentos > 0 ? kmRodadosTotal / totalApontamentos : 0;

  // Gráfico 1: Evolução de Km Rodados por Dia
  const dadosEvolucao = useMemo(() => {
    const agrupado: Record<string, { data: string; km: number }> = {};
    registrosFiltrados.forEach((r) => {
      const d = new Date(r.data);
      const chave = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!agrupado[chave]) {
        agrupado[chave] = { data: chave, km: 0 };
      }
      agrupado[chave].km += Number(r.kmPercorrido || 0);
    });
    return Object.values(agrupado);
  }, [registrosFiltrados]);

  // Gráfico 2: Km Rodados por Condutor (Barras)
  const dadosPorCondutor = useMemo(() => {
    const agrupado: Record<string, number> = {};
    registrosFiltrados.forEach((r) => {
      const nome = r.colaborador?.nome || 'Não identificado';
      agrupado[nome] = (agrupado[nome] || 0) + Number(r.kmPercorrido || 0);
    });
    return Object.entries(agrupado)
      .map(([nome, km]) => ({ nome, km }))
      .sort((a, b) => b.km - a.km);
  }, [registrosFiltrados]);

  // Storytelling Dinâmico
  const storytelling = useMemo(() => {
    const topCondutor = dadosPorCondutor[0];
    const percentTopCondutor = kmRodadosTotal > 0 && topCondutor ? ((topCondutor.km / kmRodadosTotal) * 100).toFixed(1) : '0';

    let statusGeral: 'otimo' | 'atencao' | 'critico' | 'estavel' = 'estavel';
    if (totalApontamentos === 0) statusGeral = 'atencao';
    else if (mediaKmPorDia > 180) statusGeral = 'atencao';
    else if (totalApontamentos > 0) statusGeral = 'otimo';

    const cenario = [
      `Frota percorreu ${kmRodadosTotal.toLocaleString('pt-BR')} km distribuídos em ${totalApontamentos} registros no período selecionado.`,
      `Média diária de ${mediaKmPorDia.toFixed(1)} km rodados por apontamento de viagem.`,
      topCondutor ? `Condutor '${topCondutor.nome}' responde por ${percentTopCondutor}% do total quilometrado (${topCondutor.km.toLocaleString('pt-BR')} km).` : 'Quilometragem distribuída igualmente entre os motoristas.',
    ];

    const diagnostico = [
      totalApontamentos === 0
        ? `Ausência de registros: colaboradores podem estar deixando de preencher o odômetro diário ao final do expediente.`
        : mediaKmPorDia > 200
        ? `Alta intensidade de rodagem diária: desgaste acelerado de pneus, freios e aproximação rápida da revisão periódica.`
        : `Rotina de deslocamento compatível com o raio operacional da empresa.`,
      topCondutor
        ? `Frente de trabalho de '${topCondutor.nome}' opera em rota de maior distância ou com múltiplos deslocamentos diários entre canteiros.`
        : `Rotas equilibradas entre as equipes de serviço.`,
    ];

    const recomendacoes = [
      totalApontamentos === 0
        ? `Reforçar obrigatoriedade do apontamento diário de KM para manter o controle de revisões preventivas em dia.`
        : `Acompanhar odômetro total dos veículos para agendamento de troca de óleo a cada 10.000 km.`,
      `Otimizar itinerários agrupando atendimentos por região geográfica para reduzir a quilometragem ociosa.`,
      `Revisar alinhamento e balanceamento dos veículos com maior média de km rodados por dia.`,
    ];

    const resumoExecutivo = totalApontamentos > 0
      ? `Total de ${kmRodadosTotal.toLocaleString('pt-BR')} km percorridos com média de ${mediaKmPorDia.toFixed(1)} km/dia. Deslocamento monitorado e sob controle.`
      : `Nenhum apontamento de KM encontrado para o período ou filtro selecionado.`;

    return { statusGeral, resumoExecutivo, cenario, diagnostico, recomendacoes };
  }, [kmRodadosTotal, totalApontamentos, mediaKmPorDia, dadosPorCondutor]);

  // Exportações
  const handleExportarCsv = () => {
    const colunas = ['ID', 'Data', 'Veículo ID', 'Condutor', 'Odômetro (km)', 'Km Rodados', 'Obs'];
    const linhas = registrosFiltrados.map((r) => [
      r.id,
      new Date(r.data).toLocaleDateString('pt-BR'),
      r.veiculoId,
      r.colaborador?.nome ?? '—',
      r.odometro,
      r.kmPercorrido ?? 0,
      r.observacao ?? '',
    ]);
    exportarCsv('relatorio_km_diario_frota', colunas, linhas);
  };

  const handleExportarPdf = () => {
    const colunas = ['Data', 'Condutor', 'Odômetro', 'Km Rodados', 'Obs'];
    const linhas = registrosFiltrados.map((r) => [
      new Date(r.data).toLocaleDateString('pt-BR'),
      r.colaborador?.nome ?? '—',
      `${r.odometro} km`,
      `${r.kmPercorrido ?? 0} km`,
      r.observacao ?? '',
    ]);
    const kpis = [
      { rotulo: 'Km Total Rodado', valor: `${kmRodadosTotal.toLocaleString('pt-BR')} km` },
      { rotulo: 'Apontamentos', valor: totalApontamentos },
      { rotulo: 'Média / Registro', valor: `${mediaKmPorDia.toFixed(1)} km` },
    ];
    exportarPdfRelatorio(
      'Relatório de Quilometragem Diária da Frota',
      'Deslocamento, Utilização dos Veículos e Apontamentos de Condutores',
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
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Painel Executivo de Quilometragem da Frota
        </h2>
        <p className="text-sm text-muted-foreground">
          Acompanhamento de deslocamento, médias diárias e rodagem por condutor.
        </p>
      </div>

      {/* Barra de Filtros */}
      <AnalyticsFilterBar
        filtros={filtros}
        onChange={setFiltros}
        labelCategoria="Veículo"
        opcoesCategoria={veiculos.map((v) => ({
          valor: String(v.id),
          rotulo: `${v.placa} (${v.modelo})`,
        }))}
        onExportarCsv={handleExportarCsv}
        onExportarPdf={handleExportarPdf}
      />

      {/* Grid de KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          titulo="Quilometragem Total Rodada"
          valor={`${kmRodadosTotal.toLocaleString('pt-BR')} km`}
          subtitulo="Distância acumulada no período"
          destaque="primary"
          icone={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <KpiCard
          titulo="Total de Apontamentos"
          valor={totalApontamentos}
          subtitulo="Registros diários efetuados"
          destaque="info"
          icone={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <KpiCard
          titulo="Média por Apontamento"
          valor={`${mediaKmPorDia.toFixed(1)} km`}
          subtitulo="Média de percurso por diária"
          destaque="success"
          icone={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
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
        {/* Gráfico 1: Evolução Temporal */}
        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
          <div>
            <h3 className="font-semibold text-base text-foreground">Km Rodados por Dia</h3>
            <p className="text-xs text-muted-foreground">Distribuição cronológica do deslocamento da frota</p>
          </div>
          <div className="h-72 w-full">
            {dadosEvolucao.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Nenhum registro no período selecionado.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dadosEvolucao} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="corKm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val) => [`${val} km`, 'Km Rodado']}
                    contentStyle={{ backgroundColor: 'var(--color-card, #fff)', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="km" name="Km Rodado" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#corKm)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <ChartStorytellingNote
            oQueAconteceu={`Registro cronológico de deslocamento acumulando ${kmRodadosTotal.toLocaleString('pt-BR')} km no período analisado.`}
            impacto="Variações bruscas na curva de km diário apontam picos de atendimento ou trajetos extras não programados."
            acaoRecomendada="Confrontar dias de maior quilometragem com a agenda de obras concluídas para validar a rota percorrida."
            destaque={kmRodadosTotal > 0 ? 'info' : 'neutro'}
          />
        </div>

        {/* Gráfico 2: Km por Condutor */}
        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
          <div>
            <h3 className="font-semibold text-base text-foreground">Distância por Condutor (km)</h3>
            <p className="text-xs text-muted-foreground">Volume de quilometragem por colaborador responsável</p>
          </div>
          <div className="h-72 w-full">
            {dadosPorCondutor.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Nenhum dado registrado.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosPorCondutor} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val) => [`${val} km`, 'Deslocamento']}
                    contentStyle={{ backgroundColor: 'var(--color-card, #fff)', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="km" name="Km Rodado" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <ChartStorytellingNote
            oQueAconteceu={
              dadosPorCondutor[0]
                ? `'${dadosPorCondutor[0].nome}' lidera a quilometragem percorrida com ${dadosPorCondutor[0].km} km registrados.`
                : 'Sem registros de condutores.'
            }
            impacto="Motoristas com alta quilometragem concentrada demandam atenção à fadiga e cumprimento de intervalos de descanso."
            acaoRecomendada="Revezar motoristas em rotas de longa distância e promover check-up periódico de ergonomia e segurança veicular."
            destaque={dadosPorCondutor.length > 0 ? 'info' : 'neutro'}
          />
        </div>
      </div>
    </div>
  );
}

