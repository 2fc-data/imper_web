import { describe, expect, it } from 'vitest';
import { alternarColaborador, filtrarApenasColaboradores } from './MultiSelectColaboradores';

describe('alternarColaborador', () => {
  it('adiciona um colaborador quando não está selecionado', () => {
    expect(alternarColaborador([], 10)).toEqual([10]);
    expect(alternarColaborador([10], 20)).toEqual([10, 20]);
  });

  it('remove um colaborador quando já está selecionado', () => {
    expect(alternarColaborador([10, 20], 10)).toEqual([20]);
    expect(alternarColaborador([10], 10)).toEqual([]);
  });

  it('permite múltiplos colaboradores selecionados simultaneamente', () => {
    let selecionados: number[] = [];
    selecionados = alternarColaborador(selecionados, 1);
    selecionados = alternarColaborador(selecionados, 2);
    selecionados = alternarColaborador(selecionados, 3);
    expect(selecionados).toEqual([1, 2, 3]);

    selecionados = alternarColaborador(selecionados, 2);
    expect(selecionados).toEqual([1, 3]);
  });
});

describe('filtrarApenasColaboradores', () => {
  it('apresenta somente users com papel de Colaboradores', () => {
    const lista = [
      {
        id: 1,
        nome: 'João Técnico',
        papeis: [{ papel: { id: 1, nome: 'COLABORADOR' } }],
      },
      {
        id: 2,
        nome: 'Maria Gerente',
        papeis: [{ papel: { id: 2, nome: 'ADMINISTRATIVO' } }],
      },
      {
        id: 3,
        nome: 'Carlos Operacional',
        papeis: [{ papel: { id: 3, nome: 'Colaborador' } }],
      },
      {
        id: 4,
        nome: 'Ana Atendimento',
        papeis: [{ papel: { id: 4, nome: 'ATENDIMENTO' } }],
      },
    ];

    const resultado = filtrarApenasColaboradores(lista);
    expect(resultado).toHaveLength(2);
    expect(resultado.map((c) => c.nome)).toEqual(['João Técnico', 'Carlos Operacional']);
  });

  it('rejeita usuários sem a lista de papéis ou com papéis vazios', () => {
    const lista = [
      { id: 1, nome: 'João Técnico' },
      { id: 2, nome: 'Carlos Sem Papel', papeis: [] },
    ];
    expect(filtrarApenasColaboradores(lista)).toEqual([]);
  });
});

