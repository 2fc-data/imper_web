import { describe, expect, it } from 'vitest';
import { selecionarPapel } from './MultiSelectPapeis';

describe('selecionarPapel', () => {
  it('adiciona um id novo', () => {
    expect(selecionarPapel([1], 2)).toEqual([1, 2]);
  });

  it('remove um id já marcado', () => {
    expect(selecionarPapel([1, 2], 1)).toEqual([2]);
  });

  it('nunca deixa a lista vazia (mantém o último)', () => {
    expect(selecionarPapel([1], 1)).toEqual([1]);
  });

  it('mantém ordem ao adicionar no meio', () => {
    expect(selecionarPapel([1, 3], 2)).toEqual([1, 3, 2]);
  });
});
