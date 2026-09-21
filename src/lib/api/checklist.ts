import { api } from './core.js';
import type { SubStepItem } from './catalogo-atividades.js';

export interface ChecklistItem {
  id: string;
  atividadeOSId: string;
  subStepAtividadeId: string;
  status: string;
  descricao?: string;
  concluidoPorId: number | null;
  dataConclusao: string | null;
  observacao: string | null;
  subStepAtividade?: SubStepItem;
  concluidoPor?: { id: number; nome: string } | null;
}

export async function listarChecklistPendentesEquipe(
  equipeId?: string,
): Promise<ChecklistItem[]> {
  const queryStr = equipeId ? `/${equipeId}` : '';
  return api.get<ChecklistItem[]>(`/checklist/equipe${queryStr}/pendentes`);
}
