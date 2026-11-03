/** Dados oficiais da empresa — fonte única para tela e PDF da proposta. */
export const EMPRESA = {
  nome: 'Imperpoços',
  tagline: 'Engenharia em Impermeabilização.',
  cnpj: '71.189.955/0001-87',
  endereco: 'Rua São Paulo, 511 — Centro',
  cidade: 'Poços de Caldas/MG',
  telefones: ['(35) 3721-1674', '(35) 3722-2514'],
  whatsapp: '(35) 99673-0651',
  email: 'impershop@imperpocos.com.br',
  instagram: '@imperpocos',
} as const;

/** Linha única de contato (telefones + WhatsApp + e-mail + Instagram) para o cabeçalho. */
export function empresaContatoLinha(): string {
  const tels = EMPRESA.telefones.join(' · ');
  return `Tel ${tels} · WhatsApp ${EMPRESA.whatsapp} · ${EMPRESA.email} · ${EMPRESA.instagram}`;
}
