// Rascunho local do wizard: persistência em localStorage entre sessões.
// Módulo puro (Storage injetável) para ser coberto por rascunho.test.ts.

import type { WizardState } from './tipos';

/** Bump para invalidar rascunhos gravados por versões anteriores do formato. */
export const VERSAO_RASCUNHO = 1;

export interface RascunhoLocal {
  versao: number;
  /** Epoch ms da última gravação local. */
  salvoEm: number;
  /** id do orçamento no servidor, quando o autosave já criou/atualizou. */
  orcamentoId: number | null;
  estado: WizardState;
}

/**
 * Chave do rascunho local. Um rascunho por orçamento em edição e um único
 * "rascunho novo" compartilhado entre atendimentos (a troca de atendimento
 * sobrescreve o snapshot).
 */
export function chaveRascunho(orcamentoId: number | null): string {
  return orcamentoId == null
    ? 'orcamentos:rascunho:novo'
    : `orcamentos:rascunho:${orcamentoId}`;
}

/**
 * Grava o snapshot. Falha de quota/private mode é engolida: o autosave server
 * segue sendo a fonte de verdade, o local é só rede de segurança.
 */
export function salvarRascunho(
  storage: Storage | null | undefined,
  orcamentoId: number | null,
  estado: WizardState,
  agora: number,
): void {
  if (!storage) return;
  try {
    const payload: RascunhoLocal = {
      versao: VERSAO_RASCUNHO,
      salvoEm: agora,
      orcamentoId,
      estado,
    };
    storage.setItem(chaveRascunho(orcamentoId), JSON.stringify(payload));
  } catch {
    // quota/private mode — segue sem rascunho local
  }
}

/**
 * Lê o snapshot. Retorna null quando não há rascunho, o JSON é inválido ou a
 * versão não bate (formato antigo → descarta em silêncio).
 */
export function carregarRascunho(
  storage: Storage | null | undefined,
  orcamentoId: number | null,
): RascunhoLocal | null {
  if (!storage) return null;
  try {
    const bruto = storage.getItem(chaveRascunho(orcamentoId));
    if (!bruto) return null;
    const data = JSON.parse(bruto) as RascunhoLocal;
    if (
      !data ||
      data.versao !== VERSAO_RASCUNHO ||
      typeof data.salvoEm !== 'number' ||
      !data.estado
    ) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

/**
 * Remove o snapshot. Chamado quando o servidor confirma a gravação (o rascunho
 * local cumpriu seu papel) ou quando o usuário descarta a retomada.
 */
export function limparRascunho(
  storage: Storage | null | undefined,
  orcamentoId: number | null,
): void {
  if (!storage) return;
  try {
    storage.removeItem(chaveRascunho(orcamentoId));
  } catch {
    // ignora
  }
}

/**
 * Modo edição: o rascunho local só vale a pena se for mais novo que o
 * updatedAt do servidor — edições em outra aba/máquina já sincronizadas
 * não devem sobrescrever o estado hidratado.
 */
export function rascunhoLocalMaisRecente(
  rascunho: RascunhoLocal | null,
  updatedAtServidor: string | Date | null | undefined,
): boolean {
  if (!rascunho) return false;
  if (!updatedAtServidor) return true;
  const servidor = new Date(updatedAtServidor).getTime();
  if (Number.isNaN(servidor)) return true;
  return rascunho.salvoEm > servidor;
}
