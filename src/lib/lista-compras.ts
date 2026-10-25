import type { ListaCompraDto, ListaCompraItemDto } from './api/listas-compras.js';

export const MESES_CURTOS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

export type ModoLista = 'edicao' | 'aprovacao' | 'compra' | 'historico';

export function modoDaLista(
  status: ListaCompraDto['status'] | null,
): ModoLista {
  switch (status) {
    case null:
    case 'ABERTA':
    case 'RECUSADA':
      return 'edicao';
    case 'ENVIADA':
      return 'aprovacao';
    case 'APROVADA':
      return 'compra';
    default:
      return 'historico';
  }
}

export function podeEnviar(modo: ModoLista): boolean {
  return modo === 'edicao';
}
export function podeEditarItens(modo: ModoLista): boolean {
  return modo === 'edicao';
}
export function podeAprovar(modo: ModoLista): boolean {
  return modo === 'aprovacao';
}
export function podeComprar(modo: ModoLista): boolean {
  return modo === 'compra';
}

export function progressoCompras(itens: ListaCompraItemDto[]): {
  comprados: number; total: number;
} {
  const total = itens.length;
  const comprados = itens.filter((i) => i.status === 'COMPRADO').length;
  return { comprados, total };
}

export function estaComprada(lista: ListaCompraDto): boolean {
  return lista.status === 'COMPRADA';
}

function toNum(v: number | string | null | undefined): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === 'string' ? Number(v) : v;
  return Number.isNaN(n) ? 0 : n;
}

export function totalEstimado(
  itens: ListaCompraItemDto[],
): number | null {
  if (itens.length === 0) return null;
  let soma = 0;
  for (const item of itens) {
    if (item.status === 'RECUSADO') continue;
    const custo =
      item.material?.custoUnitario ??
      (item.epi as { custoUnitario?: number | string | null } | undefined)?.custoUnitario ??
      (item.equipamento as { custoUnitario?: number | string | null } | undefined)?.custoUnitario ??
      null;
    if (custo === null || custo === undefined) return null;
    soma += toNum(custo) * toNum(item.quantidade);
  }
  return soma;
}

export function totalGasto(itens: ListaCompraItemDto[]): number {
  return itens.reduce((acc, i) => acc + toNum(i.custoReal), 0);
}

export function nomeItem(item: ListaCompraItemDto): string {
  return item.material?.nome ?? item.epi?.nome ?? item.equipamento?.descricao ?? '—';
}

export function unidadeItem(item: ListaCompraItemDto): string {
  return (
    item.material?.unidade?.nome ??
    item.epi?.unidadeMedida?.nome ??
    item.equipamento?.unidadeMedida?.nome ??
    'un.'
  );
}

export function saldoItem(item: ListaCompraItemDto): number | null {
  if (item.material?.saldo) return toNum(item.material.saldo.saldo);
  if (item.epi?.quantidade !== undefined) return toNum(item.epi.quantidade);
  return null;
}

export function subtituloItem(
  item: ListaCompraItemDto,
  tipo: ListaCompraDto['tipo'],
): string {
  if (tipo === 'EPI') {
    const epi = item.epi as { numeroCa?: string | null } | undefined;
    return epi?.numeroCa ? `CA ${epi.numeroCa}` : 'EPI';
  }
  if (tipo === 'EQUIPAMENTO') {
    const eq = item.equipamento as { codigo?: string } | undefined;
    return eq?.codigo ? `Cód. ${eq.codigo}` : 'Equipamento';
  }
  const saldo = saldoItem(item);
  return `${unidadeItem(item)}${saldo !== null ? ` · saldo ${saldo}` : ''}`;
}
