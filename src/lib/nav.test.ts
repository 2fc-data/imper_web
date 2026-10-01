import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  CHAVE_PERFIL_ULTIMO,
  homeFor,
  lerPerfilUltimo,
  salvarPerfilUltimo,
} from './nav';

const cliente = { papeis: ['CLIENTE'], permissoes: [] };
const staff = { papeis: ['TECNICO'], permissoes: ['criar_os'] };
const misto = { papeis: ['CLIENTE', 'TECNICO'], permissoes: ['criar_os'] };

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe('homeFor', () => {
  it('somente CLIENTE → /portal', () => {
    expect(homeFor(cliente)).toBe('/portal');
  });

  it('somente staff → /painel', () => {
    expect(homeFor(staff)).toBe('/painel');
  });

  it('misto sem preferência → /escolher-perfil', () => {
    expect(homeFor(misto)).toBe('/escolher-perfil');
  });

  it('misto com preferência /painel → /painel', () => {
    salvarPerfilUltimo('/painel');
    expect(homeFor(misto)).toBe('/painel');
  });

  it('misto com preferência /portal → /portal', () => {
    salvarPerfilUltimo('/portal');
    expect(homeFor(misto)).toBe('/portal');
  });

  it('preferência ignorada quando o perfil não existe mais', () => {
    salvarPerfilUltimo('/painel');
    expect(homeFor(cliente)).toBe('/portal');
    expect(homeFor(staff)).toBe('/painel');
  });

  it('valor inválido em misto → /escolher-perfil', () => {
    localStorage.setItem(CHAVE_PERFIL_ULTIMO, '/outra');
    expect(homeFor(misto)).toBe('/escolher-perfil');
  });

  it('roundtrip salvar/ler', () => {
    salvarPerfilUltimo('/painel');
    expect(lerPerfilUltimo()).toBe('/painel');
  });
});
