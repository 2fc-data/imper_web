import { describe, expect, it } from 'vitest';
import type { AtendimentoItem } from './api/atendimentos.js';
import type { AcaoAtendimento } from './proximas-acoes.js';
import {
  acaoPresente,
  filtrarAtendimentosParaOrcamento,
  montarAcoesAtendimento,
} from './proximas-acoes.js';

function item(partial: Partial<AtendimentoItem>): AtendimentoItem {
  return {
    id: 1,
    canal: 'WHATSAPP',
    urgencia: null,
    status: 'NOVO',
    descricao: null,
    userId: 1,
    atendenteId: null,
    createdAt: '2026-09-28T00:00:00.000Z',
    updatedAt: '2026-09-28T00:00:00.000Z',
    visitaSolicitada: false,
    proximasAcoes: [] as AcaoAtendimento[],
    ...partial,
  };
}

describe('montarAcoesAtendimento', () => {
  it('NOVO → sem botão de iniciar, só Concluir + Inativar', () => {
    const acoes = montarAcoesAtendimento(
      item({
        status: 'NOVO',
        proximasAcoes: ['MUDAR_STATUS:EM_ANDAMENTO', 'ENCERRAR'],
      }),
    );
    expect(acoes.map((a) => a.label)).toEqual(['Finalizar Atendimento', 'Inativar']);
    expect(acoes[0]).toMatchObject({ status: 'CONCLUIDO', tone: 'success' });
    expect(acoes[1]).toMatchObject({ status: 'INATIVO', tone: 'destructive' });
  });

  it('NOVO com MUDAR_STATUS:ORCAMENTAMENTO → Encaminhar p/ orçamento', () => {
    const acoes = montarAcoesAtendimento(
      item({ status: 'NOVO', proximasAcoes: ['MUDAR_STATUS:ORCAMENTAMENTO'] }),
    );
    expect(acoes).toHaveLength(1);
    expect(acoes[0]).toMatchObject({
      label: 'Encaminhar p/ orçamento',
      encaminhar: true,
      tone: 'primary',
    });
    expect(acoes[0].status).toBeUndefined();
  });

  it('EM_ANDAMENTO com MUDAR_STATUS:ORCAMENTAMENTO → Enviar p/ orçamento', () => {
    const acoes = montarAcoesAtendimento(
      item({
        status: 'EM_ANDAMENTO',
        proximasAcoes: ['MUDAR_STATUS:ORCAMENTAMENTO'],
      }),
    );
    expect(acoes[0]).toMatchObject({
      label: 'Enviar p/ orçamento',
      status: 'ORCAMENTAMENTO',
      tone: 'primary',
    });
  });

  it('ORCAMENTAMENTO → Atendimento em andamento + Criar orçamento + Encerrar', () => {
    const acoes = montarAcoesAtendimento(
      item({
        status: 'ORCAMENTAMENTO',
        proximasAcoes: [
          'MUDAR_STATUS:EM_ANDAMENTO',
          'CRIAR_ORCAMENTO',
          'ENCERRAR',
        ],
      }),
    );
    expect(acoes.map((a) => a.label)).toEqual([
      'Atendimento em andamento',
      'Criar orçamento',
      'Finalizar Atendimento',
      'Inativar',
    ]);
    expect(acoes[1]).toMatchObject({ criarOrcamento: true, tone: 'outline' });
  });

  it('CRIAR_AGENDAMENTO não vira botão (só acaoPresente)', () => {
    const acoes = montarAcoesAtendimento(
      item({ proximasAcoes: ['CRIAR_AGENDAMENTO', 'ENCERRAR'] }),
    );
    expect(acoes.map((a) => a.label)).toEqual(['Finalizar Atendimento', 'Inativar']);
  });

  it('CRIAR_VISITA → nota Criar visita (muted)', () => {
    const acoes = montarAcoesAtendimento(
      item({ proximasAcoes: ['CRIAR_VISITA'] }),
    );
    expect(acoes).toEqual([
      { label: 'Criar visita', nota: true, tone: 'muted' },
    ]);
  });

  it('terminal CONCLUIDO sem ações → lista vazia', () => {
    const acoes = montarAcoesAtendimento(
      item({ status: 'CONCLUIDO', proximasAcoes: [] }),
    );
    expect(acoes).toEqual([]);
  });
});

describe('acaoPresente', () => {
  it('true quando a ação está em proximasAcoes', () => {
    const it = item({ proximasAcoes: ['CRIAR_ORCAMENTO'] });
    expect(acaoPresente(it, 'CRIAR_ORCAMENTO')).toBe(true);
    expect(acaoPresente(it, 'CRIAR_AGENDAMENTO')).toBe(false);
  });
});

describe('filtrarAtendimentosParaOrcamento', () => {
  it('mantém apenas itens com CRIAR_ORCAMENTO', () => {
    const com = item({ id: 1, proximasAcoes: ['CRIAR_ORCAMENTO'] });
    const sem = item({ id: 2, proximasAcoes: ['MUDAR_STATUS:EM_ANDAMENTO'] });
    const outro = item({ id: 3, proximasAcoes: ['CRIAR_VISITA'] });
    expect(filtrarAtendimentosParaOrcamento([com, sem, outro])).toEqual([com]);
  });
});
