import { describe, expect, it } from 'vitest';
import {
  podeAprovarCompras,
  podeAprovarManutencao,
  podeAprovarManutencaoEquipamento,
  rotuloContador,
  totalAvisos,
} from './avisos';

describe('avisos helpers', () => {
  describe('podeAprovarManutencao', () => {
    it('retorna false para usuário nulo ou sem permissão', () => {
      expect(podeAprovarManutencao(null)).toBe(false);
      expect(podeAprovarManutencao(undefined)).toBe(false);
      expect(podeAprovarManutencao({ permissoes: [] })).toBe(false);
      expect(
        podeAprovarManutencao({ permissoes: ['visualizar_frota'] }),
      ).toBe(false);
    });

    it('retorna true quando possui aprovar_manutencao_frota', () => {
      expect(
        podeAprovarManutencao({
          permissoes: ['aprovar_manutencao_frota', 'gerenciar_frota'],
        }),
      ).toBe(true);
    });
  });

  describe('podeAprovarManutencaoEquipamento', () => {
    it('retorna true quando possui aprovar_manutencao_equipamento', () => {
      expect(
        podeAprovarManutencaoEquipamento({
          permissoes: ['aprovar_manutencao_equipamento'],
        }),
      ).toBe(true);
      expect(podeAprovarManutencaoEquipamento(null)).toBe(false);
    });
  });

  describe('podeAprovarCompras', () => {
    it('retorna true quando possui aprovar_lista_compras', () => {
      expect(
        podeAprovarCompras({
          permissoes: ['aprovar_lista_compras'],
        }),
      ).toBe(true);
      expect(podeAprovarCompras(null)).toBe(false);
    });
  });

  describe('totalAvisos', () => {
    it('soma pendentes e não lidas tratando vazios e nulos', () => {
      expect(totalAvisos(null, null)).toBe(0);
      expect(totalAvisos([], [])).toBe(0);
      expect(totalAvisos([1, 2], [1], [3], [4, 5])).toBe(6);
    });
  });

  describe('rotuloContador', () => {
    it('formata contadores corretamente', () => {
      expect(rotuloContador(0)).toBe('');
      expect(rotuloContador(-1)).toBe('');
      expect(rotuloContador(5)).toBe('5');
      expect(rotuloContador(99)).toBe('99');
      expect(rotuloContador(120)).toBe('99+');
    });
  });
});
