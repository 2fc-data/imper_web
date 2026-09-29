import { describe, expect, it } from 'vitest';
import {
  CORES_STATUS,
  ROTULOS_STATUS,
} from './atendimento-status.js';

describe('ROTULOS_STATUS / CORES_STATUS', () => {
  it('NOVO → rótulo e classe do badge atual', () => {
    expect(ROTULOS_STATUS.NOVO).toBe('NOVO');
    expect(CORES_STATUS.NOVO).toBe('bg-info/15 text-info');
  });

  it('EM_ANDAMENTO → EM ANDAMENTO', () => {
    expect(ROTULOS_STATUS.EM_ANDAMENTO).toBe('EM ANDAMENTO');
    expect(CORES_STATUS.EM_ANDAMENTO).toBe('bg-primary/15 text-primary');
  });

  it('ORCAMENTAMENTO → ORÇAMENTO', () => {
    expect(ROTULOS_STATUS.ORCAMENTAMENTO).toBe('ORÇAMENTO');
    expect(CORES_STATUS.ORCAMENTAMENTO).toBe('bg-warning/15 text-warning');
  });

  it('CONCLUIDO → CONCLUÍDO', () => {
    expect(ROTULOS_STATUS.CONCLUIDO).toBe('CONCLUÍDO');
    expect(CORES_STATUS.CONCLUIDO).toBe('bg-success/15 text-success');
  });

  it('INATIVO → rótulo e classe destrutiva', () => {
    expect(ROTULOS_STATUS.INATIVO).toBe('INATIVO');
    expect(CORES_STATUS.INATIVO).toBe('bg-destructive/15 text-destructive');
  });
});
