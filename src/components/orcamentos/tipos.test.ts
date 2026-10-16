import { describe, expect, it } from 'vitest';
import type {
  OrcamentoAdminDetalhe,
  OrcamentoAtividadeRow,
} from '../../lib/api';
import {
  PASSOS,
  OPCOES_VALIDADE,
  adicionarLinha,
  atualizarLinha,
  chaveAtividade,
  dataBr,
  diasDeValidade,
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
  validadeDiasParaData,
  mapearItensParaAtividades,
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
    epis: [],
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
    etapaNome: 'Pintura',
    etapaOrdem: 0,
    subServicoNome: 'Pintura residencial',
    ...parcial,
  };
}

function row(parcial: Partial<OrcamentoAtividadeRow> = {}): OrcamentoAtividadeRow {
  return {
    id: 'a1',
    ordem: 1,
    etapaId: 5,
    subServicoId: 7,
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
    agendamentoId: null,
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
  it('chave agrupa por etapa+sub-serviço', () => {
    expect(chaveAtividade(atividade())).toBe('5:7');
    expect(chaveAtividade(atividade({ subServicoId: 8 }))).toBe('5:8');
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

describe('PASSOS', () => {
  it('tem 3 passos: Cobertura absorve a precificação', () => {
    expect(PASSOS.map((p) => p.passo)).toEqual([1, 2, 3]);
    expect(PASSOS.map((p) => p.titulo)).toEqual([
      'Cliente & Serviço',
      'Cobertura',
      'Ficha & Resumo',
    ]);
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

  it('passo 2 exige ao menos uma atividade e linhas em cada atividade', () => {
    expect(validarPasso(estadoInicialWizard(), 2)).toMatch(/atividade/i);
    const s = adicionarLinha(estadoInicialWizard(), atividade(), linha());
    expect(validarPasso(s, 2)).toBeNull();

    const semLinhas = estadoInicialWizard({
      atividades: [{ ...atividade(), linhas: [] }],
    });
    expect(validarPasso(semLinhas, 2)).toMatch(/sem linhas/i);
  });

  it('passo 2 não valida medidas/preços (zod do servidor é a autoridade)', () => {
    const s = adicionarLinha(
      estadoInicialWizard(),
      atividade(),
      linha({
        areaM2: -5,
        quantidade: -1,
        moPessoas: 0,
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
    expect(validarPasso(s, 2)).toBeNull();
  });

  it('passo 3 exige validade e pares risco/ação', () => {
    expect(validarPasso(estadoInicialWizard({ validade: '' }), 3)).toMatch(
      /validade/i,
    );
    expect(validarPasso(estadoInicialWizard({ validade: 'foo' }), 3)).toMatch(
      /inválida/i,
    );
    expect(
      validarPasso(estadoInicialWizard({ validade: '2026-10-01' }), 3),
    ).toBeNull();
    expect(
      validarPasso(
        estadoInicialWizard({
          validade: '2026-10-01',
          ficha: { risco1: 'Queda', acao1: null },
        }),
        3,
      ),
    ).toMatch(/risco 1 sem a ação/i);
    expect(
      validarPasso(
        estadoInicialWizard({
          validade: '2026-10-01',
          ficha: { risco1: null, acao1: 'Proteger' },
        }),
        3,
      ),
    ).toMatch(/ação 1 sem o risco/i);
    expect(
      validarPasso(
        estadoInicialWizard({
          validade: '2026-10-01',
          ficha: { risco1: 'Queda', acao1: 'Proteger' },
        }),
        3,
      ),
    ).toBeNull();
  });

  it('OPCOES_VALIDADE e helpers de validade', () => {
    expect([...OPCOES_VALIDADE]).toEqual([15, 20, 30]);
    const d15 = validadeDiasParaData(15);
    expect(diasDeValidade(d15)).toBe(15);
    expect(diasDeValidade(validadeDiasParaData(20))).toBe(20);
    expect(diasDeValidade(validadeDiasParaData(30))).toBe(30);
    expect(diasDeValidade('2026-11-01')).toBeNull();
    expect(diasDeValidade('')).toBeNull();
    expect(dataBr('2026-10-01')).toBe('01/10/2026');
    expect(dataBr('')).toBe('—');
  });

  it('validarAte falha no primeiro passo com erro', () => {
    expect(validarAte(estadoInicialWizard(), 3)).toMatch(/atendimento/i);
    const s1 = estadoInicialWizard({ atendimentoId: 1 });
    expect(validarAte(s1, 3)).toMatch(/atividade/i);
    const s2 = adicionarLinha(s1, atividade(), linha());
    expect(validarAte(s2, 3)).toBeNull();
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
    expect(Object.keys(a)).not.toContain('etapaNome');
    expect(Object.keys(a)).not.toContain('catalogo');

    const l = a.linhas[0];
    expect(l.descricao).toBe('Aplicar pintura');
    expect('verboNome' in l).toBe(false);
    expect(l.materiais).toEqual([{ materialId: 5, quantidade: 3 }]);
  });

  it('mapeia epis sem campos de exibição', () => {
    const s = estadoInicialWizard({
      atendimentoId: 10,
      validade: '2026-10-01',
    });
    const comEpi = adicionarLinha(
      s,
      atividade(),
      linha({
        epis: [
          {
            epiId: 7,
            nome: 'Luva nitrílica',
            codigo: 'EP-007',
            quantidade: 2,
            custoUnitario: 12.5,
          },
          {
            epiId: 8,
            nome: 'Óculos',
            quantidade: 1,
            custoUnitario: null,
          },
        ],
      }),
    );
    const input = montarInput(comEpi);
    expect(input.atividades[0].linhas[0].epis).toEqual([
      { epiId: 7, quantidade: 2, custoUnitario: 12.5 },
      { epiId: 8, quantidade: 1, custoUnitario: null },
    ]);
    expect('nome' in input.atividades[0].linhas[0].epis![0]).toBe(false);
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
  it('soma MO, materiais e EPIs sem base área×valor/m²', () => {
    const s = estadoInicialWizard({
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
    expect(t.total).toBe(918);
  });

  it('soma EPIs em valorEpis e no total', () => {
    const s = adicionarLinha(
      estadoInicialWizard(),
      atividade(),
      linha({
        epis: [
          { epiId: 1, nome: 'Luva', quantidade: 2, custoUnitario: 12.5 },
          { epiId: 2, nome: 'Óculos', quantidade: 1, custoUnitario: 30 },
        ],
      }),
    );
    const t = totaisDoEstado(s);
    expect(t.valorEpis).toBe(55);
    expect(t.total).toBe(55);
  });

  it('subtotalLinha = MO + materiais + EPIs', () => {
    expect(
      subtotalLinha(
        linha({
          moPessoas: 2,
          moHoras: 4,
          moValorHora: 10,
          materiais: [
            { materialId: 1, nome: 'x', quantidade: 2, custoUnitario: 7.5 },
          ],
          epis: [
            { epiId: 3, nome: 'Capacete', quantidade: 2, custoUnitario: 5 },
          ],
        }),
      ),
    ).toBe(105);
  });

  it('EPI sem preço cadastrado conta como 0', () => {
    expect(
      subtotalLinha(
        linha({
          epis: [
            { epiId: 9, nome: 'Sem preço', quantidade: 3, custoUnitario: null },
          ],
        }),
      ),
    ).toBe(0);
  });
});

describe('estadoDeEdicao', () => {
  it('hidrata visitaId e agendamentoId da visita vinculada', () => {
    const s = estadoDeEdicao(detalhe({ visitaId: 5, agendamentoId: 3 }));
    expect(s.visitaId).toBe(5);
    expect(s.agendamentoId).toBe(3);
    expect(estadoDeEdicao(detalhe()).agendamentoId).toBeNull();
  });

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
    expect(s.urgencia).toBe('URGENTE');
    expect(s.observacoes).toBe('Obra no centro');
    expect(s.enderecoId).toBe(2);
    expect(s.servicoMarketingId).toBe(3);
    expect(s.ficha).toEqual({});
  });

  it('usa o resolver para nomes; fallback #id', () => {
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
      termoNome: (dim, id) =>
        dim === 'verbos' && id === 11 ? 'Aplicar' : undefined,
    });
    const a = s.atividades[0];
    expect(a.etapaNome).toBe('Pintura');
    expect(a.subServicoNome).toBe('Residencial');
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

  it('nome de material sem relation usa #id', () => {
    const det = detalhe({
      atividades: [
        row({
          materiais: [
            { materialId: 9, quantidade: '1', custoUnitario: '4.5' },
          ],
        }),
      ],
    });
    const s = estadoDeEdicao(det);
    expect(s.atividades[0].linhas[0].materiais[0].nome).toBe('#9');
  });

  it('hidrata epis do snapshot (nome via relation, fallback #id)', () => {
    const det = detalhe({
      atividades: [
        row({
          epis: [
            {
              epiId: 7,
              quantidade: '2',
              custoUnitario: '12.5',
              epi: { id: 7, nome: 'Luva nitrílica', codigo: 'EP-007' },
            },
            { epiId: 9, quantidade: '1', custoUnitario: '0.75' },
          ],
        }),
      ],
    });
    const s = estadoDeEdicao(det);
    expect(s.atividades[0].linhas[0].epis).toEqual([
      {
        epiId: 7,
        nome: 'Luva nitrílica',
        codigo: 'EP-007',
        quantidade: 2,
        custoUnitario: 12.5,
      },
      {
        epiId: 9,
        nome: '#9',
        codigo: null,
        quantidade: 1,
        custoUnitario: 0.75,
      },
    ]);
  });

  it('linha sem epis hidrata lista vazia', () => {
    const s = estadoDeEdicao(detalhe({ atividades: [row()] }));
    expect(s.atividades[0].linhas[0].epis).toEqual([]);
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

describe('mapearItensParaAtividades', () => {
  it('agrupa itens por etapa e sub-serviço e mapeia medições para LinhaForm', () => {
    const itens = [
      {
        etapaId: 1,
        subServicoId: 10,
        verboId: 100,
        objetoId: 200,
        localId: 300,
        caracteristicaId: 400,
        unidadeId: 5,
        quantidade: 15,
        areaM2: 50.5,
        observacoes: 'Item 1 da etapa 1',
        etapa: { id: 1, nome: 'Preparação', ordem: 1 },
        subServico: { id: 10, nome: 'Limpeza de superfície' },
        verbo: { id: 100, nome: 'Limpar' },
        objeto: { id: 200, nome: 'Laje' },
        local: { id: 300, nome: 'Cobertura' },
        caracteristica: { id: 400, nome: 'Exposta' },
      },
      {
        etapaId: 1,
        subServicoId: 10,
        verboId: 101,
        objetoId: 201,
        observacoes: 'Item 2 da etapa 1',
        etapa: { id: 1, nome: 'Preparação', ordem: 1 },
        subServico: { id: 10, nome: 'Limpeza de superfície' },
        verbo: { id: 101, nome: 'Remover' },
        objeto: { id: 201, nome: 'Resíduos' },
      },
      {
        etapaId: 2,
        subServicoId: 20,
        verboId: 102,
        objetoId: 202,
        areaM2: 50.5,
        observacoes: 'Item da etapa 2',
        etapa: { id: 2, nome: 'Impermeabilização', ordem: 2 },
        subServico: { id: 20, nome: 'Aplicação de Manta' },
        verbo: { id: 102, nome: 'Aplicar' },
        objeto: { id: 202, nome: 'Manta asfáltica' },
      },
    ];

    const atividades = mapearItensParaAtividades(itens);
    expect(atividades).toHaveLength(2);

    expect(atividades[0].etapaId).toBe(1);
    expect(atividades[0].subServicoId).toBe(10);
    expect(atividades[0].linhas).toHaveLength(2);
    expect(atividades[0].linhas[0].areaM2).toBe(50.5);
    expect(atividades[0].linhas[0].quantidade).toBe(15);
    expect(atividades[0].linhas[0].descricao).toBe('Item 1 da etapa 1');

    expect(atividades[1].etapaId).toBe(2);
    expect(atividades[1].subServicoId).toBe(20);
    expect(atividades[1].linhas).toHaveLength(1);
    expect(atividades[1].linhas[0].areaM2).toBe(50.5);
    expect(atividades[1].linhas[0].descricao).toBe('Item da etapa 2');
  });
});

