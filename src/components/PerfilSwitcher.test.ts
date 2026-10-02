import { describe, expect, it } from 'vitest';
import { opcoesSwitcher } from './PerfilSwitcher';

describe('opcoesSwitcher', () => {
  it('só CLIENTE → apenas portal', () => {
    expect(opcoesSwitcher({ papeis: ['CLIENTE'] })).toEqual({
      portal: true,
      painel: false,
    });
  });

  it('só staff → apenas painel', () => {
    expect(opcoesSwitcher({ papeis: ['TECNICO'] })).toEqual({
      portal: false,
      painel: true,
    });
  });

  it('misto → os dois', () => {
    expect(opcoesSwitcher({ papeis: ['CLIENTE', 'TECNICO'] })).toEqual({
      portal: true,
      painel: true,
    });
  });

  it('sem papéis → nenhuma opção', () => {
    expect(opcoesSwitcher({ papeis: [] })).toEqual({
      portal: false,
      painel: false,
    });
  });
});
