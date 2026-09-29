// SYNC: keep in sync with the status badge in AtendimentosAdminPage.tsx
import type { StatusAtendimento } from '../schemas/index.js';

export const ROTULOS_STATUS: Record<StatusAtendimento, string> = {
  NOVO: 'NOVO',
  EM_ANDAMENTO: 'EM ANDAMENTO',
  ORCAMENTAMENTO: 'ORÇAMENTO',
  CONCLUIDO: 'CONCLUÍDO',
  INATIVO: 'INATIVO',
};

export const CORES_STATUS: Record<StatusAtendimento, string> = {
  NOVO: 'bg-info/15 text-info',
  EM_ANDAMENTO: 'bg-primary/15 text-primary',
  ORCAMENTAMENTO: 'bg-warning/15 text-warning',
  CONCLUIDO: 'bg-success/15 text-success',
  INATIVO: 'bg-destructive/15 text-destructive',
};
