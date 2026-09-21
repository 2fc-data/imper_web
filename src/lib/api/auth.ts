import { api, setToken } from './core.js';
import type { LoginResponse } from './core.js';

export async function login(
  email: string,
  senha: string,
): Promise<LoginResponse> {
  const data = await api.post<LoginResponse>('/auth/login', { email, senha });
  setToken(data.token);
  return data;
}

export async function fetchMe(): Promise<LoginResponse['user']> {
  return api.get<LoginResponse['user']>('/auth/me');
}

export function logout(): void {
  setToken(null);
}

export interface CadastroInput {
  nome: string;
  telefone: string;
  email?: string;
  senha: string;
  turnstileToken?: string;
}

export async function cadastrar(input: CadastroInput): Promise<LoginResponse> {
  const data = await api.post<LoginResponse>('/auth/cadastro', input);
  setToken(data.token);
  return data;
}

export async function recuperarSenha(
  input: { canal: 'email' | 'whatsapp'; email?: string; telefone?: string },
): Promise<{ ok: boolean; devToken?: string }> {
  return api.post<{ ok: boolean; devToken?: string }>('/auth/recuperar-senha', input);
}

export async function redefinirSenha(
  token: string,
  novaSenha: string,
): Promise<{ ok: boolean }> {
  return api.post<{ ok: boolean }>('/auth/redefinir-senha', {
    token,
    novaSenha,
  });
}
