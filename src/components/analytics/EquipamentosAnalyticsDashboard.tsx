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
  const patrimonioTotal = useMemo(
    () => equipamentosFiltrados.reduce((acc, e) => acc + (e.valorAquisicao ?? 0), 0),
    [equipamentosFiltrados],
  );

  const totalEquipamentos = equipamentosFiltrados.length;

  const totalRetirados = useMemo(
    () => equipamentosFiltrados.filter((e) => e.responsavel != null).length,
    [equipamentosFiltrados],
  );

  const totalDisponiveis = totalEquipamentos - totalRetirados;

  const taxaAlocacao = totalEquipamentos > 0 ? (totalRetirados / totalEquipamentos) * 100 : 0;

  // Gráfico 1: Patrimônio por Categoria (Barras Horizontais)
  const dadosPorCategoria = useMemo(() => {
    const agrupado: Record<string, number> = {};
    equipamentosFiltrados.forEach((e) => {
      const cat = e.categoria?.nome || 'Geral / Outros';
      agrupado[cat] = (agrupado[cat] || 0) + (e.valorAquisicao ?? 0);
    });
    return Object.entries(agrupado)
      .map(([nome, valor]) => ({
        nome: nome.length > 20 ? `${nome.slice(0, 18)}...` : nome,
        nomeCompleto: nome,
        valor,
      }))
      .sort((a, b) => b.valor - a.valor);
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
    const percentImobilizadoCat = patrimonioTotal > 0 && topCat ? ((topCat.valor / patrimonioTotal) * 100).toFixed(1) : '0';

    let statusGeral: 'otimo' | 'atencao' | 'critico' | 'estavel' = 'estavel';
    if (totalDisponiveis === 0 && totalEquipamentos > 0) statusGeral = 'critico';
    else if (taxaAlocacao > 80) statusGeral = 'atencao';
    else if (taxaAlocacao > 30) statusGeral = 'otimo';

    const cenario = [
      `Ativo imobilizado totaliza R$ ${patrimonioTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em ${totalEquipamentos} ferramentas e maquinários cadastrados.`,
      `Taxa de utilização de ${taxaAlocacao.toFixed(1)}% com ${totalRetirados} equipamentos em campo e ${totalDisponiveis} disponíveis na base.`,
      topCat ? `Categoria '${topCat.nome}' lidera o patrimônio concentrando ${percentImobilizadoCat}% do valor investido.` : 'Patrimônio diluído entre grupos.',
    ];

    const diagnostico = [
      totalDisponiveis === 0 && totalEquipamentos > 0
        ? `Gargalo crítico: nenhum equipamento de reserva disponível na base para suprir imprevistos ou novas frentes de obra.`
        : taxaAlocacao > 75
        ? `Alta produtividade: parque de equipamentos com ótima taxa de giro e baixa ociosidade.`
        : `Ociosidade patrimonial: parcela significativa de ferramentas paradas na base gerando custo de oportunidade.`,
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
        : `Manter plano de manutenção preventiva para os equipamentos de maior custo de aquisição.`,
      `Padronizar a etiquetagem com QR Code / tombamento de patrimônio para acelerar os check-ins e check-outs.`,
    ];

    const resumoExecutivo = totalDisponiveis === 0 && totalEquipamentos > 0
      ? `Capacidade operacional esgotada com 100% dos equipamentos alocados. Risco de indisponibilidade para novas ordens de serviço.`
      : taxaAlocacao > 75
      ? `Alta ocupação (${taxaAlocacao.toFixed(1)}%) com patrimônio de R$ ${patrimonioTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} gerando produtividade contínua nas obras.`
      : `Parque de ferramentas com margem disponível na base (${totalDisponiveis} itens prontos para retirada).`;

    return { statusGeral, resumoExecutivo, cenario, diagnostico, recomendacoes };
  }, [patrimonioTotal, totalEquipamentos, totalRetirados, totalDisponiveis, taxaAlocacao, dadosPorCategoria, dadosPorResponsavel]);

  // Exportações
  const handleExportarCsv = () => {
    const colunas = [
      'Código',
      'Descrição',
      'Patrimônio',
      'Categoria',
      'Status Operacional',
      'Responsável Atual',
      'Valor Aquisição (R$)',
    ];
    const linhas = equipamentosFiltrados.map((e) => [
      e.codigo,
      e.descricao,
      e.numeroPatrimonio ?? '—',
      e.categoria?.nome ?? '—',
      e.responsavel ? 'EM OBRA' : 'DISPONÍVEL',
      e.responsavel?.nome ?? 'Na base',
      (e.valorAquisicao ?? 0).toFixed(2),
    ]);
    exportarCsv('relatorio_equipamentos_patrimonio', colunas, linhas);
  };

  const handleExportarPdf = () => {
    const colunas = ['Código', 'Descrição', 'Categoria', 'Status', 'Responsável', 'Valor'];
    const linhas = equipamentosFiltrados.map((e) => [
      e.codigo,
      e.descricao,
      e.categoria?.nome ?? '—',
      e.responsavel ? 'Em Obra' : 'Disponível',
      e.responsavel?.nome ?? 'Na base',
      `R$ ${(e.valorAquisicao ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    ]);
    const kpis = [
      {
        rotulo: 'Patrimônio Imobilizado',
        valor: `R$ ${patrimonioTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      },
      { rotulo: 'Total de Equipamentos', valor: `${totalEquipamentos} unidades` },
      { rotulo: 'Em Obra / Retirados', valor: `${totalRetirados} itens` },
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
          Painel Executivo de Equipamentos & Patrimônio
        </h2>
        <p className="text-sm text-muted-foreground">
          Gestão de ativos imobilizados, rastreamento de ferramentas e taxa de utilização em obras.
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
          titulo="Patrimônio Imobilizado"
          valor={`R$ ${patrimonioTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitulo="Valor de aquisição total dos ativos"
          destaque="primary"
        />
        <KpiCard
          titulo="Total de Equipamentos"
          valor={totalEquipamentos}
          subtitulo="Ativos físicos catalogados"
          destaque="default"
        />
        <KpiCard
          titulo="Equipamentos em Campo"
          valor={totalRetirados}
          subtitulo="Alocados em execução de obras"
          destaque={taxaAlocacao > 50 ? 'info' : 'default'}
        />
        <KpiCard
          titulo="Disponíveis na Base"
          valor={totalDisponiveis}
          subtitulo="Prontos para retirada/uso"
          destaque={totalDisponiveis > 0 ? 'success' : 'destructive'}
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
        {/* Patrimônio por Categoria */}
        <div className="rounded-xl border bg-card p-5 shadow-2xs">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-foreground">
              Patrimônio Imobilizado por Categoria (R$)
            </h3>
            <p className="text-xs text-muted-foreground">
              Distribuição de capital investido por grupo de ferramentas
            </p>
          </div>
          <div className="h-72 w-full">
            {dadosPorCategoria.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Sem dados de patrimônio cadastrado
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosPorCategoria} layout="vertical" margin={{ left: 10, right: 20 }}>
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
                      'Patrimônio',
                    ]}
                  />
                  <Bar dataKey="valor" radius={[0, 6, 6, 0]}>
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
                ? `A categoria '${dadosPorCategoria[0].nome}' lidera o capital imobilizado com R$ ${dadosPorCategoria[0].valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`
                : 'Patrimônio homogêneo sem disparidade por categoria.'
            }
            impacto="Maquinários pesados e ferramentas elétricas exigem cronograma rigoroso de lubrificação e calibragem para preservar o valor contábil."
            acaoRecomendada="Elaborar plano de seguro patrimonial para as duas categorias com maior valor acumulado."
            destaque={dadosPorCategoria.length > 0 ? 'info' : 'neutro'}
          />
        </div>

        {/* Status Operacional */}
        <div className="rounded-xl border bg-card p-5 shadow-2xs">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-foreground">
              Status Operacional dos Equipamentos
            </h3>
            <p className="text-xs text-muted-foreground">
              Proporção entre ativos disponíveis na base e alocados em obras
            </p>
          </div>
          <div className="h-72 w-full">
            {dadosStatusOperacional.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
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
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
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
                  />
                  <Legend />
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
        <div className="rounded-xl border bg-card p-5 shadow-2xs lg:col-span-2">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-foreground">
              Equipamentos em Campo por Responsável / Condutor
            </h3>
            <p className="text-xs text-muted-foreground">
              Distribuição de responsabilidade por ferramentas atualmente em posse de equipes externas
            </p>
          </div>
          <div className="h-64 w-full">
            {dadosPorResponsavel.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Nenhum equipamento retirado atualmente
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosPorResponsavel} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                  <XAxis dataKey="nome" stroke="var(--color-muted-foreground, #888)" fontSize={11} />
                  <YAxis stroke="var(--color-muted-foreground, #888)" fontSize={11} />
                  <Tooltip />
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
