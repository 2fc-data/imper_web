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
}

export interface ListaCompraItemDto {
  id: number;
  quantidade: number | string;
  custoReal: number | string | null;
  status: StatusItemLista;
  material?: {
    id: number; nome: string;
    custoUnitario?: number | string | null;
    unidade?: { nome: string } | null;
    saldo?: { saldo: number | string } | null;
  } | null;
  epi?: {
    id: number; nome: string;
    unidadeMedida?: { nome: string } | null;
    quantidade?: number | string;
  } | null;
  equipamento?: {
    id: number; descricao: string;
    unidadeMedida?: { nome: string } | null;
  } | null;
  adicionadoPor?: { id: number; nome: string } | null;
  compradoPor?: { id: number; nome: string } | null;
}

export interface ListaCompraDto {
  id: number;
  tipo: TipoListaCompra;
  setor: SetorCompra;
  mes: number;
  ano: number;
  status: StatusListaCompra;
  motivoRecusa: string | null;
  enviadoPor?: { id: number; nome: string } | null;
  enviadoEm: string | null;
  aprovadoPor?: { id: number; nome: string } | null;
  aprovadoEm: string | null;
  itens: ListaCompraItemDto[];
}

export async function obterListaCompras(params: {
  tipo: TipoListaCompra; setor: SetorCompra; mes: number; ano: number;
}): Promise<ListaCompraDto | null> {
  return api.get<ListaCompraDto | null>('/listas-compras', params);
}

export async function salvarItensListaCompras(
  tipo: TipoListaCompra, setor: SetorCompra, mes: number, ano: number,
  itens: { itemId: number; quantidade: number }[],
): Promise<ListaCompraDto> {
  return api.put<ListaCompraDto>(
    `/listas-compras/${tipo}/${setor}/${mes}/${ano}/itens`, { itens },
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
  id: number, itemId: number, custoReal?: number,
): Promise<ListaCompraDto> {
  return api.post<ListaCompraDto>(
    `/listas-compras/${id}/itens/${itemId}/comprar`,
    custoReal === undefined ? {} : { custoReal },
  );
}
