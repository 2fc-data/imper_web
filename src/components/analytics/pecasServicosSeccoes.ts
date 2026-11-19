import type { PecaManutencaoItem } from '../../lib/api';
import { ACAO_PECA_LABEL, ORIGEM_PECA_LABEL } from '../../lib/api';
import type { AnalisePecasServicos } from './pecasServicosAnalytics';
import type { SecaoRelatorio } from './exportReport';

export function detalharPecas(
  pecas: PecaManutencaoItem[] | null | undefined,
  limite = 0,
): string {
  if (!pecas || pecas.length === 0) return '—';

  const partes = pecas.map((peca) => {
    const acao = ACAO_PECA_LABEL[peca.acao] ?? peca.acao;
    const origem =
      peca.acao === 'TROCADA'
        ? `, ${peca.origem ? ORIGEM_PECA_LABEL[peca.origem] : 'origem não informada'}`
        : '';
    return `${peca.descricao} (${acao}${origem})`;
  });

  const texto = partes.join('; ');
  return limite > 0 && texto.length > limite ? `${texto.slice(0, limite)}…` : texto;
}

function moeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

export function criarSecoesPecasServicos(
  analise: AnalisePecasServicos,
): SecaoRelatorio[] {
  const secoes: SecaoRelatorio[] = [
    {
      titulo: 'Resumo de Peças e Serviços',
      colunas: ['Indicador', 'Valor'],
      linhas: [
        ['Ordens analisadas', analise.totalOrdens],
        ['Ordens com peças detalhadas', analise.ordensComPecas],
        ['Cobertura do detalhamento (%)', analise.coberturaDetalhamento.toFixed(1)],
        ['Peças registradas', analise.totalPecas],
        ['Custo de peças informado (R$)', moeda(analise.custoPecasInformado)],
        ['Mão de obra informada (R$)', moeda(analise.custoMaoDeObra)],
        ['Custo total das ordens (R$)', moeda(analise.custoTotal)],
        [
          'Ordens com custo de peças sem detalhamento',
          analise.ordensComCustoPecasSemDetalhe,
        ],
        ['Valor de peças sem detalhamento (R$)', moeda(analise.valorPecasSemDetalhe)],
      ],
    },
    {
      titulo: 'Top Peças por Frequência',
      colunas: ['Descrição', 'Quantidade', 'Ordens', 'Trocadas', 'Consertadas', 'Valor (R$)'],
      linhas: analise.topPecasFrequencia.map((peca) => [
        peca.descricao,
        peca.quantidade,
        peca.ordens,
        peca.trocadas,
        peca.consertadas,
        moeda(peca.valorTotal),
      ]),
    },
    {
      titulo: 'Top Peças por Custo',
      colunas: ['Descrição', 'Quantidade', 'Ordens', 'Valor total (R$)'],
      linhas: analise.topPecasCusto.map((peca) => [
        peca.descricao,
        peca.quantidade,
        peca.ordens,
        moeda(peca.valorTotal),
      ]),
    },
    {
      titulo: 'Serviços Mais Recorrentes',
      colunas: ['Descrição dos serviços', 'Ordens', 'Custo total (R$)', 'Custo médio (R$)'],
      linhas: analise.topServicos.map((servico) => [
        servico.descricao,
        servico.ordens,
        moeda(servico.custoTotal),
        moeda(servico.custoMedio),
      ]),
    },
    {
      titulo: 'Mix de Ação e Origem das Peças',
      colunas: ['Grupo', 'Classificação', 'Quantidade', 'Percentual (%)'],
      linhas: [
        ...analise.acoes.map((item) => [
          'Ação',
          item.rotulo,
          item.quantidade,
          item.percentual.toFixed(1),
        ]),
        ...analise.origens.map((item) => [
          'Origem',
          item.rotulo,
          item.quantidade,
          item.percentual.toFixed(1),
        ]),
      ],
    },
    {
      titulo: 'Temas dos Serviços',
      colunas: ['Tema', 'Ocorrências'],
      linhas: analise.temas.map((tema) => [tema.termo, tema.ocorrencias]),
    },
  ];

  return secoes.filter((secao) => secao.linhas.length > 0);
}
