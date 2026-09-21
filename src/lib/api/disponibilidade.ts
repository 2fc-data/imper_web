import { api } from './core.js';

export interface DisponibilidadePadrao {
  id: number;
  userId: number;
  diaSemana: number;
  horaInicio: string;
  horaFim: string;
  capacidade: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DisponibilidadeData {
  id: number;
  userId: number;
  data: string;
  horaInicio: string;
  horaFim: string;
  capacidade: number;
  excluida: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DisponibilidadeSlot {
  data: string;
  diaSemana: string;
  horaInicio: string;
  horaFim: string;
  capacidade: number;
  ocupados: number;
  disponivel: boolean;
}

export async function apiListarPadroes(userId?: number): Promise<DisponibilidadePadrao[]> {
  const queryStr = userId ? `?userId=${userId}` : '';
  return api.get<DisponibilidadePadrao[]>(`/disponibilidade/padroes${queryStr}`);
}

export async function apiCriarPadrao(data: {
  userId: number;
  diaSemana: number;
  horaInicio: string;
  horaFim: string;
  capacidade: number;
}): Promise<DisponibilidadePadrao> {
  return api.post<DisponibilidadePadrao>('/disponibilidade/padroes', data);
}

export async function apiAtualizarPadrao(
  id: number,
  data: Partial<{ diaSemana: number; horaInicio: string; horaFim: string; capacidade: number; ativo: boolean }>,
): Promise<DisponibilidadePadrao> {
  return api.patch<DisponibilidadePadrao>(`/disponibilidade/padroes/${id}`, data);
}

export async function apiExcluirPadrao(id: number): Promise<void> {
  return api.del(`/disponibilidade/padroes/${id}`);
}

export async function apiListarDatas(
  userId?: number,
  mes?: number,
  ano?: number,
): Promise<DisponibilidadeData[]> {
  const params = new URLSearchParams();
  if (userId) params.set('userId', String(userId));
  if (mes) params.set('mes', String(mes));
  if (ano) params.set('ano', String(ano));
  const queryStr = params.toString() ? `?${params.toString()}` : '';
  return api.get<DisponibilidadeData[]>(`/disponibilidade/datas${queryStr}`);
}

export async function apiCriarData(data: {
  userId: number;
  data: string;
  horaInicio: string;
  horaFim: string;
  capacidade: number;
  excluida?: boolean;
}): Promise<DisponibilidadeData> {
  return api.post<DisponibilidadeData>('/disponibilidade/datas', data);
}

export async function apiAtualizarData(
  id: number,
  data: Partial<{ data: string; horaInicio: string; horaFim: string; capacidade: number; excluida: boolean }>,
): Promise<DisponibilidadeData> {
  return api.patch<DisponibilidadeData>(`/disponibilidade/datas/${id}`, data);
}

export async function apiExcluirData(id: number): Promise<void> {
  return api.del(`/disponibilidade/datas/${id}`);
}

export async function apiObterSlots(
  mes: number,
  ano: number,
  userId?: number,
): Promise<{ slots: DisponibilidadeSlot[] }> {
  const params = new URLSearchParams({ mes: String(mes), ano: String(ano) });
  if (userId) params.set('userId', String(userId));
  return api.get<{ slots: DisponibilidadeSlot[] }>(
    `/disponibilidade/slots?${params.toString()}`,
  );
}
