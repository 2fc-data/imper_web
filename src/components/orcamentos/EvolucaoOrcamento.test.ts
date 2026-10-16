import { describe, expect, it } from 'vitest';
import { calcularEvolucaoOrcamento } from './EvolucaoOrcamento';

describe('calcularEvolucaoOrcamento', () => {
  it('rascunho salvo sem atividades → 1/3 Cliente & Serviço', () => {
    expect(calcularEvolucaoOrcamento({})).toEqual({
      passos: [true, false, false],
      etapa: 1,
      rotulo: 'Cliente & Serviço',
    });
  });

  it('atividades sem valorTotal → passo 2 incompleto, etapa 1', () => {
    expect(
      calcularEvolucaoOrcamento({ atividades: 1, valorTotal: 0 }),
    ).toEqual({
      passos: [true, false, false],
      etapa: 1,
      rotulo: 'Cliente & Serviço',
    });
  });

  it('atividades e valorTotal → 3/3 Ficha & Resumo (passo 3 acompanha o 2)', () => {
    const r = calcularEvolucaoOrcamento({ atividades: 2, valorTotal: '3700' });
    expect(r.etapa).toBe(3);
    expect(r.rotulo).toBe('Ficha & Resumo');
    expect(r.passos).toEqual([true, true, true]);
  });

  it('passo 3 acompanha o passo 2 (sem gate de ficha)', () => {
    expect(
      calcularEvolucaoOrcamento({
        atividades: 1,
        valorTotal: 10,
        ficha: { id: 1 },
      }).passos,
    ).toEqual([true, true, true]);
    expect(
      calcularEvolucaoOrcamento({
        atividades: 1,
        valorTotal: 10,
        observacoes: '   ',
      }).passos,
    ).toEqual([true, true, true]);
  });

  it('etapa é consecutiva: lacuna em atividades não pula etapa', () => {
    const r = calcularEvolucaoOrcamento({
      atividades: 0,
      valorTotal: 500,
      ficha: { id: 2 },
    });
    expect(r.etapa).toBe(1);
    expect(r.passos).toEqual([true, false, false]);
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
      passos: [true, true, true],
      etapa: 3,
      rotulo: 'Ficha & Resumo',
    });
  });

  it('valorTotal negativo ou inválido não completa o passo 2', () => {
    expect(calcularEvolucaoOrcamento({ atividades: 1, valorTotal: -5 }).etapa).toBe(1);
    expect(calcularEvolucaoOrcamento({ atividades: 1, valorTotal: 'abc' }).etapa).toBe(1);
  });

  it('ficha sem atividades/valor mantém etapa 1 (consecutiva)', () => {
    const r = calcularEvolucaoOrcamento({ ficha: { id: 9 } });
    expect(r.etapa).toBe(1);
    expect(r.passos).toEqual([true, false, false]);
  });
});
