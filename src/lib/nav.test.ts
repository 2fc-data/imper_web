import { describe, expect, it } from 'vitest';
import { homeFor } from './nav';

const cliente = { papeis: ['CLIENTE'], permissoes: ['ver_minha_os'] };
const staff = { papeis: ['TECNICO'], permissoes: ['criar_os'] };
const misto = {
  papeis: ['CLIENTE', 'TECNICO'],
  permissoes: ['ver_minha_os', 'criar_os'],
};

describe('homeFor', () => {
  it('somente CLIENTE → /portal mesmo com permissões do papel', () => {
    expect(homeFor(cliente)).toBe('/portal');
  });

  it('somente staff → /painel', () => {
    expect(homeFor(staff)).toBe('/painel');
  });

  it('CLIENTE + outro perfil → /painel', () => {
    expect(homeFor(misto)).toBe('/painel');
  });

  it('sem papéis → /portal', () => {
    expect(homeFor({ papeis: [] })).toBe('/portal');
  });

  it('chave antiga de preferência no localStorage é ignorada', () => {
    localStorage.setItem('imper_v02:perfil-ultimo', '/portal');
    expect(homeFor(misto)).toBe('/painel');
    expect(homeFor(cliente)).toBe('/portal');
  });
});
