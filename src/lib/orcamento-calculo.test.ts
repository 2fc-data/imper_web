import { describe, expect, it } from 'vitest';
import {
  calcularTotais,
  linhaValorTotal,
  materiaisValor,
  moValorTotal,
  round2,
  valorTotalOrcamento,
} from './orcamento-calculo';

describe('round2', () => {
  it('corrige a imprecisão de ponto flutuante (0.1 + 0.2 → 0.3)', () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
  });

  it('arredonda para 2 casas', () => {
    expect(round2(26.666666)).toBe(26.67);
    expect(round2(10)).toBe(10);
  });
});

describe('moValorTotal', () => {
  it('calcula pessoas × horas × valorHora', () => {
    expect(moValorTotal({ moPessoas: 2, moHoras: 3.5, moValorHora: 50 })).toBe(
      350,
    );
  });

  it('retorna 0 quando qualquer campo está null/undefined', () => {
    expect(
      moValorTotal({ moPessoas: null, moHoras: 3.5, moValorHora: 50 }),
    ).toBe(0);
    expect(moValorTotal({ moPessoas: 2, moHoras: null, moValorHora: 50 })).toBe(
      0,
    );
    expect(
      moValorTotal({ moPessoas: 2, moHoras: 3.5, moValorHora: null }),
    ).toBe(0);
    expect(moValorTotal({})).toBe(0);
  });

  it('arredonda o resultado em 2 casas', () => {
    expect(moValorTotal({ moPessoas: 1, moHoras: 0.1, moValorHora: 0.2 })).toBe(
      0.02,
    );
  });
});

describe('materiaisValor', () => {
  it('soma quantidade × custoUnitario com round2', () => {
    expect(
      materiaisValor([
        { quantidade: 2.5, custoUnitario: 10.4 },
        { quantidade: 1, custoUnitario: 3.3 },
      ]),
    ).toBe(29.3);
  });

  it('retorna 0 para lista vazia', () => {
    expect(materiaisValor([])).toBe(0);
  });
});

describe('linhaValorTotal', () => {
  it('soma mo + materiais', () => {
    const mo = { moPessoas: 2, moHoras: 3.5, moValorHora: 50 };
    const mats = [{ quantidade: 2.5, custoUnitario: 10.4 }];
    expect(linhaValorTotal(mo, mats)).toBe(round2(350 + 26));
  });

  it('funciona com MO e materiais vazios', () => {
    expect(linhaValorTotal({}, [])).toBe(0);
  });
});

describe('valorTotalOrcamento', () => {
  it('área × valorM² + Σ linhas', () => {
    expect(
      valorTotalOrcamento({
        areaM2: 100,
        valorM2: 25.5,
        linhas: [350, 26, 74.5],
      }),
    ).toBe(round2(2550 + 450.5));
  });

  it('sem área/valorM² usa apenas Σ linhas', () => {
    expect(valorTotalOrcamento({ linhas: [10, 20.5] })).toBe(30.5);
    expect(
      valorTotalOrcamento({ areaM2: null, valorM2: 25.5, linhas: [1] }),
    ).toBe(1);
  });

  it('sem linhas usa apenas a base', () => {
    expect(valorTotalOrcamento({ areaM2: 100, valorM2: 25.5, linhas: [] })).toBe(
      2550,
    );
  });
});

describe('calcularTotais', () => {
  it('agrega MO, materiais e total geral fiel ao servidor', () => {
    const atividades = [
      {
        linhas: [
          {
            moPessoas: 2,
            moHoras: 3.5,
            moValorHora: 50,
            materiais: [{ quantidade: 2, custoUnitario: 10.4 }],
          },
          {
            moPessoas: 1,
            moHoras: 1,
            moValorHora: 100,
            materiais: [],
          },
        ],
      },
      {
        linhas: [
          {
            moPessoas: null,
            moHoras: 2,
            moValorHora: 30,
            materiais: [{ quantidade: 1, custoUnitario: 3.3 }],
          },
        ],
      },
    ];
    const totais = calcularTotais(atividades, { areaM2: 10, valorM2: 5 });
    expect(totais.valorMO).toBe(round2(350 + 100 + 0));
    expect(totais.valorMateriais).toBe(round2(20.8 + 3.3));
    expect(totais.total).toBe(round2(50 + 350 + 20.8 + 100 + 0 + 3.3));
  });

  it('sem base (areaM2/valorM2) usa apenas a soma das linhas', () => {
    const atividades = [
      {
        linhas: [
          {
            moPessoas: 1,
            moHoras: 1,
            moValorHora: 100,
            materiais: [{ quantidade: 1, custoUnitario: 50 }],
          },
        ],
      },
    ];
    expect(calcularTotais(atividades).total).toBe(150);
    expect(calcularTotais(atividades, {}).total).toBe(150);
  });

  it('sem atividades/linhas usa apenas a base', () => {
    expect(calcularTotais([], { areaM2: 100, valorM2: 25.5 }).total).toBe(2550);
    expect(calcularTotais([]).total).toBe(0);
  });
});
