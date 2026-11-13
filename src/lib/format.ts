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

/**
 * Converte um valor monetário para número.
 * Aceita number e strings no formato brasileiro ("1.600,50") ou
 * serializado pela API ("1600.5"). Retorna undefined se inválido/vazio.
 */
export function paraNumeroMoeda(
  v: number | string | null | undefined,
): number | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  const s = String(v).trim();
  if (!s) return undefined;
  if (s.includes(',')) {
    // formato brasileiro: remove pontos de milhar (ex: "1.600,50") e troca vírgula por ponto.
    const n = Number(s.replace(/\./g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : undefined;
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

/** Soma valores monetários em centavos, evitando erros de ponto flutuante. */
export function somarMoeda(
  ...valores: (number | string | null | undefined)[]
): number {
  const totalCentavos = valores.reduce<number>((total, v) => {
    const n = paraNumeroMoeda(v) ?? 0;
    return total + Math.round(n * 100);
  }, 0);
  return totalCentavos / 100;
}

/**
 * Aplica a máscara monetária "0.000,00" a um texto digitado/passado.
 * Retorna o texto formatado com prefixo "R$" e o valor numérico correspondente.
 */
export function mascararMoeda(texto: string): {
  texto: string;
  valor: number | undefined;
} {
  const digitos = texto.replace(/\D/g, '').slice(0, 12);
  if (!digitos) return { texto: '', valor: undefined };
  const valor = Number(digitos) / 100;
  return { texto: formatarMoedaInput(valor), valor };
}

/** Formata número como moeda brasileira (R$). Aceita string/number/null/undefined. */
export function brl(v: number | string | null | undefined): string {
  return Number(v ?? 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/**
 * Extrai o valor numérico de texto digitado em campo de moeda.
 * Aceita "1.600,00", "1600,00", "1600" → 1600. Retorna undefined se vazio.
 */
export function parseMoedaInput(texto: string): number | undefined {
  if (!texto.trim()) return undefined;
  const limpo = texto.replace(/[^\d,.-]/g, '');
  if (!limpo) return undefined;
  const n = Number(limpo.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}

/** Formata número para exibição em input de moeda (R$ 1.600,00). */
export function formatarMoedaInput(
  v: number | string | null | undefined,
): string {
  const n = paraNumeroMoeda(v);
  if (n === undefined) return '';
  return n.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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
