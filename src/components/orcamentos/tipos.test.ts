import { describe, expect, it } from 'vitest';
import type {
  OrcamentoAdminDetalhe,
  OrcamentoAtividadeRow,
} from '../../lib/api';
import {
  adicionarLinha,
  atualizarLinha,
  chaveAtividade,
  estadoDeEdicao,
  estadoInicialWizard,
  isoParaData,
  montarInput,
  numero,
  removerAtividade,
  removerLinha,
  subtotalLinha,
  totaisDoEstado,
  validarAte,
  validarPasso,
  type AtividadeForm,
  type LinhaForm,
} from './tipos';

function linha(parcial: Partial<LinhaForm> = {}): LinhaForm {
  return {
    verboId: 11,
    objetoId: 22,
    localId: 33,
    caracteristicaId: 44,
    verboNome: 'Aplicar',
    objetoNome: 'Pintura',
    localNome: 'Parede',
    caracteristicaNome: 'Interna',
    descricao: 'Aplicar pintura na parede',
    unidadeId: 1,
    quantidade: null,
    areaM2: null,
    moValorHora: null,
    moPessoas: null,
    moHoras: null,
    materiais: [],
    ...parcial,
  };
}

function atividade(parcial: Partial<AtividadeForm> = {}): Omit<
  AtividadeForm,
  'linhas'
> {
  return {
    etapaId: 5,
    subServicoId: 7,
    catalogoAtividadeId: 'cat-1',
    etapaNome: 'Pintura',
    subServicoNome: 'Pintura residencial',
    catalogo: {
      id: 'cat-1',
      nome: 'Aplicar pintura',
      descricao: null,
      especialidadeNecessaria: 'Pintor',
      tempoEstimadoHoras: null,
      ativo: true,
      criadoEm: '2026-01-01T00:00:00.000Z',
      subSteps: [],
      recursos: [],
    },
    ...parcial,
  };
}

function row(parcial: Partial<OrcamentoAtividadeRow> = {}): OrcamentoAtividadeRow {
  return {
    id: 'a1',
    ordem: 1,
    etapaId: 5,
    subServicoId: 7,
    catalogoAtividadeId: 'cat-1',
    descricao: 'Aplicar pintura',
    verboId: 11,
    objetoId: 22,
    localId: 33,
    caracteristicaId: 44,
    unidadeId: 1,
    quantidade: '2',
    areaM2: '10.5',
    moValorHora: '55.5',
    moPessoas: 2,
    moHoras: '8',
    materiais: [],
    ...parcial,
  };
}

function detalhe(parcial: Partial<OrcamentoAdminDetalhe> = {}): OrcamentoAdminDetalhe {
  return {
    id: 1,
    codigo: 'ORC-0001',
    atendimentoId: 10,
    urgencia: 'URGENTE',
    status: 'RASCUNHO',
    valorTotal: '918',
    validade: '2026-10-25T12:00:00.000Z',
    observacoes: 'Obra no centro',
    areaM2: '100',
    valorM2: '50',
    motivoRejeicao: null,
    criadoPorId: 1,
    aprovadoPorId: null,
    aprovadoEm: null,
    confirmadoPorUser: false,
    dataConfirmacao: null,
    createdAt: '2026-09-25T00:00:00.000Z',
    updatedAt: '2026-09-25T00:00:00.000Z',
    visitaId: null,
    enderecoId: 2,
    servicoMarketingId: 3,
    ficha: null,
    atividades: [],
    ...parcial,
  };
}

describe('estadoInicialWizard', () => {
  it('começa no passo 1 com valores padrão', () => {
    const s = estadoInicialWizard();
    expect(s.passo).toBe(1);
    expect(s.atendimentoId).toBeNull();
    expect(s.urgencia).toBe('NORMAL');
    expect(s.atividades).toEqual([]);
    expect(s.ficha).toEqual({});
    expect(s.observacoes).toBe('');
    expect(isoParaData(new Date().toISOString()).length).toBe(10);
    expect(s.validade).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const esperado = new Date();
    esperado.setDate(esperado.getDate() + 30);
    const local = new Date(
      esperado.getTime() - esperado.getTimezoneOffset() * 60000,
    );
    expect(s.validade).toBe(local.toISOString().slice(0, 10));
  });

  it('aceita parciais', () => {
    const s = estadoInicialWizard({ atendimentoId: 9, passo: 2 });
    expect(s.atendimentoId).toBe(9);
    expect(s.passo).toBe(2);
    expect(s.urgencia).toBe('NORMAL');
  });
});

