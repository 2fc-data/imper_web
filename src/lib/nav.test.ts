import { describe, expect, it } from 'vitest';
import { homeFor } from './nav';

const cliente = { papeis: ['CLIENTE'], permissoes: [] };
const staff = { papeis: ['TECNICO'], permissoes: ['criar_os'] };
const misto = { papeis: ['CLIENTE', 'TECNICO'], permissoes: ['criar_os'] };

describe('homeFor', () => {
  it('somente CLIENTE → /portal', () => {
    expect(homeFor(cliente)).toBe('/portal');
  });

  it('somente staff → /painel', () => {
    expect(homeFor(staff)).toBe('/painel');
  });

  it('CLIENTE + outro perfil → /painel', () => {
    expect(homeFor(misto)).toBe('/painel');
  });

  it('sem papéis e sem permissões → /portal', () => {
    expect(homeFor({ permissoes: [] })).toBe('/portal');
  });

  it('chave antiga de preferência no localStorage é ignorada', () => {
    localStorage.setItem('imper_v02:perfil-ultimo', '/portal');
    expect(homeFor(misto)).toBe('/painel');
    expect(homeFor(cliente)).toBe('/portal');
  });
});
