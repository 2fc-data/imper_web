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

/** Formata número como moeda brasileira (R$). Aceita string/number/null/undefined. */
export function brl(v: number | string | null | undefined): string {
  return Number(v ?? 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/** Normaliza telefone para formato wa.me (55 + dígitos). */
export function telefoneWhatsApp(
  tel: string | null | undefined,
): string | null {
  if (!tel) return null;
  const digits = tel.replace(/\D/g, '');
  if (!digits) return null;
  return digits.startsWith('55') ? digits : `55${digits}`;
}

/** Formata data ISO como dd/mm/aaaa. Retorna '—' se null/undefined. */
export function formatarData(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

/** Formata data ISO como dd/mm/aaaa hh:mm. Retorna '—' se null/undefined. */
export function formatarDataHora(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR');
}

/** Endereço estrutural mínimo (cobre EnderecoPortal e endereços de atendimento). */
export interface EnderecoLike {
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
}

/** Formata endereço completo com CEP (vírgulas). Retorna '' se null. */
export function formatarEnderecoCompleto(end: EnderecoLike | null): string {
  if (!end) return '';
  const cidadeUf =
    end.cidade && end.estado
      ? `${end.cidade}/${end.estado}`
      : (end.cidade ?? end.estado ?? '');
  const partes = [
    end.logradouro,
    end.numero,
    end.complemento,
    end.bairro,
    cidadeUf,
    end.cep ? `CEP ${end.cep}` : null,
  ].filter(Boolean);
  return partes.join(', ');
}

/** Formata endereço curto com em-dash (—). Retorna '—' se null. */
export function formatarEnderecoObra(end: EnderecoLike | null): string {
  if (!end) return '—';
  const partes = [end.logradouro, end.numero].filter(Boolean);
  const cidadeUf = [end.cidade, end.estado].filter(Boolean).join('/');
  return [partes.join(', '), end.bairro, cidadeUf]
    .filter(Boolean)
    .join(' — ');
}
