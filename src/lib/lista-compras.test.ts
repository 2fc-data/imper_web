import { describe, expect, it } from 'vitest';
import type { ListaCompraItemDto } from './api/listas-compras.js';
import {
  dataCompraItem, formatarData, fornecedorItem, modoDaLista, podeAprovar,
  podeComprar, podeEditarItens, podeEnviar, progressoCompras, totalEstimado,
  totalGasto, unidadeItem, valorTotalItem, valorUnitarioItem,
} from './lista-compras.js';

function item(parcial: Partial<ListaCompraItemDto>): ListaCompraItemDto {
  return {
    id: 1,
    quantidade: 1,
    valorUnitario: null,
    custoReal: null,
    dataCompra: null,
    status: 'PENDENTE',
    ...parcial,
  };
}

describe('modoDaLista', () => {
  it('mapeia status → modo', () => {
    expect(modoDaLista(null)).toBe('edicao');
    expect(modoDaLista('ABERTA')).toBe('edicao');
    expect(modoDaLista('RECUSADA')).toBe('edicao');
    expect(modoDaLista('ENVIADA')).toBe('aprovacao');
    expect(modoDaLista('APROVADA')).toBe('compra');
    expect(modoDaLista('COMPRADA')).toBe('historico');
  });

  it('ações por modo', () => {
    expect(podeEnviar('edicao')).toBe(true);
    expect(podeEnviar('aprovacao')).toBe(false);
    expect(podeEditarItens('edicao')).toBe(true);
    expect(podeAprovar('aprovacao')).toBe(true);
    expect(podeComprar('compra')).toBe(true);
    expect(podeComprar('historico')).toBe(false);
  });
});

describe('progressoCompras / estaComprada', () => {
  it('conta comprados', () => {
    const itens = [
      item({ status: 'COMPRADO' }),
      item({ status: 'PENDENTE' }),
      item({ status: 'RECUSADO' }),
    ];
    expect(progressoCompras(itens)).toEqual({ comprados: 1, total: 3 });
  });
});

describe('totalEstimado / totalGasto', () => {
  it('soma quantidade × custoUnitario e ignora RECUSADO', () => {
    const itens = [
      item({ quantidade: 2, material: {
        id: 1, nome: 'Arroz', unidade: { nome: 'kg' }, saldo: null,
        custoUnitario: 5,
      } }),
      item({ status: 'RECUSADO', quantidade: 10, material: {
        id: 2, nome: 'Feijão', unidade: { nome: 'kg' }, saldo: null,
        custoUnitario: 100,
      } }),
    ];
    expect(totalEstimado(itens)).toBe(10);
  });

  it('devolve null quando algum item sem custo unitário', () => {
    const itens = [item({ quantidade: 1, equipamento: {
      id: 1, descricao: 'Furadeira', unidadeMedida: null,
    } })];
    expect(totalEstimado(itens)).toBeNull();
  });

  it('totalGasto soma custoReal', () => {
    const itens = [
      item({ custoReal: 12.5 }),
      item({ custoReal: '7.5' }),
      item({ custoReal: null }),
    ];
    expect(totalGasto(itens)).toBe(20);
  });
});

describe('unidadeItem', () => {
  it('lê unidade conforme domínio', () => {
    expect(unidadeItem(item({ material: {
      id: 1, nome: 'A', unidade: { nome: 'kg' }, saldo: null, custoUnitario: null,
    } }))).toBe('kg');
    expect(unidadeItem(item({ epi: {
      id: 1, nome: 'B', unidadeMedida: { nome: 'par' },
    } }))).toBe('par');
    expect(unidadeItem(item({}))).toBe('un.');
  });
});

describe('campos de compra', () => {
  it('prioriza valor unitário planejado e calcula o total', () => {
    const i = item({
      quantidade: 3,
      valorUnitario: 4,
      material: {
        id: 1, nome: 'Cabo', unidade: null, saldo: null, custoUnitario: 10,
      },
    });
    expect(valorUnitarioItem(i)).toBe(4);
    expect(valorTotalItem(i)).toBe(12);
    expect(totalEstimado([i])).toBe(12);
  });

  it('usa custoReal quando a compra já foi efetivada', () => {
    const i = item({ quantidade: 3, valorUnitario: 4, custoReal: 10 });
    expect(valorTotalItem(i)).toBe(10);
  });

  it('usa o fornecedor do item e formata a data sem timezone', () => {
    const i = item({
      dataCompra: '2026-11-10T00:00:00.000Z',
      fornecedor: { id: 2, nome: 'ACME' },
    });
    expect(fornecedorItem(i)).toEqual({ id: 2, nome: 'ACME' });
    expect(dataCompraItem(i)).toBe('2026-11-10T00:00:00.000Z');
    expect(formatarData(i.dataCompra)).toBe('10/11/2026');
    expect(formatarData(null)).toBe('—');
  });
});
