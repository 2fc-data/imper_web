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

const CALENDARIO =
  /^(\d{4}-\d{2}-\d{2})(?:T00:00:00(?:\.000)?(?:Z|[+-]\d{2}:\d{2}))?$/;

export function toLocalDate(iso: string | null): string {
  if (!iso) return '';
  const calendario = CALENDARIO.exec(iso);
  if (calendario) return calendario[1];
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromLocalDate(value: string): string | undefined {
  const v = value.trim();
  if (!v) return undefined;
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined;
}

export function formatarData(value: string | null): string {
  if (!value) return '—';
  const calendario = CALENDARIO.exec(value);
  if (calendario) {
    const [ano, mes, dia] = calendario[1].split('-').map(Number);
    return new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR');
  }
  return new Date(value).toLocaleDateString('pt-BR');
}

export function formatarValor(value: number | string | null): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (n === null || Number.isNaN(n)) return '—';
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
