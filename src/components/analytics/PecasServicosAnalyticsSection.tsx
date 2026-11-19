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
import type { AnalisePecasServicos, MixItem } from './pecasServicosAnalytics';
import { ChartStorytellingNote } from './ChartStorytellingNote';

const CORES_ACAO: Record<string, string> = {
  TROCADA: '#3b82f6',
  CONSERTADA: '#10b981',
};

const CORES_ORIGEM: Record<string, string> = {
  ORIGINAL_NOVA: '#3b82f6',
  ORIGINAL_USADA: '#0ea5e9',
  GENERICA_NOVA: '#f59e0b',
  GENERICA_USADA: '#f97316',
  NAO_INFORMADA: '#94a3b8',
};

const PALETA = ['#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#3b82f6'];

function formatarMoeda(valor: number): string {
  return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function percentual(parte: number, total: number): number {
  return total > 0 ? (parte / total) * 100 : 0;
}

function corDoMix(item: MixItem, indice: number, mapa: Record<string, string>): string {
  return mapa[item.chave] ?? PALETA[indice % PALETA.length];
}

function LegendaMix({
  itens,
  cores,
}: {
  itens: MixItem[];
  cores: Record<string, string>;
}) {
  return (
    <ul className="space-y-1.5 text-xs text-muted-foreground">
      {itens.map((item, indice) => (
        <li key={item.chave} className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: corDoMix(item, indice, cores) }}
            />
            <span className="truncate">{item.rotulo}</span>
          </span>
          <span className="shrink-0 font-medium text-foreground">
            {item.quantidade} ({item.percentual.toFixed(0)}%)
          </span>
        </li>
      ))}
    </ul>
  );
}

interface PecasServicosAnalyticsSectionProps {
  analise: AnalisePecasServicos;
}

