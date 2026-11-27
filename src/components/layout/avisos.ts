export function podeAprovarManutencao(
  user: { permissoes?: string[] } | null | undefined,
): boolean {
  if (!user || !Array.isArray(user.permissoes)) return false;
  return user.permissoes.includes('aprovar_manutencao_frota');
}

export function podeAprovarManutencaoEquipamento(
  user: { permissoes?: string[] } | null | undefined,
): boolean {
  if (!user || !Array.isArray(user.permissoes)) return false;
  return user.permissoes.includes('aprovar_manutencao_equipamento');
}

export function podeAprovarCompras(
  user: { permissoes?: string[] } | null | undefined,
): boolean {
  if (!user || !Array.isArray(user.permissoes)) return false;
  return user.permissoes.includes('aprovar_lista_compras');
}

export function totalAvisos(
  pendentes: unknown[] | null | undefined,
  naoLidas: unknown[] | null | undefined,
  pendentesEquipamentos?: unknown[] | null | undefined,
  pendentesCompras?: unknown[] | null | undefined,
): number {
  const p = Array.isArray(pendentes) ? pendentes.length : 0;
  const n = Array.isArray(naoLidas) ? naoLidas.length : 0;
  const e = Array.isArray(pendentesEquipamentos) ? pendentesEquipamentos.length : 0;
  const c = Array.isArray(pendentesCompras) ? pendentesCompras.length : 0;
  return p + n + e + c;
}

export function rotuloContador(n: number): string {
  if (n <= 0) return '';
  if (n > 99) return '99+';
  return String(n);
}
