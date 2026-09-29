import type { StatusAtendimento } from '../schemas/index.js';
import type { AtendimentoItem } from './api/atendimentos.js';

/** Espelha `AcaoAtendimento` de imper_api/src/atendimentos/cascata.ts */
export type AcaoAtendimento =
  | 'MUDAR_STATUS:EM_ANDAMENTO'
  | 'MUDAR_STATUS:ORCAMENTAMENTO'
  | 'CRIAR_AGENDAMENTO'
  | 'CRIAR_VISITA'
  | 'CRIAR_ORCAMENTO'
  | 'ENCERRAR';

export interface AcaoUI {
  label: string;
  tone: 'primary' | 'outline' | 'success' | 'destructive' | 'muted';
  status?: StatusAtendimento;
  encaminhar?: boolean;
  criarOrcamento?: boolean;
  nota?: boolean;
}

export function montarAcoesAtendimento(item: AtendimentoItem): AcaoUI[] {
  const acoes: AcaoUI[] = [];
  for (const acao of item.proximasAcoes ?? []) {
    switch (acao) {
      case 'MUDAR_STATUS:EM_ANDAMENTO':
        acoes.push({
          label: 'Iniciar atendimento',
          status: 'EM_ANDAMENTO',
          tone: 'primary',
        });
        break;
      case 'MUDAR_STATUS:ORCAMENTAMENTO':
        if (item.status === 'NOVO') {
          acoes.push({
            label: 'Encaminhar p/ orçamento',
            encaminhar: true,
            tone: 'primary',
          });
        } else {
          acoes.push({
            label: 'Enviar p/ orçamento',
            status: 'ORCAMENTAMENTO',
            tone: 'primary',
          });
        }
        break;
      case 'CRIAR_ORCAMENTO':
        acoes.push({
          label: 'Criar orçamento',
          criarOrcamento: true,
          tone: 'outline',
        });
        break;
      case 'CRIAR_AGENDAMENTO':
        break;
      case 'CRIAR_VISITA':
        acoes.push({ label: 'Criar visita', nota: true, tone: 'muted' });
        break;
      case 'ENCERRAR':
        acoes.push({
          label: 'Concluir',
          status: 'CONCLUIDO',
          tone: 'success',
        });
        acoes.push({
          label: 'Inativar',
          status: 'INATIVO',
          tone: 'destructive',
        });
        break;
    }
  }
  return acoes;
}

export function acaoPresente(
  item: AtendimentoItem,
  acao: AcaoAtendimento,
): boolean {
  return (item.proximasAcoes ?? []).includes(acao);
}

export function filtrarAtendimentosParaOrcamento(
  itens: AtendimentoItem[],
): AtendimentoItem[] {
  return itens.filter((a) => acaoPresente(a, 'CRIAR_ORCAMENTO'));
}
