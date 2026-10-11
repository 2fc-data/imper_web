import { api } from './core.js';

export interface ChecklistItem {
  id: string;
  status: string;
  descricao: string;
  ordem: number;
  concluidoPorId: number | null;
  dataConclusao: string | null;
  observacao: string | null;
  concluidoPor?: { id: number; nome: string } | null;
}
