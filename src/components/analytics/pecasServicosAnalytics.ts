import {
  ACAO_PECA_LABEL,
  ORIGEM_PECA_LABEL,
  type AcaoPecaManutencao,
  type OrigemPecaManutencao,
  type PecaManutencaoItem,
} from '../../lib/api';

export interface ManutencaoParaAnalise {
  descricao?: string | null;
  custo?: number | null;
  custoTotal?: number | null;
  custoPecas?: number | null;
  custoMaoDeObra?: number | null;
  pecas?: PecaManutencaoItem[] | null;
}

export interface PecaResumo {
  chave: string;
  descricao: string;
  quantidade: number;
  valorTotal: number;
  ordens: number;
  trocadas: number;
  consertadas: number;
}

export interface ServicoResumo {
  chave: string;
  descricao: string;
  ordens: number;
  custoTotal: number;
  custoMedio: number;
}

export interface TemaServico {
  termo: string;
  ocorrencias: number;
}

export interface MixItem {
  chave: string;
  rotulo: string;
  quantidade: number;
  percentual: number;
  valorTotal: number;
}

export interface AnalisePecasServicos {
  totalOrdens: number;
  ordensComPecas: number;
  ordensComCustoPecas: number;
  ordensComCustoPecasSemDetalhe: number;
  coberturaDetalhamento: number;
  totalPecas: number;
  valorPecasDetalhado: number;
  valorPecasSemDetalhe: number;
  custoPecasInformado: number;
  custoMaoDeObra: number;
  custoTotal: number;
  pecas: PecaResumo[];
  topPecasFrequencia: PecaResumo[];
  topPecasCusto: PecaResumo[];
  acoes: MixItem[];
  origens: MixItem[];
  servicos: ServicoResumo[];
  topServicos: ServicoResumo[];
  temas: TemaServico[];
}

const LIMITE_PADRAO = 8;
const LIMITE_TEMAS = 10;

const STOPWORDS = new Set([
  'a',
  'ao',
  'aos',
  'as',
  'com',
  'como',
  'da',
  'das',
  'de',
  'do',
  'dos',
  'e',
  'em',
  'entre',
  'essa',
  'esse',
  'esta',
  'este',
  'foi',
  'mais',
  'mas',
  'na',
  'nas',
  'no',
  'nos',
  'o',
  'os',
  'ou',
  'para',
  'por',
  'que',
  'se',
  'sem',
  'ser',
  'sua',
  'suas',
  'seu',
  'seus',
  'um',
  'uma',
  'uns',
  'umas',
  'nao',
  'sim',
  'apos',
  'ate',
  'cerca',
  'sobre',
  'tambem',
  'muito',
  'pouco',
  'todo',
  'toda',
  'todos',
  'todas',
  'dos',
  'das',
  'num',
  'numa',
  'pela',
  'pelo',
  'pelas',
  'pelos',
  'aonde',
  'onde',
  'qual',
  'quais',
  'quando',
  'quanto',
  'quantos',
]);

function semAcento(valor: string): string {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function normalizarDescricao(valor: string | null | undefined): string {
  return semAcento(valor ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function rotuloOriginal(valor: string | null | undefined): string {
  const rotulo = (valor ?? '').trim().replace(/\s+/g, ' ');
  return rotulo || 'Sem descrição';
}

function chaveDescricao(valor: string | null | undefined): string {
  const normalizado = normalizarDescricao(valor);
  return normalizado || 'sem-descricao';
}

function custoDaOrdem(m: ManutencaoParaAnalise): number {
  const pecas = Number(m.custoPecas ?? 0);
  const maoDeObra = Number(m.custoMaoDeObra ?? 0);
  const soma = pecas + maoDeObra;
  if (soma > 0) return soma;
  const total = Number(m.custoTotal ?? 0);
  if (total > 0) return total;
  return Number(m.custo ?? 0);
}

function criarContadorRotulos() {
  const mapa = new Map<string, Map<string, number>>();

  function registrar(chave: string, rotulo: string) {
    let contador = mapa.get(chave);
    if (!contador) {
      contador = new Map<string, number>();
      mapa.set(chave, contador);
    }
    contador.set(rotulo, (contador.get(rotulo) ?? 0) + 1);
  }

  function escolher(chave: string): string {
    const contador = mapa.get(chave);
    if (!contador || contador.size === 0) return 'Sem descrição';
    return [...contador.entries()].sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0], 'pt-BR');
    })[0][0];
  }

  return { registrar, escolher };
}

