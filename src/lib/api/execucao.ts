import { api } from './core.js';

export type StatusExecucao =
  | 'PENDENTE'
  | 'EM_ANDAMENTO'
  | 'CONCLUIDA'
  | 'CANCELADA';

export interface ExecucaoAtividadeItem {
  id: number;
  atividadeId: number;
  status: StatusExecucao;
  criadoEm: string;
  atualizadoEm?: string;
  atividade: {
    id: number;
    descricao: string;
    obraEtapa: { id: number; nome: string; obraId: number };
  };
  checklist?: unknown[];
  separacoes?: unknown[];
}

export function listarExecucoes(obraId?: number) {
  return api.get<ExecucaoAtividadeItem[]>(
    '/execucao',
    obraId != null ? { obraId } : undefined,
  );
}

export function detalharExecucao(id: number) {
  return api.get<
    ExecucaoAtividadeItem & {
      retiradas?: unknown[];
      entregasEpi?: unknown[];
    }
  >(`/execucao/${id}`);
}

export function planificarExecucao(atividadeId: number) {
  return api.post<ExecucaoAtividadeItem>('/execucao/planificar', {
    atividadeId,
  });
}

export function mudarStatusExecucao(id: number, status: StatusExecucao) {
  return api.patch<ExecucaoAtividadeItem>(`/execucao/${id}/status`, {
    status,
  });
}
