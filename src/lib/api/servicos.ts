import { api } from './core.js';

export interface ServicoMarketing {
  id: number;
  titulo: string;
  descricao: string;
  icone: string;
  ativo: boolean;
  ordem: number;
  createdAt: string;
  updatedAt: string;
}

export async function listarServicos(): Promise<ServicoMarketing[]> {
  return api.get<ServicoMarketing[]>('/publico/servicos');
}

export interface ServicoMarketingInput {
  titulo: string;
  descricao: string;
  icone: string;
  ativo?: boolean;
}

export async function listarServicosAdmin(params?: {
  q?: string;
}): Promise<ServicoMarketing[]> {
  const searchParams = new URLSearchParams();
  if (params?.q) searchParams.set('q', params.q);
  const queryStr = searchParams.toString();
  return api.get<ServicoMarketing[]>(
    `/servicos-admin${queryStr ? `?${queryStr}` : ''}`,
  );
}

export async function criarServico(
  input: ServicoMarketingInput,
): Promise<ServicoMarketing> {
  return api.post<ServicoMarketing>('/servicos-admin', input);
}

export async function atualizarServico(
  id: number,
  input: Partial<ServicoMarketingInput>,
): Promise<ServicoMarketing> {
  return api.put<ServicoMarketing>(`/servicos-admin/${id}`, input);
}

export async function excluirServico(id: number): Promise<{ ok: boolean }> {
  return api.del<{ ok: boolean }>(`/servicos-admin/${id}`);
}
