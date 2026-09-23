import { api } from './core.js';

export interface MeuUser {
  id: number;
  nome: string;
  cpfCnpj: string | null;
  telefone: string | null;
  email: string | null;
}

export interface MinhaConta {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  papel: string;
  permissoes: string[];
  cpfCnpj: string | null;
  endereco: {
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

export async function buscarUsuarios(q: string): Promise<MeuUser[]> {
  return api.get<MeuUser[]>(`/usuarios/buscar?q=${encodeURIComponent(q)}`);
}
