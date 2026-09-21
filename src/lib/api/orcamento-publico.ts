import { api } from './core.js';

export interface CidadeAtendida {
  id: number;
  nome: string;
  uf: string;
  lat: number;
  lng: number;
}

export async function listarCidades(): Promise<CidadeAtendida[]> {
  return api.get<CidadeAtendida[]>('/publico/cidades');
}

export interface OrcamentoInput {
  nome: string;
  telefone: string;
  email?: string;
  descricao?: string;
  cep?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  numero?: string;
  complemento?: string;
  turnstileToken?: string;
}

export interface OrcamentoResult {
  id: number;
  nome: string;
  canal: string;
  status: string;
  createdAt: string;
}

export async function solicitarOrcamento(
  input: OrcamentoInput,
): Promise<OrcamentoResult> {
  return api.post<OrcamentoResult>('/publico/orcamento', input);
}
