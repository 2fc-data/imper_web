import { describe, expect, it } from 'vitest';
import type { PecaManutencaoItem } from '../../lib/api';
import {
  analisarPecasEServicos,
  normalizarDescricao,
} from './pecasServicosAnalytics';

let proximoId = 1;

function peca(
  descricao: string,
  valor: number,
  acao: PecaManutencaoItem['acao'],
  origem: PecaManutencaoItem['origem'] = null,
  manutencaoId = 1,
): PecaManutencaoItem {
  return {
    id: proximoId++,
    manutencaoId,
    descricao,
    acao,
    origem,
    valor,
  };
}

describe('pecasServicosAnalytics', () => {
  it('normaliza acentos, caixa, pontuação e espaços', () => {
    expect(normalizarDescricao('  Troca de ÓLEO, filtro!!  ')).toBe('troca de oleo filtro');
    expect(normalizarDescricao('')).toBe('');
    expect(normalizarDescricao(null)).toBe('');
  });

  it('agrega peças por descrição normalizada e conta ordens distintas', () => {
    const analise = analisarPecasEServicos([
      {
        descricao: 'Troca de óleo e filtro',
        custoPecas: 100,
        custoMaoDeObra: 50,
        pecas: [
          peca('Filtro de Óleo', 40, 'TROCADA', 'ORIGINAL_NOVA'),
          peca('filtro de oleo', 30, 'TROCADA', 'GENERICA_NOVA'),
          peca('Correia', 20, 'CONSERTADA'),
        ],
      },
      {
        descricao: 'Troca de óleo',
        custo: 80,
        pecas: [peca('Filtro de Óleo', 50, 'TROCADA', 'ORIGINAL_NOVA', 2)],
      },
      {
        descricao: 'Revisão geral',
        custoPecas: 200,
        custoMaoDeObra: 0,
        pecas: [],
      },
      {
        descricao: '',
        custo: 0,
        pecas: [],
      },
    ]);

    expect(analise.totalOrdens).toBe(4);
    expect(analise.ordensComPecas).toBe(2);
    expect(analise.ordensComCustoPecas).toBe(3);
    expect(analise.ordensComCustoPecasSemDetalhe).toBe(1);
    expect(analise.coberturaDetalhamento).toBeCloseTo(66.67, 1);
    expect(analise.totalPecas).toBe(4);
    expect(analise.valorPecasDetalhado).toBe(140);
    expect(analise.valorPecasSemDetalhe).toBe(200);
    expect(analise.custoPecasInformado).toBe(300);
    expect(analise.custoMaoDeObra).toBe(50);
    expect(analise.custoTotal).toBe(430);

    const filtro = analise.pecas.find((item) => item.chave === 'filtro de oleo');
    expect(filtro).toMatchObject({
      descricao: 'Filtro de Óleo',
      quantidade: 3,
      valorTotal: 120,
      ordens: 2,
      trocadas: 3,
      consertadas: 0,
    });

    expect(analise.topPecasFrequencia[0].descricao).toBe('Filtro de Óleo');
    expect(analise.topPecasCusto[0].valorTotal).toBe(120);
  });

  it('calcula mix de ação e origem das peças trocadas', () => {
    const analise = analisarPecasEServicos([
      {
        descricao: 'Serviço',
        pecas: [
          peca('Peça A', 40, 'TROCADA', 'ORIGINAL_NOVA'),
          peca('Peça A', 30, 'TROCADA', 'GENERICA_NOVA'),
          peca('Peça B', 50, 'TROCADA', 'ORIGINAL_NOVA'),
          peca('Peça C', 20, 'CONSERTADA'),
        ],
      },
    ]);

    expect(analise.acoes.map((item) => [item.chave, item.quantidade, item.percentual])).toEqual([
      ['TROCADA', 3, 75],
      ['CONSERTADA', 1, 25],
    ]);
    expect(
      analise.origens.map((item) => [item.chave, item.quantidade, Math.round(item.percentual)]),
    ).toEqual([
      ['ORIGINAL_NOVA', 2, 67],
      ['GENERICA_NOVA', 1, 33],
    ]);
  });

  it('agrupa serviços, calcula custo médio e extrai temas sem stopwords', () => {
    const analise = analisarPecasEServicos([
      {
        descricao: 'Troca de óleo e filtro',
        custoPecas: 100,
        custoMaoDeObra: 50,
      },
      {
        descricao: 'troca de oleo',
        custo: 80,
      },
      {
        descricao: 'Revisão geral',
        custo: 200,
      },
    ]);

    const servico = analise.servicos.find((item) => item.chave === 'troca de oleo e filtro');
    expect(servico).toMatchObject({
      descricao: 'Troca de óleo e filtro',
      ordens: 1,
      custoTotal: 150,
      custoMedio: 150,
    });

    const simplificado = analise.servicos.find((item) => item.chave === 'troca de oleo');
    expect(simplificado).toMatchObject({ custoTotal: 80, custoMedio: 80 });

    expect(analise.topServicos[0]).toMatchObject({
      descricao: 'Revisão geral',
      custoTotal: 200,
    });

    const temas = new Map(analise.temas.map((item) => [item.termo, item.ocorrencias]));
    expect(temas.get('troca')).toBe(2);
    expect(temas.get('oleo')).toBe(2);
    expect(temas.get('filtro')).toBe(1);
    expect(temas.has('de')).toBe(false);
  });

  it('devolve estruturas vazias quando não há manutenções', () => {
    const analise = analisarPecasEServicos([]);

    expect(analise.totalOrdens).toBe(0);
    expect(analise.coberturaDetalhamento).toBe(0);
    expect(analise.pecas).toEqual([]);
    expect(analise.acoes).toEqual([]);
    expect(analise.origens).toEqual([]);
    expect(analise.servicos).toEqual([]);
    expect(analise.temas).toEqual([]);
  });
});
