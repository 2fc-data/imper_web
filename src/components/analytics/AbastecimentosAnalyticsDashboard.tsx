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
import type { AbastecimentoItem, VeiculoItem } from '../../lib/api';
import {
  AnalyticsFilterBar,
  type FiltrosAnalyticsState,
} from './AnalyticsFilterBar';
import { exportarCsv, exportarPdfRelatorio } from './exportReport';
import { KpiCard } from './KpiCard';
import { StorytellingPanel } from './StorytellingPanel';
import { ChartStorytellingNote } from './ChartStorytellingNote';

const CORES_PALETA = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

interface AbastecimentosAnalyticsDashboardProps {
  abastecimentos: AbastecimentoItem[];
  veiculos: VeiculoItem[];
}

export function AbastecimentosAnalyticsDashboard({
  abastecimentos,
  veiculos,
}: AbastecimentosAnalyticsDashboardProps) {
  const [filtros, setFiltros] = useState<FiltrosAnalyticsState>({
    periodo: '30d',
  });

  // Filtragem
  const abastecimentosFiltrados = useMemo(() => {
    const agora = new Date();
    return abastecimentos.filter((a) => {
      const dataItem = new Date(a.data);

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

      if (filtros.categoria && String(a.veiculoId) !== filtros.categoria) return false;

      return true;
    });
  }, [abastecimentos, filtros]);

  // KPIs
  const totalAbastecimentos = abastecimentosFiltrados.length;
  const valorTotalGasto = abastecimentosFiltrados.reduce(
    (acc, a) => acc + Number(a.valorTotal || 0),
    0,
  );
  const totalLitros = abastecimentosFiltrados.reduce(
    (acc, a) => acc + Number(a.litros || 0),
    0,
  );
  const precoMedioLitro = totalLitros > 0 ? valorTotalGasto / totalLitros : 0;
  const ticketMedioAbastecimento =
    totalAbastecimentos > 0 ? valorTotalGasto / totalAbastecimentos : 0;

  // Gráfico 1: Evolução de Gastos Diários (R$)
  const dadosEvolucao = useMemo(() => {
    const agrupado: Record<string, { data: string; valor: number; litros: number }> = {};
    abastecimentosFiltrados.forEach((a) => {
      const d = new Date(a.data);
      const chave = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!agrupado[chave]) {
        agrupado[chave] = { data: chave, valor: 0, litros: 0 };
      }
      agrupado[chave].valor += Number(a.valorTotal || 0);
      agrupado[chave].litros += Number(a.litros || 0);
    });
    return Object.values(agrupado);
  }, [abastecimentosFiltrados]);

  // Gráfico 2: Gasto por Veículo (Barras)
  const dadosPorVeiculo = useMemo(() => {
    const agrupado: Record<string, number> = {};
    abastecimentosFiltrados.forEach((a) => {
      const nomeVeiculo =
        a.veiculo?.placa ||
        veiculos.find((v) => v.id === a.veiculoId)?.placa ||
        `Veículo #${a.veiculoId}`;
      agrupado[nomeVeiculo] = (agrupado[nomeVeiculo] || 0) + Number(a.valorTotal || 0);
    });
    return Object.entries(agrupado)
      .map(([placa, valor]) => ({ placa, valor }))
      .sort((a, b) => b.valor - a.valor);
  }, [abastecimentosFiltrados, veiculos]);

  // Gráfico 3: Consumo em Litros por Motorista (Pizza)
  const dadosPorMotorista = useMemo(() => {
    const agrupado: Record<string, number> = {};
    abastecimentosFiltrados.forEach((a) => {
      const nome = a.motorista?.nome || 'Não informado';
      agrupado[nome] = (agrupado[nome] || 0) + Number(a.litros || 0);
    });
    return Object.entries(agrupado)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [abastecimentosFiltrados]);

  // Storytelling Dinâmico
  const storytelling = useMemo(() => {
    const topVeic = dadosPorVeiculo[0];
    const topMot = dadosPorMotorista[0];
    const percentTopVeic = valorTotalGasto > 0 && topVeic ? ((topVeic.valor / valorTotalGasto) * 100).toFixed(1) : '0';

    let statusGeral: 'otimo' | 'atencao' | 'critico' | 'estavel' = 'estavel';
    if (precoMedioLitro > 6.8) statusGeral = 'atencao';
    else if (totalAbastecimentos > 0) statusGeral = 'otimo';

    const cenario = [
      `Custo total com combustíveis de R$ ${valorTotalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para ${totalLitros.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} litros em ${totalAbastecimentos} abastecimentos.`,
      `Preço médio apurado na bomba em R$ ${precoMedioLitro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/litro com ticket médio de R$ ${ticketMedioAbastecimento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
      topVeic ? `Veículo '${topVeic.placa}' lidera o consumo acumulando ${percentTopVeic}% dos gastos de combustível.` : 'Gastos diluídos na frota.',
    ];

    const diagnostico = [
      topVeic
        ? `Consumo concentrado na placa '${topVeic.placa}' (R$ ${topVeic.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}). Requer verificação da média de km/L para identificar possíveis desregulagens mecânicas.`
        : `Consumo proporcional à quilometragem rodada por cada unidade.`,
      topMot
        ? `Condutor '${topMot.name}' gerencia o maior volume físico (${topMot.value.toFixed(1)} L), condizente com a rotina de deslocamento da frente operacional.`
        : `Distribuição regular de abastecimento entre os motoristas.`,
      precoMedioLitro > 6.5
        ? `Preço por litro acima da média regional: ausência de convênio fixo com rede credenciada de postos encarece a operação.`
        : `Valores de abastecimento alinhados com os preços de mercado vigentes.`,
    ];

    const recomendacoes = [
      `Firmar convênio com rede de postos com desconto garantido por litro ou cartão combustível corporativo para eliminar notas avulsas.`,
      topVeic ? `Avaliar manutenção do sistema de injeção e pneus do veículo '${topVeic.placa}' para otimizar a eficiência energética.` : `Monitorar médias semanais de consumo km/litro por categoria de veículo.`,
      `Exigir o registro rigoroso do odômetro a cada abastecimento para cruzamento de dados com o odômetro diário.`,
    ];

    const resumoExecutivo = totalAbastecimentos > 0
      ? `Desembolso de R$ ${valorTotalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em combustível com preço médio de R$ ${precoMedioLitro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/L. Acompanhar eficiência por placa.`
      : `Nenhum abastecimento registrado no intervalo de datas selecionado.`;

    return { statusGeral, resumoExecutivo, cenario, diagnostico, recomendacoes };
  }, [valorTotalGasto, totalLitros, totalAbastecimentos, precoMedioLitro, ticketMedioAbastecimento, dadosPorVeiculo, dadosPorMotorista]);

  // Exportações
  const handleExportarCsv = () => {
    const colunas = ['ID', 'Veículo Placa', 'Motorista', 'Litros', 'Valor Total (R$)', 'Odômetro (km)', 'Data'];
    const linhas = abastecimentosFiltrados.map((a) => [
      a.id,
      a.veiculo?.placa || veiculos.find((v) => v.id === a.veiculoId)?.placa || `#${a.veiculoId}`,
      a.motorista?.nome ?? 'Não informado',
      Number(a.litros || 0).toFixed(2),
      Number(a.valorTotal || 0).toFixed(2),
      a.odometro ?? '—',
      new Date(a.data).toLocaleDateString('pt-BR'),
    ]);
    exportarCsv('relatorio_abastecimentos_frota', colunas, linhas);
  };

  const handleExportarPdf = () => {
    const colunas = ['ID', 'Veículo', 'Motorista', 'Litros', 'Valor (R$)', 'Data'];
    const linhas = abastecimentosFiltrados.map((a) => [
      a.id,
      a.veiculo?.placa || veiculos.find((v) => v.id === a.veiculoId)?.placa || `#${a.veiculoId}`,
      a.motorista?.nome ?? 'Não informado',
      `${Number(a.litros || 0).toFixed(1)} L`,
      `R$ ${Number(a.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      new Date(a.data).toLocaleDateString('pt-BR'),
    ]);
    const kpis = [
      {
        rotulo: 'Total Gasto',
        valor: `R$ ${valorTotalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      },
      { rotulo: 'Litros Abastecidos', valor: `${totalLitros.toFixed(1)} L` },
      {
        rotulo: 'Preço Médio / L',
        valor: `R$ ${precoMedioLitro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      },
      { rotulo: 'Abastecimentos', valor: totalAbastecimentos },
    ];
    exportarPdfRelatorio(
      'Relatório de Abastecimentos da Frota',
      'Despesas de Combustível, Volume de Abastecimento e Consumo',
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
          Painel Executivo de Abastecimentos da Frota
        </h2>
        <p className="text-sm text-muted-foreground">
          Controle de combustível, gastos financeiros por veículo e volume abastecido.
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          titulo="Total Gasto com Combustível"
          valor={`R$ ${valorTotalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitulo={`${totalAbastecimentos} abastecimentos no período`}
          destaque="warning"
          icone={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          }
        />
        <KpiCard
          titulo="Volume Total Abastecido"
          valor={`${totalLitros.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} L`}
          subtitulo="Combustível injetado na frota"
          destaque="info"
          icone={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
        <KpiCard
          titulo="Preço Médio por Litro"
          valor={`R$ ${precoMedioLitro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitulo="Custo médio apurado"
          destaque="default"
          icone={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <KpiCard
          titulo="Ticket Médio"
          valor={`R$ ${ticketMedioAbastecimento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitulo="Média por parada no posto"
          destaque="success"
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

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gráfico 1: Evolução Financeira */}
        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
          <div>
            <h3 className="font-semibold text-base text-foreground">Gastos de Combustível no Tempo (R$)</h3>
            <p className="text-xs text-muted-foreground">Evolução diária dos valores pagos em abastecimentos</p>
          </div>
          <div className="h-72 w-full">
            {dadosEvolucao.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Nenhum abastecimento no período selecionado.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dadosEvolucao} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="corCombustivel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val) => [
                      `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                      'Gasto',
                    ]}
                    contentStyle={{ backgroundColor: 'var(--color-card, #fff)', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="valor" name="Gasto Total" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#corCombustivel)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <ChartStorytellingNote
            oQueAconteceu={`Evolução diária de despesas com combustível somando R$ ${valorTotalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`}
            impacto="Surtos de gasto em datas isoladas indicam viagens longas de equipes ou múltiplos abastecimentos simultâneos."
            acaoRecomendada="Acompanhar o planejamento de rotas e sincronizar trajetos para reduzir quilômetros desnecessários."
            destaque={valorTotalGasto > 0 ? 'info' : 'neutro'}
          />
        </div>

        {/* Gráfico 2: Gastos por Veículo */}
        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
          <div>
            <h3 className="font-semibold text-base text-foreground">Gasto Acumulado por Veículo (R$)</h3>
            <p className="text-xs text-muted-foreground">Veículos com maior demanda de abastecimento</p>
          </div>
          <div className="h-72 w-full">
            {dadosPorVeiculo.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Nenhum dado registrado.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosPorVeiculo} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="placa" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val) => [
                      `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                      'Total Gasto',
                    ]}
                    contentStyle={{ backgroundColor: 'var(--color-card, #fff)', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="valor" name="Gasto" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <ChartStorytellingNote
            oQueAconteceu={
              dadosPorVeiculo[0]
                ? `O veículo '${dadosPorVeiculo[0].placa}' registrou o maior dispêndio financeiro (R$ ${dadosPorVeiculo[0].valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).`
                : 'Consumo homogêneo na frota.'
            }
            impacto="Veículos com custo fora do padrão podem apresentar vazamentos, hábitos de condução agressivos ou pneus descalibrados."
            acaoRecomendada="Confrontar a quilometragem percorrida no período com a litragem abastecida para apurar o consumo real em km/litro."
            destaque={dadosPorVeiculo.length > 0 ? 'info' : 'neutro'}
          />
        </div>

        {/* Gráfico 3: Consumo em Litros por Motorista */}
        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4 lg:col-span-2">
          <div>
            <h3 className="font-semibold text-base text-foreground">Distribuição de Litros por Motorista</h3>
            <p className="text-xs text-muted-foreground">Volume de combustível administrado por cada condutor</p>
          </div>
          <div className="h-64 w-full">
            {dadosPorMotorista.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Nenhum dado registrado.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosPorMotorista}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {dadosPorMotorista.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CORES_PALETA[index % CORES_PALETA.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [`${Number(val).toFixed(1)} Litros`, 'Volume']}
                    contentStyle={{ backgroundColor: 'var(--color-card, #fff)', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <ChartStorytellingNote
            oQueAconteceu={
              dadosPorMotorista[0]
                ? `'${dadosPorMotorista[0].name}' foi responsável pelo maior volume de combustível abastecido.`
                : 'Abastecimentos distribuídos igualmente.'
            }
            impacto="A concentração em motoristas específicos reflete a alocação nas obras mais distantes ou com rotinas intensivas de transporte."
            acaoRecomendada="Instruir boas práticas de direção econômica (condução suave, calibração semanal e desligamento em paradas longas)."
            destaque={dadosPorMotorista.length > 0 ? 'info' : 'neutro'}
          />
        </div>
      </div>
    </div>
  );
}