function montarMix(
  contagens: Map<string, { rotulo: string; quantidade: number; valorTotal: number }>,
): MixItem[] {
  const total = [...contagens.values()].reduce((acc, item) => acc + item.quantidade, 0);
  return [...contagens.entries()]
    .map(([chave, item]) => ({
      chave,
      rotulo: item.rotulo,
      quantidade: item.quantidade,
      percentual: total > 0 ? (item.quantidade / total) * 100 : 0,
      valorTotal: item.valorTotal,
    }))
    .sort((a, b) => {
      if (b.quantidade !== a.quantidade) return b.quantidade - a.quantidade;
      return a.rotulo.localeCompare(b.rotulo, 'pt-BR');
    });
}

function ordenarPorFrequencia(pecas: PecaResumo[]): PecaResumo[] {
  return [...pecas].sort((a, b) => {
    if (b.quantidade !== a.quantidade) return b.quantidade - a.quantidade;
    if (b.valorTotal !== a.valorTotal) return b.valorTotal - a.valorTotal;
    return a.descricao.localeCompare(b.descricao, 'pt-BR');
  });
}

function ordenarPorCusto(pecas: PecaResumo[]): PecaResumo[] {
  return [...pecas].sort((a, b) => {
    if (b.valorTotal !== a.valorTotal) return b.valorTotal - a.valorTotal;
    if (b.quantidade !== a.quantidade) return b.quantidade - a.quantidade;
    return a.descricao.localeCompare(b.descricao, 'pt-BR');
  });
}

export function extrairTemasServicos(
  servicos: ServicoResumo[],
  limite = LIMITE_TEMAS,
): TemaServico[] {
  const contagem = new Map<string, number>();

  servicos.forEach((servico) => {
    const palavras = normalizarDescricao(servico.descricao).split(' ');
    const vistos = new Set<string>();
    palavras.forEach((palavra) => {
      if (palavra.length < 3) return;
      if (!/^[a-z]+$/.test(palavra)) return;
      if (STOPWORDS.has(palavra)) return;
      if (vistos.has(palavra)) return;
      vistos.add(palavra);
      contagem.set(palavra, (contagem.get(palavra) ?? 0) + servico.ordens);
    });
  });

  return [...contagem.entries()]
    .map(([termo, ocorrencias]) => ({ termo, ocorrencias }))
    .sort((a, b) => {
      if (b.ocorrencias !== a.ocorrencias) return b.ocorrencias - a.ocorrencias;
      return a.termo.localeCompare(b.termo, 'pt-BR');
    })
    .slice(0, limite);
}

