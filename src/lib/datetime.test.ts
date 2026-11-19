import { describe, expect, it } from 'vitest';
import { dataLocalHoje, diasNaOficina } from './datetime';

describe('dataLocalHoje', () => {
  it('devolve a data local no formato yyyy-mm-dd', () => {
    expect(dataLocalHoje(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
    expect(dataLocalHoje(new Date(2026, 10, 19, 0, 5))).toBe('2026-11-19');
  });
});

describe('diasNaOficina', () => {
  it('conta os dias entre entrada e saída', () => {
    expect(diasNaOficina('2026-10-01', '2026-10-05')).toBe(4);
  });

  it('conta até hoje quando não há saída', () => {
    expect(diasNaOficina('2026-10-01', undefined, new Date('2026-10-04T12:00:00'))).toBe(3);
  });

  it('devolve null para data de entrada inválida', () => {
    expect(diasNaOficina('', '2026-10-05')).toBeNull();
    expect(diasNaOficina(undefined)).toBeNull();
  });

  it('nunca devolve valores negativos', () => {
    expect(diasNaOficina('2026-10-05', '2026-10-01')).toBe(0);
  });
});
