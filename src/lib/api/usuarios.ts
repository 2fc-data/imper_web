import { api } from './core.js';

export interface PapelRbac {
  id: number;
  nome: string;
  descricao: string | null;
  ativo: boolean;
}

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  papel: string;
  papeis: PapelRbac[];
  ativo: boolean;
  cargoId: number | null;
  cargo?: { id: number; nome: string } | null;
  createdAt: string;
  cpfCnpj?: string | null;
  endereco?: {
    id: number;
    logradouro: string;
    numero: string | null;
    complemento: string | null;
    bairro: string | null;
    cidade: string | null;
    estado: string | null;
    cep: string | null;
  } | null;
}

export async function listarUsuarios(): Promise<Usuario[]> {
  return api.get<Usuario[]>('/usuarios');
}

export async function listarPapeis(): Promise<PapelRbac[]> {
  return api.get<PapelRbac[]>('/usuarios/papeis');
}

export async function definirPerfilUsuario(
  id: number,
  papelId: number,
): Promise<Usuario> {
  return api.patch<Usuario>(`/usuarios/${id}/perfil`, { papelId });
}

export async function atualizarUsuario(
  id: number,
  data: {
    nome?: string;
    email?: string;
    telefone?: string;
    papelId?: number;
    cargoId?: number | null;
    ativo?: boolean;
    cpfCnpj?: string;
    cep?: string;
    endereco?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    numero?: string;
    complemento?: string;
  },
): Promise<Usuario> {
  return api.put<Usuario>(`/usuarios/${id}`, data);
}

export interface CriarUsuarioInput {
  nome: string;
  email?: string;
  senha: string;
  telefone?: string;
  papelId: number;
  cargoId?: number | null;
  cpfCnpj?: string;
  cep?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  numero?: string;
  complemento?: string;
}

export async function criarUsuario(input: CriarUsuarioInput): Promise<Usuario> {
  return api.post<Usuario>('/usuarios', input);
}

export interface Cargo {
  id: number;
  nome: string;
  descricao: string | null;
  ativo: boolean;
}

export async function listarCargos(): Promise<Cargo[]> {
  return api.get('/usuarios/cargos');
}

export async function criarCargo(data: {
  nome: string;
  descricao?: string;
}): Promise<Cargo> {
  return api.post('/usuarios/cargos', data);
}

export async function atualizarCargo(
  id: number,
  data: { nome?: string; descricao?: string; ativo?: boolean },
): Promise<Cargo> {
  return api.put(`/usuarios/cargos/${id}`, data);
}
