export function toLocalDateTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalDateTime(value: string): string | undefined {
  const v = value.trim();
  if (!v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export function formatarData(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('pt-BR');
}

export function formatarValor(value: number | string | null): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (n === null || Number.isNaN(n)) return '—';
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
