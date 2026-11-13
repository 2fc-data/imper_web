import { describe, expect, it } from 'vitest';
import {
  formatarMoedaInput,
  mascararMoeda,
  paraNumeroMoeda,
  somarMoeda,
} from './format';

function normalizarMoeda(valor: string): string {
  return valor.replace(/\u00A0/g, ' ');
}

describe('paraNumeroMoeda', () => {
  it('converte number', () => {
    expect(paraNumeroMoeda(1600.5)).toBe(1600.5);
  });

  it('converte string serializada pela API (ponto decimal)', () => {
    expect(paraNumeroMoeda('1600.5')).toBe(1600.5);
    expect(paraNumeroMoeda('0.1')).toBe(0.1);
  });

  it('converte string formatada pt-BR (vírgula decimal, ponto milhar)', () => {
    expect(paraNumeroMoeda('1.600,50')).toBe(1600.5);
    expect(paraNumeroMoeda('1600,5')).toBe(1600.5);
    expect(paraNumeroMoeda('1.600,00')).toBe(1600);
  });

  it('retorna undefined para vazio/inválido', () => {
    expect(paraNumeroMoeda(undefined)).toBeUndefined();
    expect(paraNumeroMoeda(null)).toBeUndefined();
    expect(paraNumeroMoeda('')).toBeUndefined();
    expect(paraNumeroMoeda('abc')).toBeUndefined();
  });
});

describe('formatarMoedaInput', () => {
  it('formata número', () => {
    expect(normalizarMoeda(formatarMoedaInput(1600.5))).toBe('R$ 1.600,50');
  });

  it('formata string serializada pela API', () => {
    expect(normalizarMoeda(formatarMoedaInput('1600.5'))).toBe('R$ 1.600,50');
  });

  it('formata string pt-BR', () => {
    expect(normalizarMoeda(formatarMoedaInput('1.600,50'))).toBe('R$ 1.600,50');
  });

  it('retorna string vazia para null/undefined', () => {
    expect(formatarMoedaInput(null)).toBe('');
    expect(formatarMoedaInput(undefined)).toBe('');
  });
});

describe('mascararMoeda', () => {
  it('converte dígitos em moeda', () => {
    const resultado = mascararMoeda('160050');
    expect(normalizarMoeda(resultado.texto)).toBe('R$ 1.600,50');
    expect(resultado.valor).toBe(1600.5);
  });

  it('trata vazio', () => {
    expect(mascararMoeda('')).toEqual({ texto: '', valor: undefined });
  });

  it('ignora dígitos além do limite do DECIMAL(12,2)', () => {
    const resultado = mascararMoeda('1234567890123456');
    expect(resultado.valor).toBe(1234567890.12);
  });
});

describe('somarMoeda', () => {
  it('soma valores normais', () => {
    expect(somarMoeda(1600.5, 200)).toBe(1800.5);
  });

  it('soma sem erros de ponto flutuante (0.1 + 0.2)', () => {
    expect(somarMoeda(0.1, 0.2)).toBe(0.3);
  });

  it('soma mistando string e number', () => {
    expect(somarMoeda('1600.5', '200')).toBe(1800.5);
  });

  it('trata nulos como zero', () => {
    expect(somarMoeda(null, undefined, 100)).toBe(100);
  });
});
