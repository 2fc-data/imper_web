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

export function dataLocalHoje(base: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}`;
}

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

/**
 * Calcula a quantidade de dias entre a entrada e a saída da oficina.
 * Sem saída, conta até hoje (ex.: "Em oficina há N dias"). Datas no
 * formato ISO/date-only são tratadas como calendário (UTC).
 */
export function diasNaOficina(
  entrada: string | null | undefined,
  saida?: string | null,
  hoje: Date = new Date(),
): number | null {
  const inicio = toLocalDate(entrada ?? null);
  if (!inicio) return null;

  const fim = saida ? toLocalDate(saida) : '';
  if (saida && !fim) return null;

  const [anoInicio, mesInicio, diaInicio] = inicio.split('-').map(Number);
  const inicioMs = Date.UTC(anoInicio, mesInicio - 1, diaInicio);
  const fimMs = fim
    ? (() => {
        const [anoFim, mesFim, diaFim] = fim.split('-').map(Number);
        return Date.UTC(anoFim, mesFim - 1, diaFim);
      })()
    : Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

  return Math.max(0, Math.round((fimMs - inicioMs) / 86_400_000));
}
