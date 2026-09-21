import { api } from './core.js';
import type { CatalogoAtividadeItem } from './catalogo-atividades.js';
import type { EquipeItem } from './equipes.js';
import type { ChecklistItem } from './checklist.js';

export interface AtividadeOSItem {
  id: string;
  osId: number;
  faseOSId: number | null;
  catalogoAtividadeId: string;
  catalogoId?: string;
  equipeId: string | null;
  status: string;
  dataPrevisao: string | null;
  criadoEm: string;
  os?: { id: number; codigo: string; numero?: string };
  faseOS?: { id: number; nome: string };
  catalogoAtividade?: CatalogoAtividadeItem;
  catalogo?: CatalogoAtividadeItem;
  equipe?: EquipeItem;
  checklist?: ChecklistItem[];
}

export async function listarAtividadesOS(params?: {
  osId?: number;
  faseOSId?: number;
  status?: string;
}): Promise<AtividadeOSItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.osId) searchParams.set('osId', String(params.osId));
  if (params?.faseOSId) searchParams.set('faseOSId', String(params.faseOSId));
  if (params?.status) searchParams.set('status', params.status);
  const queryStr = searchParams.toString();
  return api.get<AtividadeOSItem[]>(
    `/atividades-os${queryStr ? `?${queryStr}` : ''}`,
  );
}

export async function planificarAtividades(input: {
  osId: number;
  faseOSId: number;
  atividades: {
    catalogoAtividadeId: string;
    equipeId?: string;
    dataPrevisao?: string;
  }[];
}): Promise<AtividadeOSItem[]> {
  return api.post<AtividadeOSItem[]>('/atividades-os/planificar', input);
}