describe('transições de atividade/linha', () => {
  it('chave agrupa por etapa+sub+catálogo', () => {
    expect(chaveAtividade(atividade())).toBe('5:7:cat-1');
    expect(chaveAtividade(atividade({ subServicoId: 8 }))).toBe('5:8:cat-1');
  });

  it('adicionarLinha cria atividade e mescla pela chave', () => {
    let s = estadoInicialWizard();
    s = adicionarLinha(s, atividade(), linha());
    expect(s.atividades).toHaveLength(1);
    expect(s.atividades[0].linhas).toHaveLength(1);

    s = adicionarLinha(s, atividade(), linha({ descricao: 'Segunda linha' }));
    expect(s.atividades).toHaveLength(1);
    expect(s.atividades[0].linhas).toHaveLength(2);
    expect(s.atividades[0].linhas[1].descricao).toBe('Segunda linha');

    s = adicionarLinha(s, atividade({ subServicoId: 8 }), linha());
    expect(s.atividades).toHaveLength(2);
  });

  it('atualizarLinha aplica patch apenas no índice certo', () => {
    let s = adicionarLinha(
      estadoInicialWizard(),
      atividade(),
      linha({ descricao: 'A' }),
    );
    s = adicionarLinha(s, atividade(), linha({ descricao: 'B' }));
    s = atualizarLinha(s, 0, 1, { descricao: 'B editada', moPessoas: 3 });
    expect(s.atividades[0].linhas[0].descricao).toBe('A');
    expect(s.atividades[0].linhas[1].descricao).toBe('B editada');
    expect(s.atividades[0].linhas[1].moPessoas).toBe(3);
  });

  it('removerLinha remove a atividade quando fica sem linhas', () => {
    let s = adicionarLinha(estadoInicialWizard(), atividade(), linha());
    s = removerLinha(s, 0, 0);
    expect(s.atividades).toHaveLength(0);

    s = adicionarLinha(estadoInicialWizard(), atividade(), linha());
    s = adicionarLinha(s, atividade(), linha({ descricao: 'x' }));
    s = removerLinha(s, 0, 0);
    expect(s.atividades).toHaveLength(1);
    expect(s.atividades[0].linhas).toHaveLength(1);
  });

  it('removerAtividade remove por índice', () => {
    let s = adicionarLinha(estadoInicialWizard(), atividade(), linha());
    s = adicionarLinha(s, atividade({ subServicoId: 8 }), linha());
    s = removerAtividade(s, 0);
    expect(s.atividades).toHaveLength(1);
    expect(s.atividades[0].subServicoId).toBe(8);
  });
});

describe('validarPasso', () => {
  it('passo 1 exige atendimento e limite de observações', () => {
    expect(validarPasso(estadoInicialWizard(), 1)).toMatch(/atendimento/i);
    const ok = estadoInicialWizard({ atendimentoId: 1 });
    expect(validarPasso(ok, 1)).toBeNull();
    const longo = estadoInicialWizard({
      atendimentoId: 1,
      observacoes: 'x'.repeat(2001),
    });
    expect(validarPasso(longo, 1)).toMatch(/2000/);
  });

  it('passo 2 exige ao menos uma atividade', () => {
    expect(validarPasso(estadoInicialWizard(), 2)).toMatch(/atividade/i);
    const s = adicionarLinha(estadoInicialWizard(), atividade(), linha());
    expect(validarPasso(s, 2)).toBeNull();
  });

  it('passo 3 valida descrição, MO, quantidade, área e materiais', () => {
    const base = adicionarLinha(
      estadoInicialWizard(),
      atividade(),
      linha({ descricao: '  ' }),
    );
    expect(validarPasso(base, 3)).toMatch(/descrição/i);

    const mo = adicionarLinha(
      estadoInicialWizard(),
      atividade(),
      linha({ moPessoas: 0 }),
    );
    expect(validarPasso(mo, 3)).toMatch(/mão de obra/i);

    const mats = adicionarLinha(
      estadoInicialWizard(),
      atividade(),
      linha({
        materiais: [
          {
            materialId: 1,
            nome: 'Tinta',
            quantidade: 0,
            custoUnitario: 10,
          },
        ],
      }),
    );
    expect(validarPasso(mats, 3)).toMatch(/quantidade inválida/i);

    const ok = adicionarLinha(
      estadoInicialWizard(),
      atividade(),
      linha({
        moPessoas: 2,
        moHoras: 8,
        moValorHora: 55,
        areaM2: 10,
        quantidade: 2,
        materiais: [
          {
            materialId: 1,
            nome: 'Tinta',
            quantidade: 3,
            custoUnitario: 10,
          },
        ],
      }),
    );
    expect(validarPasso(ok, 3)).toBeNull();
  });

  it('passo 4 exige validade parseável', () => {
    expect(validarPasso(estadoInicialWizard({ validade: '' }), 4)).toMatch(
      /validade/i,
    );
    expect(validarPasso(estadoInicialWizard({ validade: 'foo' }), 4)).toMatch(
      /inválida/i,
    );
    expect(
      validarPasso(estadoInicialWizard({ validade: '2026-10-01' }), 4),
    ).toBeNull();
  });

  it('validarAte falha no primeiro passo com erro', () => {
    expect(validarAte(estadoInicialWizard(), 3)).toMatch(/atendimento/i);
    const s1 = estadoInicialWizard({ atendimentoId: 1 });
    expect(validarAte(s1, 3)).toMatch(/atividade/i);
  });
});

