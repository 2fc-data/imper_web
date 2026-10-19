/**
 * Formata um valor de km para exibição pt-BR (ex.: 280607 -> "280.607").
 * Aceita number ou string (Prisma Decimal serializa como string no JSON).
 */
export function formatarKm(valor: number | string | null | undefined): string {
  const n = typeof valor === 'string' ? Number(valor) : valor;
  if (n === null || n === undefined || !Number.isFinite(n)) return '';
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(n);
}

/**
 * Converte o texto digitado (aceita "280.607", "280,6" ou "280607") em número.
 * Ponto é tratado como separador de milhar; vírgula como decimal.
 */
export function parseKm(texto: string): number | undefined {
  const limpo = texto.replace(/\./g, '').replace(/,/g, '.').trim();
  if (!limpo) return undefined;
  const n = Number(limpo);
  return Number.isFinite(n) ? n : undefined;
}