export function PecasServicosAnalyticsSection({
  analise,
}: PecasServicosAnalyticsSectionProps) {
  const topPeca = analise.topPecasFrequencia[0];
  const topServico = analise.topServicos[0];
  const topTemas = analise.temas.slice(0, 3);

  const quantidadeTrocadas =
    analise.acoes.find((item) => item.chave === 'TROCADA')?.quantidade ?? 0;
  const quantidadeGenericas = analise.origens
    .filter((item) => item.chave.startsWith('GENERICA'))
    .reduce((acc, item) => acc + item.quantidade, 0);
  const percentualGenericas = percentual(quantidadeGenericas, quantidadeTrocadas);

  const resumoPecas = [
    { rotulo: 'Peças registradas', valor: analise.totalPecas.toLocaleString('pt-BR') },
    {
      rotulo: 'Cobertura do detalhamento',
      valor: `${analise.coberturaDetalhamento.toFixed(0)}%`,
    },
    {
      rotulo: 'Peça mais recorrente',
      valor: topPeca ? `${topPeca.descricao} (${topPeca.quantidade}x)` : '—',
    },
    {
      rotulo: 'Serviço mais recorrente',
      valor: topServico ? `${topServico.descricao} (${topServico.ordens}x)` : '—',
    },
  ];

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-foreground">
            Peças & Serviços Recorrentes
          </h3>
          <p className="text-xs text-muted-foreground">
            Padrões de reposição e descrições de serviços das ordens filtradas.
          </p>
        </div>
        {analise.ordensComCustoPecasSemDetalhe > 0 && (
          <span className="w-fit rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
            {analise.ordensComCustoPecasSemDetalhe} ordem(ns) com custo de peças sem detalhamento
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {resumoPecas.map((item) => (
          <div key={item.rotulo} className="rounded-xl border bg-muted/20 px-4 py-3">
            <p className="text-3xs font-semibold uppercase tracking-wide text-muted-foreground">
              {item.rotulo}
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-foreground" title={item.valor}>
              {item.valor}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
          <div>
            <h4 className="font-semibold text-base text-foreground">Peças Mais Trocadas ou Consertadas</h4>
            <p className="text-xs text-muted-foreground">Top peças por quantidade de registros</p>
          </div>
          <div className="h-72 w-full">
            {analise.topPecasFrequencia.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Nenhuma peça detalhada no período.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analise.topPecasFrequencia}
                  layout="vertical"
                  margin={{ top: 4, right: 12, left: 4, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="descricao"
                    width={140}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(valor: string) =>
                      valor.length > 22 ? `${valor.slice(0, 22)}…` : valor
                    }
                  />
                  <Tooltip
                    formatter={(valor) => [`${Number(valor)} un.`, 'Quantidade']}
                    contentStyle={{
                      backgroundColor: 'var(--color-card, #fff)',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="quantidade" name="Quantidade" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <ChartStorytellingNote
            oQueAconteceu={
              topPeca
                ? `'${topPeca.descricao}' lidera com ${topPeca.quantidade} registro(s) em ${topPeca.ordens} ordem(ns), somando ${formatarMoeda(topPeca.valorTotal)}.`
                : 'Nenhuma peça detalhada foi registrada no período.'
            }
            impacto="Peças repetidas indicam desgaste crônico, falha de fornecedor ou necessidade de revisão do plano preventivo."
            acaoRecomendada="Cruzar as peças líderes com o histórico de falhas e avaliar compra recorrente negociada ou substituição do componente."
            destaque={topPeca ? 'alerta' : 'neutro'}
          />
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
          <div>
            <h4 className="font-semibold text-base text-foreground">Ação e Origem das Peças</h4>
            <p className="text-xs text-muted-foreground">
              Troca versus conserto e procedência das peças substituídas
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-semibold text-foreground">Ação</p>
              <div className="h-40">
                {analise.acoes.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    Sem dados.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analise.acoes}
                        dataKey="quantidade"
                        nameKey="rotulo"
                        cx="50%"
                        cy="50%"
                        innerRadius={32}
                        outerRadius={55}
                        paddingAngle={3}
                      >
                        {analise.acoes.map((item, indice) => (
                          <Cell key={item.chave} fill={corDoMix(item, indice, CORES_ACAO)} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(valor, nome) => [`${Number(valor)} peça(s)`, String(nome)]}
                        contentStyle={{
                          backgroundColor: 'var(--color-card, #fff)',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <LegendaMix itens={analise.acoes} cores={CORES_ACAO} />
            </div>

            <div>
              <p className="mb-1 text-xs font-semibold text-foreground">Origem (trocadas)</p>
              <div className="h-40">
                {analise.origens.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    Sem dados.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analise.origens}
                        dataKey="quantidade"
                        nameKey="rotulo"
                        cx="50%"
                        cy="50%"
                        innerRadius={32}
                        outerRadius={55}
                        paddingAngle={3}
                      >
                        {analise.origens.map((item, indice) => (
                          <Cell key={item.chave} fill={corDoMix(item, indice, CORES_ORIGEM)} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(valor, nome) => [`${Number(valor)} peça(s)`, String(nome)]}
                        contentStyle={{
                          backgroundColor: 'var(--color-card, #fff)',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <LegendaMix itens={analise.origens} cores={CORES_ORIGEM} />
            </div>
          </div>
          <ChartStorytellingNote
            oQueAconteceu={`${quantidadeTrocadas} peça(s) foram trocadas e ${analise.acoes.find((item) => item.chave === 'CONSERTADA')?.quantidade ?? 0} peça(s) consertada(s). Entre as trocadas, ${percentualGenericas.toFixed(0)}% são genéricas.`}
            impacto="Alta participação de peças genéricas pode reduzir o custo imediato, mas eleva o risco de reincidência e perda de garantia."
            acaoRecomendada="Comparar custo total de propriedade entre original e genérica e priorizar conserto quando houver garantia técnica equivalente."
            destaque={percentualGenericas > 50 ? 'alerta' : 'info'}
          />
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
          <div>
            <h4 className="font-semibold text-base text-foreground">Serviços Mais Recorrentes</h4>
            <p className="text-xs text-muted-foreground">Agrupamento pela descrição dos serviços</p>
          </div>
          <div className="h-72 w-full">
            {analise.topServicos.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Nenhum serviço descrito no período.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analise.topServicos}
                  layout="vertical"
                  margin={{ top: 4, right: 12, left: 4, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="descricao"
                    width={150}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(valor: string) =>
                      valor.length > 24 ? `${valor.slice(0, 24)}…` : valor
                    }
                  />
                  <Tooltip
                    formatter={(valor) => [`${Number(valor)} ordem(ns)`, 'Frequência']}
                    contentStyle={{
                      backgroundColor: 'var(--color-card, #fff)',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="ordens" name="Ordens" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <ChartStorytellingNote
            oQueAconteceu={
              topServico
                ? `'${topServico.descricao}' concentra ${topServico.ordens} ordem(ns), com custo total de ${formatarMoeda(topServico.custoTotal)} e ticket médio de ${formatarMoeda(topServico.custoMedio)}.`
                : 'Nenhum serviço descrito foi registrado no período.'
            }
            impacto="Descrições muito específicas ou repetidas revelam baixa padronização e dificultam a comparação de custos entre oficinas."
            acaoRecomendada="Criar catálogo de serviços padronizados e vincular os itens mais recorrentes a pacotes de preço com fornecedores."
            destaque="info"
          />
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
          <div>
            <h4 className="font-semibold text-base text-foreground">Temas dos Serviços</h4>
            <p className="text-xs text-muted-foreground">
              Palavras-chave mais presentes nas descrições
            </p>
          </div>
          <div className="h-72 w-full">
            {analise.temas.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Nenhum tema identificado.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analise.temas}
                  layout="vertical"
                  margin={{ top: 4, right: 12, left: 4, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="termo"
                    width={90}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(valor) => [`${Number(valor)} ocorrência(s)`, 'Ocorrências']}
                    contentStyle={{
                      backgroundColor: 'var(--color-card, #fff)',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="ocorrencias" name="Ocorrências" fill="#14b8a6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <ChartStorytellingNote
            oQueAconteceu={
              topTemas.length > 0
                ? `Os temas dominantes são ${topTemas.map((tema) => `'${tema.termo}' (${tema.ocorrencias}x)`).join(', ')}.`
                : 'Não há temas suficientes para identificar um padrão.'
            }
            impacto="Concentração em poucos temas indica foco de desgaste e permite atacar a causa raiz com manutenção preventiva específica."
            acaoRecomendada="Transformar os temas líderes em rotinas de inspeção e reservar estoque mínimo das peças associadas."
            destaque="sucesso"
          />
        </div>
      </div>
    </section>
  );
}
