/**
 * Formata um valor numérico como telefone brasileiro: (XX) XXXXX-XXXX
 * Aceita até 11 dígitos (com DDD + 9 dígitos para celulares).
 */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
