import { describe, expect, it } from 'vitest';
import { type OrcamentoAdminItem, rascunhoParaRetomar } from './orcamentos-admin';

function item(sobre: Partial<OrcamentoAdminItem>): OrcamentoAdminItem {
  return {
    id: 1,
    codigo: 'ORM-001',
    atendimentoId: 2,
    agendamentoId: null,
    urgencia: 'NORMAL' as OrcamentoAdminItem['urgencia'],
    status: 'RASCUNHO' as OrcamentoAdminItem['status'],
    valorTotal: 0,
    validade: '',
    observacoes: null,
    areaM2: null,
    valorM2: null,
    motivoRejeicao: null,
    criadoPorId: 1,
    aprovadoPorId: null,
    aprovadoEm: null,
    confirmadoPorUser: false,
    dataConfirmacao: null,
    createdAt: '2026-10-08T10:00:00.000Z',
    updatedAt: '2026-10-08T10:00:00.000Z',
    ...sobre,
  };
}

describe('rascunhoParaRetomar', () => {
  it('retorna null para lista vazia', () => {
    expect(rascunhoParaRetomar([])).toBeNull();
  });

  it('retorna null quando nenhum orçamento é editável', () => {
    const lista = [
      item({ id: 3, status: 'APROVADO' as OrcamentoAdminItem['status'] }),
      item({ id: 4, status: 'RECUSADO' as OrcamentoAdminItem['status'] }),
    ];
    expect(rascunhoParaRetomar(lista)).toBeNull();
  });

  it('retorna o primeiro RASCUNHO/ENVIADO na ordem da lista (mais recente)', () => {
    const aprovado = item({
      id: 1,
      status: 'APROVADO' as OrcamentoAdminItem['status'],
    });
    const rascunho = item({ id: 2 });
    const enviado = item({
      id: 3,
      status: 'ENVIADO' as OrcamentoAdminItem['status'],
    });
    expect(rascunhoParaRetomar([aprovado, rascunho, enviado])).toBe(rascunho);
  });

  it('aceita ENVIADO quando não há rascunho', () => {
    const enviado = item({
      id: 7,
      status: 'ENVIADO' as OrcamentoAdminItem['status'],
    });
    expect(rascunhoParaRetomar([enviado])).toBe(enviado);
  });
});
