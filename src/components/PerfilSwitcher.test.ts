import { describe, expect, it } from 'vitest';
import { opcoesSwitcher } from './PerfilSwitcher';

describe('opcoesSwitcher', () => {
  it('só CLIENTE → apenas portal', () => {
    expect(
      opcoesSwitcher({ papeis: ['CLIENTE'], permissoes: [] }),
    ).toEqual({ portal: true, painel: false });
  });

  it('só staff → apenas painel', () => {
    expect(
      opcoesSwitcher({ papeis: ['TECNICO'], permissoes: ['criar_os'] }),
    ).toEqual({ portal: false, painel: true });
  });

  it('misto → os dois', () => {
    expect(
      opcoesSwitcher({
        papeis: ['CLIENTE', 'TECNICO'],
        permissoes: ['criar_os'],
      }),
    ).toEqual({ portal: true, painel: true });
  });

  it('staff sem papéis de cliente mas com permissões → só painel', () => {
    expect(
      opcoesSwitcher({ papeis: [], permissoes: ['ler_os'] }),
    ).toEqual({ portal: false, painel: true });
  });
});
