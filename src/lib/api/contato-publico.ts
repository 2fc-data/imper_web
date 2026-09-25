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

export interface ContatoInput {
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

export type OrcamentoInput = ContatoInput;

export interface ContatoResult {
  id: number;
  nome: string;
  canal: string;
  status: string;
  createdAt: string;
}

export type OrcamentoResult = ContatoResult;

export async function enviarContato(
  input: ContatoInput,
): Promise<ContatoResult> {
  return api.post<ContatoResult>('/publico/contato', input);
}

export async function solicitarOrcamento(
  input: ContatoInput,
): Promise<ContatoResult> {
  return enviarContato(input);
}
