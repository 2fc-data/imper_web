import { describe, expect, it } from 'vitest';
import {
  acaoDeSalvar,
  estadoAutosaveInicial,
  formatarHora,
  reducerAutosave,
} from './autosave';
import { estadoInicialWizard, montarInput, validarAte } from './tipos';

describe('reducerAutosave', () => {
  it('começa ocioso, sem horário e sem erro', () => {
    expect(estadoAutosaveInicial()).toEqual({
      status: 'ocioso',
      ultimaSalvoEm: null,
      erro: null,
    });
  });

  it('iniciar move para salvando e limpa erro anterior', () => {
    const comErro = reducerAutosave(estadoAutosaveInicial(), {
      tipo: 'falha',
      mensagem: 'boom',
    });
    const iniciado = reducerAutosave(comErro, { tipo: 'iniciar' });
    expect(iniciado).toEqual({
      status: 'salvando',
      ultimaSalvoEm: null,
      erro: null,
    });
  });

  it('sucesso registra o horário da gravação', () => {
    const salvo = reducerAutosave(estadoAutosaveInicial(), {
      tipo: 'sucesso',
      em: 1760000000000,
    });
    expect(salvo).toEqual({
      status: 'salvo',
      ultimaSalvoEm: 1760000000000,
      erro: null,
    });
  });

  it('falha preserva o horário do último sucesso', () => {
    const salvo = reducerAutosave(estadoAutosaveInicial(), {
      tipo: 'sucesso',
      em: 1760000000000,
    });
    const comErro = reducerAutosave(salvo, {
      tipo: 'falha',
      mensagem: 'rede fora',
    });
    expect(comErro).toEqual({
      status: 'erro',
      ultimaSalvoEm: 1760000000000,
      erro: 'rede fora',
    });
  });

  it('ciclo completo: ocioso → salvando → salvo → salvando → salvo', () => {
    let estado = estadoAutosaveInicial();
    for (const em of [1000, 2000]) {
      estado = reducerAutosave(estado, { tipo: 'iniciar' });
      expect(estado.status).toBe('salvando');
      estado = reducerAutosave(estado, { tipo: 'sucesso', em });
      expect(estado).toEqual({ status: 'salvo', ultimaSalvoEm: em, erro: null });
    }
  });
});

describe('acaoDeSalvar', () => {
  it('cria quando ainda não existe rascunho salvo', () => {
    expect(acaoDeSalvar(null)).toEqual({ tipo: 'criar' });
  });

  it('edita quando o autosave já criou o id (evita rascunho duplicado)', () => {
    expect(acaoDeSalvar(42)).toEqual({ tipo: 'editar', id: 42 });
  });
});

describe('formatarHora', () => {
  it('retorna vazio sem horário', () => {
    expect(formatarHora(null)).toBe('');
  });

  it('formata HH:MM local', () => {
    const hora = formatarHora(new Date(2026, 9, 11, 14, 32).getTime());
    expect(hora).toMatch(/^\d{2}:\d{2}/);
  });
});

describe('payload de autosave do passo 1', () => {
  it('valida o avanço e monta um rascunho parcial aceitável pela API', () => {
    const passo1 = estadoInicialWizard({ atendimentoId: 7 });
    expect(validarAte(passo1, 2)).toBeNull();
    const input = montarInput(passo1);
    expect(input.atendimentoId).toBe(7);
    expect(input.atividades).toEqual([]);
    expect(input.validade).toBeTruthy();
  });
});
