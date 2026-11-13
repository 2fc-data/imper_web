import { describe, expect, it } from 'vitest';
import type { DashboardObrasResponse } from './api/dashboard';
import {
  formatarArea,
  formatarMoeda,
  formatarMoedaCompacta,
  formatarPercentual,
  gerarStorytelling,
  periodoParaIntervalo,
  rotuloStatusObra,
  rotuloUrgencia,
} from './obras-analytics';

const hoje = new Date(2026, 10, 11);

describe('periodoParaIntervalo', () => {
  it('calcula janelas relativas de 7, 30 e 90 dias', () => {
    expect(periodoParaIntervalo('7d', undefined, undefined, hoje)).toEqual({
      de: '2026-11-05',
      ate: '2026-11-11',
    });
    expect(periodoParaIntervalo('30d', undefined, undefined, hoje)).toEqual({
      de: '2026-10-13',
      ate: '2026-11-11',
    });
    expect(periodoParaIntervalo('90d', undefined, undefined, hoje)).toEqual({
      de: '2026-08-14',
      ate: '2026-11-11',
    });
  });

  it('calcula mês e ano corrente', () => {
    expect(periodoParaIntervalo('mes', undefined, undefined, hoje)).toEqual({
      de: '2026-11-01',
      ate: '2026-11-11',
    });
    expect(periodoParaIntervalo('ano', undefined, undefined, hoje)).toEqual({
      de: '2026-01-01',
      ate: '2026-11-11',
    });
  });

  it('retorna tudo e respeita período customizado', () => {
    expect(periodoParaIntervalo('tudo', undefined, undefined, hoje)).toEqual({
      tudo: true,
    });
    expect(
      periodoParaIntervalo('custom', '2026-01-01', '2026-02-01', hoje),
    ).toEqual({ de: '2026-01-01', ate: '2026-02-01' });
  });
});

describe('formatadores', () => {
  it('formata moeda e variações', () => {
    expect(formatarMoeda(1234.56)).toContain('1.234,56');
    expect(formatarMoeda(null)).toContain('0,00');
    expect(formatarMoedaCompacta(1_200_000)).toContain('1,2');
    expect(formatarPercentual(12.345)).toBe('+12,3%');
    expect(formatarPercentual(-5)).toBe('-5,0%');
    expect(formatarPercentual(null)).toBe('—');
  });

  it('formata área e rótulos', () => {
    expect(formatarArea(1234.44)).toBe('1.234,4 m²');
    expect(rotuloStatusObra('EM_EXECUCAO')).toBe('Em execução');
    expect(rotuloUrgencia('URGENTISSIMO')).toBe('Urgentíssimo');
  });
});

function respostaBase(
  overrides: Partial<DashboardObrasResponse> = {},
): DashboardObrasResponse {
  return {
    periodo: {
      de: '2026-08-14T03:00:00.000Z',
      ate: '2026-11-11T23:59:59.000Z',
      tudo: false,
      dias: 90,
    },
    periodoAnterior: null,
    granularidade: 'semana',
    kpis: {
      obrasAtivas: 10,
      obrasEmExecucao: 6,
      obrasEmPreparacao: 4,
      obrasCriadas: 3,
      obrasConcluidas: 2,
      valorContratadoNovas: 300_000,
      aditivosAprovadosValor: 15_000,
      aditivosPendentesValor: 0,
      aditivosPendentesQtd: 0,
      ticketMedioNovas: 100_000,
      areaTotalM2: 1_000,
      valorMedioM2: 300,
      execucoesAtrasadas: 0,
      execucoesPendentes: 4,
    },
    kpisAnterior: null,
    variacoes: {
      obrasCriadas: 50,
      obrasConcluidas: null,
      valorContratadoNovas: 12.5,
      aditivosAprovadosValor: null,
      ticketMedioNovas: null,
    },
    serie: [],
    distribuicoes: {
      porStatus: [],
      porUrgencia: [],
      porCliente: [],
      porCidade: [],
    },
    financeiro: {
      contratadoAtivo: 900_000,
      aditivosAprovadosAtivo: 45_000,
      aditivosPendentesAtivo: 0,
      totalPrevistoAtivo: 945_000,
      contratadoNovas: 300_000,
      aditivosAprovadosPeriodo: 15_000,
    },
    obrasCriticas: [],
    alertas: [],
    ...overrides,
  };
}

describe('gerarStorytelling', () => {
  it('classifica operação saudável como ótima', () => {
    const texto = gerarStorytelling(respostaBase());
    expect(texto.statusGeral).toBe('otimo');
    expect(texto.resumoExecutivo).toContain('10 obras ativas');
    expect(texto.recomendacoes.length).toBeGreaterThan(0);
  });

  it('classifica como crítico quando há muitos atrasos', () => {
    const base = respostaBase();
    const texto = gerarStorytelling({
      ...base,
      kpis: { ...base.kpis, execucoesAtrasadas: 8 },
    });
    expect(texto.statusGeral).toBe('critico');
    expect(texto.diagnostico.join(' ')).toContain('fora do prazo');
  });

  it('marca atenção com aditivos pendentes', () => {
    const comPendencia = respostaBase();
    comPendencia.kpis.aditivosPendentesQtd = 2;
    const texto = gerarStorytelling(comPendencia);
    expect(texto.statusGeral).toBe('atencao');
    expect(texto.diagnostico.join(' ')).toContain('aditivos pendentes');
  });
});
