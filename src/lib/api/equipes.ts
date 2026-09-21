import { api } from './core.js';
import type { AtividadeOSItem } from './atividades-os.js';

export interface EquipeItem {
  id: string;
  nome: string;
  descricao?: string | null;
  especialidade?: string | null;
  status: string;
  osId: number;
  liderId: number;
  criadoEm: string;
  os?: { id: number; codigo: string; numero?: string };
  lider?: { id: number; nome: string };
  membros?: MembroEquipeItem[];
  atividades?: AtividadeOSItem[];
}

export interface MembroEquipeItem {
  id: string;
  usuarioId: number;
  funcao: string | null;
  usuario?: { id: number; nome: string; telefone: string | null };
}

export async function listarEquipes(params?: {
  osId?: number;
  status?: string;
  q?: string;
}): Promise<EquipeItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.osId) searchParams.set('osId', String(params.osId));
  if (params?.status) searchParams.set('status', params.status);
  if (params?.q) searchParams.set('q', params.q);
  const queryStr = searchParams.toString();
  return api.get<EquipeItem[]>(`/equipes${queryStr ? `?${queryStr}` : ''}`);
}

export async function criarEquipe(input: {
  nome: string;
  descricao?: string | null;
  especialidade?: string | null;
  osId?: number;
  liderId?: number;
  membros?: { usuarioId: number; funcao?: string }[];
}): Promise<EquipeItem> {
  return api.post<EquipeItem>('/equipes', input);
}
