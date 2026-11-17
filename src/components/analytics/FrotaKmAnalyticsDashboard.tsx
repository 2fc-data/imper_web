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

function parseData(val: string): Date {
  if (typeof val === 'string' && val.length >= 10) {
    const y = parseInt(val.slice(0, 4), 10);
    const m = parseInt(val.slice(5, 7), 10) - 1;
    const d = parseInt(val.slice(8, 10), 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m, d, 12, 0, 0);
    }
  }
  return new Date(val);
}

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
      const dataItem = parseData(r.data);

      if (filtros.periodo === '7d') {
        const limite = new Date(agora);
        limite.setDate(limite.getDate() - 7);
        limite.setHours(0, 0, 0, 0);
        if (dataItem < limite) return false;
      } else if (filtros.periodo === '30d') {
        const limite = new Date(agora);
        limite.setDate(limite.getDate() - 30);
        limite.setHours(0, 0, 0, 0);
        if (dataItem < limite) return false;
      } else if (filtros.periodo === '90d') {
        const limite = new Date(agora);
        limite.setDate(limite.getDate() - 90);
        limite.setHours(0, 0, 0, 0);
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

      if (filtros.busca) {
        const termo = filtros.busca.trim().toLowerCase();
        const v = r.veiculo || veiculos.find((x) => x.id === r.veiculoId);
        const matchVeiculo = v ? `${v.nome} ${v.placa}`.toLowerCase().includes(termo) : false;
        const matchCondutor = r.colaborador?.nome.toLowerCase().includes(termo) ?? false;
        const matchObs = r.observacao?.toLowerCase().includes(termo) ?? false;
        if (!matchVeiculo && !matchCondutor && !matchObs) return false;
      }

      return true;
    });
  }, [registros, filtros, veiculos]);

  // KPIs
  const totalApontamentos = registrosFiltrados.length;
  const kmRodadosTotal = registrosFiltrados.reduce(
    (acc, r) => acc + Number(r.kmPercorrido || 0),
    0,
  );
  const mediaKmPorDia = totalApontamentos > 0 ? kmRodadosTotal / totalApontamentos : 0;

  // Gráfico 1: Evolução de Km Rodados por Dia (ordenado cronologicamente)
  const dadosEvolucao = useMemo(() => {
    const agrupado: Record<string, { data: string; km: number; timestamp: number }> = {};
    registrosFiltrados.forEach((r) => {
      const d = parseData(r.data);
      const chave = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!agrupado[chave]) {
        agrupado[chave] = { data: chave, km: 0, timestamp: d.getTime() };
      }
      agrupado[chave].km += Number(r.kmPercorrido || 0);
    });
    return Object.values(agrupado)
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(({ data, km }) => ({ data, km }));
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

  // Gráfico 3: Km por Veículo (Nome + Placa)
  const dadosPorVeiculo = useMemo(() => {
    const agrupado: Record<string, { rotulo: string; nome: string; placa: string; km: number }> = {};
    registrosFiltrados.forEach((r) => {
      const v = r.veiculo || veiculos.find((x) => x.id === r.veiculoId);
      const chave = String(r.veiculoId);
      const nome = v?.nome || `Veículo #${r.veiculoId}`;
      const placa = v?.placa || '';
      const rotulo = placa ? `${nome} — ${placa}` : nome;
      if (!agrupado[chave]) {
        agrupado[chave] = { rotulo, nome, placa, km: 0 };
      }
      agrupado[chave].km += Number(r.kmPercorrido || 0);
    });
    return Object.values(agrupado).sort((a, b) => b.km - a.km);
  }, [registrosFiltrados, veiculos]);

  // Storytelling Dinâmico
  const storytelling = useMemo(() => {
    const topCondutor = dadosPorCondutor[0];
    const topVeiculo = dadosPorVeiculo[0];
    const veiculoFiltroItem = filtros.categoria ? veiculos.find((v) => String(v.id) === filtros.categoria) : null;
    const percentTopCondutor = kmRodadosTotal > 0 && topCondutor ? ((topCondutor.km / kmRodadosTotal) * 100).toFixed(1) : '0';
    const percentTopVeiculo = kmRodadosTotal > 0 && topVeiculo ? ((topVeiculo.km / kmRodadosTotal) * 100).toFixed(1) : '0';

    let statusGeral: 'otimo' | 'atencao' | 'critico' | 'estavel' = 'estavel';
    if (totalApontamentos === 0) statusGeral = 'atencao';
    else if (mediaKmPorDia > 180) statusGeral = 'atencao';
    else if (totalApontamentos > 0) statusGeral = 'otimo';

    const cenario = [
      veiculoFiltroItem
        ? `Veículo '${veiculoFiltroItem.nome} — ${veiculoFiltroItem.placa}' percorreu ${kmRodadosTotal.toLocaleString('pt-BR')} km em ${totalApontamentos} registros no período selecionado.`
        : `Frota percorreu ${kmRodadosTotal.toLocaleString('pt-BR')} km distribuídos em ${totalApontamentos} registros no período selecionado.`,
      `Média diária de ${mediaKmPorDia.toFixed(1)} km rodados por apontamento de viagem.`,
      topVeiculo && !veiculoFiltroItem
        ? `Veículo '${topVeiculo.rotulo}' lidera a rodagem acumulando ${percentTopVeiculo}% do percurso (${topVeiculo.km.toLocaleString('pt-BR')} km).`
        : '',
      topCondutor ? `Condutor '${topCondutor.nome}' responde por ${percentTopCondutor}% do total quilometrado (${topCondutor.km.toLocaleString('pt-BR')} km).` : 'Quilometragem distribuída igualmente entre os motoristas.',
    ].filter(Boolean);

    const diagnostico = [
      totalApontamentos === 0
        ? `Ausência de registros: colaboradores podem estar deixando de preencher o odômetro diário ao final do expediente.`
        : mediaKmPorDia > 200
        ? `Alta intensidade de rodagem diária: desgaste acelerado de pneus, freios e aproximação rápida da revisão periódica.`
        : `Rotina de deslocamento compatível com o raio operacional da empresa.`,
      topVeiculo
        ? `Desgaste operacional concentrado no veículo '${topVeiculo.rotulo}', demandando monitoramento do odômetro.`
        : `Rotas equilibradas entre a frota.`,
      topCondutor
        ? `Frente de trabalho de '${topCondutor.nome}' opera em rota de maior distância ou com múltiplos deslocamentos diários entre canteiros.`
        : `Rotas equilibradas entre as equipes de serviço.`,
    ];

    const recomendacoes = [
      totalApontamentos === 0
        ? `Reforçar obrigatoriedade do apontamento diário de KM para manter o controle de revisões preventivas em dia.`
        : `Acompanhar odômetro total dos veículos para agendamento de troca de óleo a cada 10.000 km.`,
      topVeiculo
        ? `Revisar alinhamento, balanceamento e pneus do veículo '${topVeiculo.rotulo}'.`
        : `Revisar alinhamento e balanceamento dos veículos com maior média de km rodados por dia.`,
      `Otimizar itinerários agrupando atendimentos por região geográfica para reduzir a quilometragem ociosa.`,
    ];

    const resumoExecutivo = totalApontamentos > 0
      ? veiculoFiltroItem
        ? `Veículo ${veiculoFiltroItem.nome} — ${veiculoFiltroItem.placa}: total de ${kmRodadosTotal.toLocaleString('pt-BR')} km percorridos com média de ${mediaKmPorDia.toFixed(1)} km/dia. Deslocamento monitorado e sob controle.`
        : `Total de ${kmRodadosTotal.toLocaleString('pt-BR')} km percorridos com média de ${mediaKmPorDia.toFixed(1)} km/dia. Deslocamento monitorado e sob controle.`
      : `Nenhum apontamento de KM encontrado para o período ou filtro selecionado.`;

    return { statusGeral, resumoExecutivo, cenario, diagnostico, recomendacoes };
  }, [kmRodadosTotal, totalApontamentos, mediaKmPorDia, dadosPorCondutor, dadosPorVeiculo, filtros.categoria, veiculos]);

  // Exportações
  const handleExportarCsv = () => {
    const colunas = ['ID', 'Data', 'Veículo', 'Condutor', 'Odômetro (km)', 'Km Rodados', 'Obs'];
    const linhas = registrosFiltrados.map((r) => {
      const v = r.veiculo || veiculos.find((x) => x.id === r.veiculoId);
      const veicLabel = v ? `${v.nome} — ${v.placa}` : `#${r.veiculoId}`;
      return [
        r.id,
        parseData(r.data).toLocaleDateString('pt-BR'),
        veicLabel,
        r.colaborador?.nome ?? '—',
        r.odometro,
        r.kmPercorrido ?? 0,
        r.observacao ?? '',
      ];
    });
    exportarCsv('relatorio_km_diario_frota', colunas, linhas);
  };

  const handleExportarPdf = () => {
    const colunas = ['Data', 'Veículo', 'Condutor', 'Odômetro', 'Km Rodados', 'Obs'];
    const linhas = registrosFiltrados.map((r) => {
      const v = r.veiculo || veiculos.find((x) => x.id === r.veiculoId);
      const veicLabel = v ? `${v.nome} — ${v.placa}` : `#${r.veiculoId}`;
      return [
        parseData(r.data).toLocaleDateString('pt-BR'),
        veicLabel,
        r.colaborador?.nome ?? '—',
        `${r.odometro} km`,
        `${r.kmPercorrido ?? 0} km`,
        r.observacao ?? '',
      ];
    });
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
          rotulo: `${v.nome} — ${v.placa}`,
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

        {/* Gráfico 3: Km por Veículo */}
        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4 lg:col-span-2">
          <div>
            <h3 className="font-semibold text-base text-foreground">Quilometragem por Veículo (km)</h3>
            <p className="text-xs text-muted-foreground">Distribuição da rodagem entre os veículos da frota</p>
          </div>
          <div className="h-72 w-full">
            {dadosPorVeiculo.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Nenhum dado registrado.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosPorVeiculo} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="rotulo" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val) => [`${val} km`, 'Deslocamento']}
                    contentStyle={{ backgroundColor: 'var(--color-card, #fff)', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="km" name="Km Rodado" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <ChartStorytellingNote
            oQueAconteceu={
              dadosPorVeiculo[0]
                ? `O veículo '${dadosPorVeiculo[0].rotulo}' acumulou o maior trajeto (${dadosPorVeiculo[0].km.toLocaleString('pt-BR')} km).`
                : 'Sem registros veiculares.'
            }
            impacto="Veículos com maior quilometragem aproximam-se mais rapidamente dos prazos de revisão e substituição de consumíveis."
            acaoRecomendada="Verificar alinhamento, balanceamento e cronograma de revisões periódicas do ativo mais exigido."
            destaque={dadosPorVeiculo.length > 0 ? 'info' : 'neutro'}
          />
        </div>
      </div>
    </div>
  );
}

