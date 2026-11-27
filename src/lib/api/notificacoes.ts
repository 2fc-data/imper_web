import { api } from './index';

export interface NotificacaoItem {
  id: number;
  userId: number;
  titulo: string;
  mensagem: string;
  link: string | null;
  status: 'NAO_LIDA' | 'LIDA';
  obraId: number | null;
  createdAt: string;
}

export async function listarNotificacoes(params?: {
  status?: 'NAO_LIDA' | 'LIDA';
  limit?: number;
}): Promise<NotificacaoItem[]> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.limit) qs.set('limit', String(params.limit));
  const query = qs.toString();
  return api.get<NotificacaoItem[]>(`/notificacoes${query ? `?${query}` : ''}`);
}

export async function obterCountNotificacoesNaoLidas(): Promise<{ count: number } | number> {
  return api.get<{ count: number } | number>('/notificacoes/nao-lidas/count');
}

export async function marcarNotificacaoLida(id: number): Promise<NotificacaoItem> {
  return api.patch<NotificacaoItem>(`/notificacoes/${id}/lida`, {});
}

export async function marcarTodasNotificacoesLidas(): Promise<{ count: number }> {
  return api.patch<{ count: number }>('/notificacoes/lidas', {});
}