describe('montarInput', () => {
  it('converte datas, limpa textos e remove campos de exibição', () => {
    const s = estadoInicialWizard({
      atendimentoId: 10,
      validade: '2026-10-01',
      observacoes: '  notas  ',
      atividades: [],
    });
    const comAtividade = adicionarLinha(
      s,
      atividade(),
      linha({
        descricao: '  Aplicar pintura  ',
        materiais: [
          { materialId: 5, nome: 'Tinta', quantidade: 3, custoUnitario: 12 },
        ],
      }),
    );
    const input = montarInput(comAtividade);

    expect(input.atendimentoId).toBe(10);
    expect(input.observacoes).toBe('notas');
    expect(input.validade).toBe(
      new Date('2026-10-01T12:00:00').toISOString(),
    );
    expect(input.ficha).toBeUndefined();
    expect(input.atividades).toHaveLength(1);

    const a = input.atividades[0];
    expect(a.catalogoAtividadeId).toBe('cat-1');
    expect(Object.keys(a)).not.toContain('etapaNome');
    expect(Object.keys(a)).not.toContain('catalogo');

    const l = a.linhas[0];
    expect(l.descricao).toBe('Aplicar pintura');
    expect('verboNome' in l).toBe(false);
    expect(l.materiais).toEqual([{ materialId: 5, quantidade: 3 }]);
  });

  it('inclui ficha apenas quando há conteúdo e limpa campos de texto', () => {
    const s = estadoInicialWizard({
      atendimentoId: 1,
      validade: '2026-10-01',
      ficha: {
        acabamentoPiso: 'CERAMICA',
        risco1: '  risco  ',
        acao1: '   ',
        cuidados: [' cuidar ', '', 'proteger'],
      },
    });
    const input = montarInput(s);
    expect(input.ficha).toBeDefined();
    expect(input.ficha?.acabamentoPiso).toBe('CERAMICA');
    expect(input.ficha?.risco1).toBe('risco');
    expect(input.ficha?.acao1).toBeNull();
    expect(input.ficha?.cuidados).toEqual(['cuidar', 'proteger']);
  });

  it('lança sem atendimento', () => {
    expect(() => montarInput(estadoInicialWizard())).toThrow(
      /atendimento/i,
    );
  });
});

describe('totais', () => {
  it('soma MO, materiais e base área×valor/m²', () => {
    const s = estadoInicialWizard({
      areaM2: 100,
      valorM2: 50,
      atividades: [],
    });
    const comAtividade = adicionarLinha(
      s,
      atividade(),
      linha({
        moPessoas: 2,
        moHoras: 8,
        moValorHora: 55.5,
        materiais: [
          { materialId: 1, nome: 'Tinta', quantidade: 3, custoUnitario: 10 },
        ],
      }),
    );
    const t = totaisDoEstado(comAtividade);
    expect(t.valorMO).toBe(888);
    expect(t.valorMateriais).toBe(30);
    expect(t.total).toBe(5918);
  });

  it('subtotalLinha = MO + materiais', () => {
    expect(
      subtotalLinha(
        linha({
          moPessoas: 2,
          moHoras: 4,
          moValorHora: 10,
          materiais: [
            { materialId: 1, nome: 'x', quantidade: 2, custoUnitario: 7.5 },
          ],
        }),
      ),
    ).toBe(95);
  });
});

