import { describe, expect, it } from 'vitest';
import { formatarDistancia, formatarDuracao } from './formato';

describe('formatarDistancia', () => {
  it('returns em dash for null', () => {
    expect(formatarDistancia(null)).toBe('—');
  });

  it('formats meters below 1km', () => {
    expect(formatarDistancia(45)).toBe('45 m');
    expect(formatarDistancia(999)).toBe('999 m');
  });

  it('formats kilometers with one decimal', () => {
    expect(formatarDistancia(1500)).toBe('1.5 km');
    expect(formatarDistancia(1000)).toBe('1.0 km');
  });
});

describe('formatarDuracao', () => {
  it('returns em dash for null', () => {
    expect(formatarDuracao(null)).toBe('—');
  });

  it('formats minutes under one hour', () => {
    expect(formatarDuracao(45)).toBe('1 min');
    expect(formatarDuracao(59)).toBe('1 min');
    expect(formatarDuracao(60)).toBe('1 min');
    expect(formatarDuracao(90)).toBe('2 min');
    expect(formatarDuracao(3540)).toBe('59 min');
  });

  it('formats hours', () => {
    expect(formatarDuracao(3600)).toBe('1 h');
    expect(formatarDuracao(5400)).toBe('1 h 30 min');
    expect(formatarDuracao(7200)).toBe('2 h');
  });
});
