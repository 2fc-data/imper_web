import { api } from './core.js';

export interface PermissaoRbac {
  id: number;
  chave: string;
  descricao: string;
  categoria: string;
}

export interface PapelRbacAdmin {
  id: number;
  nome: string;
  descricao: string | null;
  permissoes: PermissaoRbac[];
}

export async function listarPapeisRbac(): Promise<PapelRbacAdmin[]> {
  const data = await api.get<{ papeis: PapelRbacAdmin[] }>('/rbac/papeis');
  return data.papeis;
}

export async function criarPapelRbac(input: {
  nome: string;
  descricao?: string;
}): Promise<PapelRbacAdmin> {
  const data = await api.post<{ papel: PapelRbacAdmin }>('/rbac/papeis', input);
  return data.papel;
}

export async function atualizarPapelRbac(
  id: number,
  input: { nome?: string; descricao?: string },
): Promise<PapelRbacAdmin> {
  const data = await api.put<{ papel: PapelRbacAdmin }>(
    `/rbac/papeis/${id}`,
    input,
  );
  return data.papel;
}

export async function excluirPapelRbac(id: number): Promise<void> {
  await api.del(`/rbac/papeis/${id}`);
}

export async function listarPermissoesRbac(): Promise<PermissaoRbac[]> {
  const data = await api.get<{ permissoes: PermissaoRbac[] }>(
    '/rbac/permissoes',
  );
  return data.permissoes;
}

export async function definirPermissoesRbac(
  papelId: number,
  permissoesIds: number[],
): Promise<void> {
  await api.put(`/rbac/papeis/${papelId}/permissoes`, { permissoesIds });
}
