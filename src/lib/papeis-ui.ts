export const ROTULO_PAPEL: Record<string, string> = {
  ADMIN: 'Administrador',
  SUPERVISOR: 'Supervisor',
  ATENDENTE: 'Atendente',
  TECNICO: 'Técnico',
  ALMOXARIFE: 'Almoxarife',
  CONTABILIDADE: 'Contabilidade',
  CLIENTE: 'Cliente',
  COLABORADOR: 'Colaborador',
};

export function badgetColor(nomePapel: string) {
  switch (nomePapel) {
    case 'ADMIN':
      return 'bg-destructive/10 text-destructive';
    case 'SUPERVISOR':
      return 'bg-primary/10 text-primary';
    case 'ATENDENTE':
    case 'TECNICO':
    case 'ALMOXARIFE':
    case 'CONTABILIDADE':
      return 'bg-secondary text-secondary-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
}
