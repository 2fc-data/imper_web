export const ROTULO_PAPEL: Record<string, string> = {
  ADMINISTRATIVO: 'Administrativo',
  FINANCEIRO: 'Financeiro',
  CONTABIL: 'Contábil',
  VENDAS: 'Vendas',
  ATENDIMENTO: 'Atendimento',
  ALMOXARIFE: 'Almoxarife',
  COLABORADOR: 'Colaborador',
  CLIENTE: 'Cliente',
};

export function badgetColor(nomePapel: string) {
  switch (nomePapel) {
    case 'ADMINISTRATIVO':
      return 'bg-destructive/10 text-destructive';
    case 'VENDAS':
      return 'bg-primary/10 text-primary';
    case 'ATENDIMENTO':
    case 'COLABORADOR':
    case 'ALMOXARIFE':
    case 'CONTABIL':
    case 'FINANCEIRO':
      return 'bg-secondary text-secondary-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
}
