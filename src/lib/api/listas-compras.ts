import { api } from './core.js';
import type {
  SetorCompra, StatusItemLista, StatusListaCompra, TipoListaCompra,
} from '../../schemas/index.js';

export interface OpcaoCatalogo {
  id: number;
  nome: string;
  unidade: string | null;
  saldo: number | string | null;
  custoUnitario: number | string | null;
  fornecedorId?: number | null;
  numeroPatrimonio?: string | null;
}

export interface FornecedorResumoDto {
  id: number;
  nome: string;
}

export interface ListaCompraItemDto {
  id: number;
  quantidade: number | string;
  valorUnitario: number | string | null;
  custoReal: number | string | null;
  dataCompra: string | null;
  fornecedorId?: number | null;
  fornecedor?: FornecedorResumoDto | null;
  status: StatusItemLista;
  material?: {
    id: number; nome: string;
    custoUnitario?: number | string | null;
    fornecedorId?: number | null;
    fornecedor?: FornecedorResumoDto | null;
    unidade?: { nome: string } | null;
    saldo?: { saldo: number | string } | null;
  } | null;
  epi?: {
    id: number; nome: string;
    unidadeMedida?: { nome: string } | null;
    quantidade?: number | string;
    custoUnitario?: number | string | null;
    fornecedorId?: number | null;
    fornecedor?: FornecedorResumoDto | null;
  } | null;
  equipamento?: {
    id: number; descricao: string;
    unidadeMedida?: { nome: string } | null;
    fornecedorId?: number | null;
    fornecedor?: FornecedorResumoDto | null;
  } | null;
  adicionadoPor?: { id: number; nome: string } | null;
  compradoPor?: { id: number; nome: string } | null;
}

export interface RodadaResumoDto {
  id: number;
  status: StatusListaCompra;
  createdAt: string;
  totalItens: number;
}

export interface ListaCompraDto {
  id: number;
  tipo: TipoListaCompra;
  setor: SetorCompra;
  mes: number;
  ano: number;
  status: StatusListaCompra;
  motivoRecusa: string | null;
  tipoDespesaId?: number | null;
  tipoDespesa?: { id: number; nome: string } | null;
  enviadoPor?: { id: number; nome: string } | null;
  enviadoEm: string | null;
  aprovadoPor?: { id: number; nome: string } | null;
  aprovadoEm: string | null;
  createdAt: string;
  itens: ListaCompraItemDto[];
}

export interface ListaComprasChave {
  tipo: TipoListaCompra;
  setor: SetorCompra;
  mes: number;
  ano: number;
  tipoDespesaId?: number;
}

export async function obterListaCompras(
  params: ListaComprasChave,
): Promise<ListaCompraDto | null> {
  return api.get<ListaCompraDto | null>('/listas-compras', { ...params });
}

export async function listarRodadasListaCompras(
  params: ListaComprasChave,
): Promise<RodadaResumoDto[]> {
  return api.get<RodadaResumoDto[]>('/listas-compras/rodadas', { ...params });
}

export async function obterListaComprasPorId(
  id: number,
): Promise<ListaCompraDto> {
  return api.get<ListaCompraDto>(`/listas-compras/${id}`);
}

export interface ItemCompraInput {
  itemId: number;
  quantidade: number;
  fornecedorId?: number | null;
  valorUnitario?: number | null;
  dataCompra?: string | null;
}

export interface ComprarItemInput {
  custoReal?: number;
  fornecedorId?: number | null;
  valorUnitario?: number | null;
  dataCompra?: string | null;
}

export async function salvarItensListaCompras(
  tipo: TipoListaCompra,
  setor: SetorCompra,
  mes: number,
  ano: number,
  itens: ItemCompraInput[],
  tipoDespesaId?: number,
): Promise<ListaCompraDto> {
  const query = tipoDespesaId ? `?tipoDespesaId=${tipoDespesaId}` : '';
  return api.put<ListaCompraDto>(
    `/listas-compras/${tipo}/${setor}/${mes}/${ano}/itens${query}`,
    { itens, tipoDespesaId },
  );
}

export async function enviarListaCompras(id: number): Promise<ListaCompraDto> {
  return api.post<ListaCompraDto>(`/listas-compras/${id}/enviar`);
}

export async function aprovarListaCompras(id: number): Promise<ListaCompraDto> {
  return api.post<ListaCompraDto>(`/listas-compras/${id}/aprovar`);
}

export async function recusarListaCompras(
  id: number, motivo: string,
): Promise<ListaCompraDto> {
  return api.post<ListaCompraDto>(`/listas-compras/${id}/recusar`, { motivo });
}

export async function recusarItemListaCompras(
  id: number, itemId: number,
): Promise<ListaCompraDto> {
  return api.post<ListaCompraDto>(`/listas-compras/${id}/itens/${itemId}/recusar`);
}

export async function reverterItemListaCompras(
  id: number, itemId: number,
): Promise<ListaCompraDto> {
  return api.post<ListaCompraDto>(`/listas-compras/${id}/itens/${itemId}/reverter`);
}

export async function comprarItemListaCompras(
  id: number, itemId: number, input: ComprarItemInput = {},
): Promise<ListaCompraDto> {
  return api.post<ListaCompraDto>(
    `/listas-compras/${id}/itens/${itemId}/comprar`,
    input,
  );
}

export async function conferirItemListaCompras(
  id: number,
  itemId: number,
): Promise<ListaCompraDto> {
  return api.post<ListaCompraDto>(
    `/listas-compras/${id}/itens/${itemId}/conferir`,
  );
}

export async function desfazerConferenciaItemListaCompras(
  id: number,
  itemId: number,
): Promise<ListaCompraDto> {
  return api.post<ListaCompraDto>(
    `/listas-compras/${id}/itens/${itemId}/desfazer-conferencia`,
  );
}
