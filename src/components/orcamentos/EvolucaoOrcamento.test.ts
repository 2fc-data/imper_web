import { describe, expect, it } from 'vitest';
import { calcularEvolucaoOrcamento } from './EvolucaoOrcamento';

describe('calcularEvolucaoOrcamento', () => {
  it('rascunho salvo sem atividades → 1/4 Cliente & Serviço', () => {
    expect(calcularEvolucaoOrcamento({})).toEqual({
      passos: [true, false, false, false],
      etapa: 1,
      rotulo: 'Cliente & Serviço',
    });
  });

  it('atividades sem valorTotal → 2/4 Cobertura', () => {
    expect(
      calcularEvolucaoOrcamento({ atividades: 1, valorTotal: 0 }),
    ).toEqual({
      passos: [true, true, false, false],
      etapa: 2,
      rotulo: 'Cobertura',
    });
  });

  it('valorTotal > 0 sem ficha → 3/4 Precificação', () => {
    const r = calcularEvolucaoOrcamento({ atividades: 2, valorTotal: '3700' });
    expect(r.etapa).toBe(3);
    expect(r.rotulo).toBe('Precificação');
    expect(r.passos).toEqual([true, true, true, false]);
  });

  it('ficha ou observações preenchidas → 4/4 Ficha & Resumo', () => {
    expect(
      calcularEvolucaoOrcamento({
        atividades: 1,
        valorTotal: 10,
        ficha: { id: 1 },
      }).etapa,
    ).toBe(4);
    expect(
      calcularEvolucaoOrcamento({
        atividades: 1,
        valorTotal: 10,
        observacoes: 'obs',
      }).etapa,
    ).toBe(4);
    expect(
      calcularEvolucaoOrcamento({
        atividades: 1,
        valorTotal: 10,
        observacoes: '   ',
      }).etapa,
    ).toBe(3);
  });

  it('etapa é consecutiva: lacuna em atividades não pula etapa', () => {
    const r = calcularEvolucaoOrcamento({
      atividades: 0,
      valorTotal: 500,
      ficha: { id: 2 },
    });
    expect(r.etapa).toBe(1);
    expect(r.passos).toEqual([true, false, true, true]);
  });

  it('aceita valorTotal como string decimal do Prisma (ORM-001 real)', () => {
    expect(
      calcularEvolucaoOrcamento({
        atividades: 2,
        valorTotal: '3700',
        ficha: { id: 1 },
        observacoes: 'aprovado oralmente',
      }),
    ).toEqual({
      passos: [true, true, true, true],
      etapa: 4,
      rotulo: 'Ficha & Resumo',
    });
  });

  it('valorTotal negativo ou inválido não conta como precificado', () => {
    expect(calcularEvolucaoOrcamento({ atividades: 1, valorTotal: -5 }).etapa).toBe(2);
    expect(calcularEvolucaoOrcamento({ atividades: 1, valorTotal: 'abc' }).etapa).toBe(2);
  });

  it('ficha sem atividades/valor mantém etapa 1 (consecutiva)', () => {
    const r = calcularEvolucaoOrcamento({ ficha: { id: 9 } });
    expect(r.etapa).toBe(1);
    expect(r.passos).toEqual([true, false, false, true]);
  });
});
