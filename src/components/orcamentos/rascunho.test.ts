import { beforeEach, describe, expect, it } from 'vitest';
import {
  carregarRascunho,
  chaveRascunho,
  limparRascunho,
  rascunhoLocalMaisRecente,
  salvarRascunho,
  VERSAO_RASCUNHO,
} from './rascunho';
import { estadoInicialWizard } from './tipos';

function fakeStorage(): Storage {
  const mapa = new Map<string, string>();
  return {
    get length() {
      return mapa.size;
    },
    clear: () => mapa.clear(),
    getItem: (k: string) => (mapa.has(k) ? (mapa.get(k) as string) : null),
    key: (i: number) => [...mapa.keys()][i] ?? null,
    removeItem: (k: string) => {
      mapa.delete(k);
    },
    setItem: (k: string, v: string) => {
      mapa.set(k, v);
    },
  };
}

describe('chaveRascunho', () => {
  it('usa uma chave única para o rascunho novo (sem id)', () => {
    expect(chaveRascunho(null)).toBe('orcamentos:rascunho:novo');
  });

  it('namespaceia por id em modo edição', () => {
    expect(chaveRascunho(42)).toBe('orcamentos:rascunho:42');
  });
});

describe('salvar/carregar rascunho', () => {
  let storage: Storage;

  beforeEach(() => {
    storage = fakeStorage();
  });

  it('roundtrip: salva e recupera o snapshot', () => {
    const estado = estadoInicialWizard({ atendimentoId: 7, passo: 2 });
    salvarRascunho(storage, null, estado, 1000);
    const lido = carregarRascunho(storage, null);
    expect(lido).toMatchObject({
      versao: VERSAO_RASCUNHO,
      salvoEm: 1000,
      orcamentoId: null,
      estado: { atendimentoId: 7, passo: 2 },
    });
  });

  it('modo edição usa a chave do orçamento e preserva o id', () => {
    const estado = estadoInicialWizard({ atendimentoId: 3 });
    salvarRascunho(storage, 42, estado, 2000);
    expect(carregarRascunho(storage, 42)).toMatchObject({ orcamentoId: 42 });
    expect(carregarRascunho(storage, null)).toBeNull();
  });

  it('retorna null sem rascunho gravado', () => {
    expect(carregarRascunho(storage, 9)).toBeNull();
  });

  it('descarta rascunho com versão antiga', () => {
    storage.setItem(
      chaveRascunho(null),
      JSON.stringify({ versao: 0, salvoEm: 1, estado: {} }),
    );
    expect(carregarRascunho(storage, null)).toBeNull();
  });

  it('retorna null para JSON inválido', () => {
    storage.setItem(chaveRascunho(null), '{nope');
    expect(carregarRascunho(storage, null)).toBeNull();
  });

  it('não lança com storage ausente (ambiente sem localStorage)', () => {
    expect(() =>
      salvarRascunho(undefined, null, estadoInicialWizard(), 1),
    ).not.toThrow();
    expect(carregarRascunho(null, null)).toBeNull();
    expect(() => limparRascunho(null, null)).not.toThrow();
  });

  it('limpar remove apenas a chave pedida', () => {
    const estado = estadoInicialWizard();
    salvarRascunho(storage, null, estado, 1);
    salvarRascunho(storage, 42, estado, 1);
    limparRascunho(storage, null);
    expect(carregarRascunho(storage, null)).toBeNull();
    expect(carregarRascunho(storage, 42)).not.toBeNull();
  });
});

describe('rascunhoLocalMaisRecente', () => {
  const rascunho = (salvoEm: number) => ({
    versao: VERSAO_RASCUNHO,
    salvoEm,
    orcamentoId: null,
    estado: estadoInicialWizard(),
  });

  it('sem rascunho local → nunca retoma', () => {
    expect(rascunhoLocalMaisRecente(null, '2026-01-01T00:00:00Z')).toBe(false);
  });

  it('rascunho local mais novo que o servidor → retoma', () => {
    const servidor = new Date(1000).toISOString();
    expect(rascunhoLocalMaisRecente(rascunho(2000), servidor)).toBe(true);
  });

  it('servidor mais novo (edição sincronizada em outra aba) → ignora local', () => {
    const servidor = new Date(3000).toISOString();
    expect(rascunhoLocalMaisRecente(rascunho(2000), servidor)).toBe(false);
  });

  it('sem updatedAt no servidor → assume local', () => {
    expect(rascunhoLocalMaisRecente(rascunho(1), null)).toBe(true);
    expect(rascunhoLocalMaisRecente(rascunho(1), undefined)).toBe(true);
  });
});