describe('estadoDeEdicao', () => {
  it('regroupa linhas pela chave preservando a ordem', () => {
    const det = detalhe({
      atividades: [
        row({ id: 'a2', ordem: 2, descricao: 'Segunda' }),
        row({ id: 'a1', ordem: 1, descricao: 'Primeira' }),
        row({
          id: 'a3',
          ordem: 3,
          subServicoId: 9,
          descricao: 'Outra sub' as string,
        }),
      ],
    });
    const s = estadoDeEdicao(det);
    expect(s.atividades).toHaveLength(2);
    expect(s.atividades[0].linhas[0].descricao).toBe('Primeira');
    expect(s.atividades[0].linhas[1].descricao).toBe('Segunda');
    expect(s.atividades[1].subServicoId).toBe(9);
    expect(s.validade).toBe('2026-10-25');
    expect(s.areaM2).toBe(100);
    expect(s.valorM2).toBe(50);
    expect(s.urgencia).toBe('URGENTE');
    expect(s.observacoes).toBe('Obra no centro');
    expect(s.enderecoId).toBe(2);
    expect(s.servicoMarketingId).toBe(3);
    expect(s.ficha).toEqual({});
  });

  it('usa o resolver para nomes e catálogo; fallback #id', () => {
    const det = detalhe({
      atividades: [
        row({
          materiais: [
            {
              materialId: 5,
              quantidade: '2',
              custoUnitario: '10',
              material: { id: 5, nome: 'Tinta fosca' },
            },
          ],
        }),
      ],
    });
    const s = estadoDeEdicao(det, {
      etapaNome: (id) => (id === 5 ? 'Pintura' : undefined),
      subServicoNome: (id) => (id === 7 ? 'Residencial' : undefined),
      catalogo: (id) =>
        id === 'cat-1'
          ? {
              ...atividade().catalogo,
              nome: 'Aplicar pintura 2 demãos',
            }
          : undefined,
      termoNome: (dim, id) =>
        dim === 'verbos' && id === 11 ? 'Aplicar' : undefined,
    });
    const a = s.atividades[0];
    expect(a.etapaNome).toBe('Pintura');
    expect(a.subServicoNome).toBe('Residencial');
    expect(a.catalogo.nome).toBe('Aplicar pintura 2 demãos');
    const l = a.linhas[0];
    expect(l.verboNome).toBe('Aplicar');
    expect(l.objetoNome).toBe('#22');
    expect(l.areaM2).toBe(10.5);
    expect(l.moHoras).toBe(8);
    expect(l.materiais[0]).toEqual({
      materialId: 5,
      nome: 'Tinta fosca',
      quantidade: 2,
      custoUnitario: 10,
    });
  });

  it('usa placeholder de catálogo e nome de material sem relation', () => {
    const det = detalhe({
      atividades: [
        row({
          catalogoAtividadeId: 'outro-id-abc',
          materiais: [
            { materialId: 9, quantidade: '1', custoUnitario: '4.5' },
          ],
        }),
      ],
    });
    const s = estadoDeEdicao(det);
    expect(s.atividades[0].catalogo.id).toBe('outro-id-abc');
    expect(s.atividades[0].catalogo.nome).toMatch(/Atividade/);
    expect(s.atividades[0].linhas[0].materiais[0].nome).toBe('#9');
  });

  it('hidrata ficha quando existe', () => {
    const det = detalhe({
      ficha: {
        areaPisoM2: '12.5',
        acabamentoPiso: 'PORCELANATO',
        caixasLuz: 4,
        cuidados: ['um', 'dois'],
        risco1: 'risco 1',
        acao1: 'ação 1',
      },
    });
    const s = estadoDeEdicao(det);
    expect(s.ficha.areaPisoM2).toBe(12.5);
    expect(s.ficha.acabamentoPiso).toBe('PORCELANATO');
    expect(s.ficha.caixasLuz).toBe(4);
    expect(s.ficha.cuidados).toEqual(['um', 'dois']);
    expect(s.ficha.risco1).toBe('risco 1');
    expect(s.ficha.acao1).toBe('ação 1');
  });
});

describe('numero', () => {
  it('converte strings do Prisma Decimal', () => {
    expect(numero('10.5')).toBe(10.5);
    expect(numero(7)).toBe(7);
    expect(numero(null)).toBeNull();
    expect(numero(undefined)).toBeNull();
    expect(numero('')).toBeNull();
    expect(numero('abc')).toBeNull();
  });
});