export function analisarPecasEServicos(
  manutencoes: ManutencaoParaAnalise[],
  limite = LIMITE_PADRAO,
): AnalisePecasServicos {
  const rotulos = criarContadorRotulos();
  const pecasPorChave = new Map<string, PecaResumo>();
  const acoes = new Map<string, { rotulo: string; quantidade: number; valorTotal: number }>();
  const origens = new Map<string, { rotulo: string; quantidade: number; valorTotal: number }>();
  const servicosPorChave = new Map<string, { ordens: number; custoTotal: number }>();

  let ordensComPecas = 0;
  let ordensComCustoPecas = 0;
  let ordensComCustoPecasSemDetalhe = 0;
  let totalPecas = 0;
  let valorPecasDetalhado = 0;
  let valorPecasSemDetalhe = 0;
  let custoPecasInformado = 0;
  let custoMaoDeObra = 0;
  let custoTotal = 0;

  manutencoes.forEach((manutencao) => {
    const custoPecas = Number(manutencao.custoPecas ?? 0);
    const custoMao = Number(manutencao.custoMaoDeObra ?? 0);
    const pecas = manutencao.pecas ?? [];
    const possuiPecas = pecas.length > 0;
    const possuiCustoPecas = custoPecas > 0;

    custoPecasInformado += custoPecas;
    custoMaoDeObra += custoMao;
    custoTotal += custoDaOrdem(manutencao);

    if (possuiPecas) ordensComPecas += 1;
    if (possuiPecas || possuiCustoPecas) ordensComCustoPecas += 1;
    if (!possuiPecas && possuiCustoPecas) {
      ordensComCustoPecasSemDetalhe += 1;
      valorPecasSemDetalhe += custoPecas;
    }

    const chaveServico = chaveDescricao(manutencao.descricao);
    const rotuloServico = rotuloOriginal(manutencao.descricao);
    rotulos.registrar(chaveServico, rotuloServico);
    const servico = servicosPorChave.get(chaveServico) ?? { ordens: 0, custoTotal: 0 };
    servico.ordens += 1;
    servico.custoTotal += custoDaOrdem(manutencao);
    servicosPorChave.set(chaveServico, servico);

    const pecasDaOrdem = new Set<string>();

    pecas.forEach((peca) => {
      const chavePeca = chaveDescricao(peca.descricao);
      const rotuloPeca = rotuloOriginal(peca.descricao);
      const valor = Number(peca.valor ?? 0);
      rotulos.registrar(chavePeca, rotuloPeca);

      const resumo = pecasPorChave.get(chavePeca) ?? {
        chave: chavePeca,
        descricao: rotuloPeca,
        quantidade: 0,
        valorTotal: 0,
        ordens: 0,
        trocadas: 0,
        consertadas: 0,
      };
      resumo.quantidade += 1;
      resumo.valorTotal += valor;
      if (!pecasDaOrdem.has(chavePeca)) {
        resumo.ordens += 1;
        pecasDaOrdem.add(chavePeca);
      }
      if (peca.acao === 'TROCADA') resumo.trocadas += 1;
      if (peca.acao === 'CONSERTADA') resumo.consertadas += 1;
      pecasPorChave.set(chavePeca, resumo);

      totalPecas += 1;
      valorPecasDetalhado += valor;

      const acao: AcaoPecaManutencao = peca.acao;
      const acaoAtual = acoes.get(acao) ?? {
        rotulo: ACAO_PECA_LABEL[acao],
        quantidade: 0,
        valorTotal: 0,
      };
      acaoAtual.quantidade += 1;
      acaoAtual.valorTotal += valor;
      acoes.set(acao, acaoAtual);

      if (peca.acao === 'TROCADA') {
        const origemChave = peca.origem ?? 'NAO_INFORMADA';
        const origemRotulo = peca.origem
          ? ORIGEM_PECA_LABEL[peca.origem as OrigemPecaManutencao]
          : 'Não informada';
        const origemAtual = origens.get(origemChave) ?? {
          rotulo: origemRotulo,
          quantidade: 0,
          valorTotal: 0,
        };
        origemAtual.quantidade += 1;
        origemAtual.valorTotal += valor;
        origens.set(origemChave, origemAtual);
      }
    });
  });

  const pecas = [...pecasPorChave.values()].map((peca) => ({
    ...peca,
    descricao: rotulos.escolher(peca.chave),
  }));

  const servicos: ServicoResumo[] = [...servicosPorChave.entries()].map(([chave, item]) => ({
    chave,
    descricao: rotulos.escolher(chave),
    ordens: item.ordens,
    custoTotal: item.custoTotal,
    custoMedio: item.ordens > 0 ? item.custoTotal / item.ordens : 0,
  }));

  const topServicos = [...servicos].sort((a, b) => {
    if (b.ordens !== a.ordens) return b.ordens - a.ordens;
    if (b.custoTotal !== a.custoTotal) return b.custoTotal - a.custoTotal;
    return a.descricao.localeCompare(b.descricao, 'pt-BR');
  });

  return {
    totalOrdens: manutencoes.length,
    ordensComPecas,
    ordensComCustoPecas,
    ordensComCustoPecasSemDetalhe,
    coberturaDetalhamento:
      ordensComCustoPecas > 0 ? (ordensComPecas / ordensComCustoPecas) * 100 : 0,
    totalPecas,
    valorPecasDetalhado,
    valorPecasSemDetalhe,
    custoPecasInformado,
    custoMaoDeObra,
    custoTotal,
    pecas,
    topPecasFrequencia: ordenarPorFrequencia(pecas).slice(0, limite),
    topPecasCusto: ordenarPorCusto(pecas).slice(0, limite),
    acoes: montarMix(acoes),
    origens: montarMix(origens),
    servicos,
    topServicos: topServicos.slice(0, limite),
    temas: extrairTemasServicos(servicos),
  };
}
