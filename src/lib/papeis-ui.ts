export const ROTULO_PAPEL: Record<string, string> = {
  ADMINISTRATIVO: 'Administrativo',
  FINANCEIRO: 'Financeiro',
  CONTABIL: 'Contábil',
  VENDAS: 'Vendas',
  ATENDIMENTO: 'Atendimento',
  ALMOXARIFE: 'Almoxarife',
  COLABORADOR: 'Colaborador',
  CLIENTE: 'Cliente',
  'SUPERVISOR OBRAS': 'Supervisor de Obras',
  SUPERVISOR_OBRAS: 'Supervisor de Obras',
};

export function badgetColor(nomePapel: string) {
  switch (nomePapel) {
    case 'ADMINISTRATIVO':
      return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900';
    case 'FINANCEIRO':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900';
    case 'CONTABIL':
      return 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-900';
    case 'VENDAS':
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900';
    case 'ATENDIMENTO':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900';
    case 'ALMOXARIFE':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900';
    case 'COLABORADOR':
      return 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-900';
    case 'SUPERVISOR OBRAS':
    case 'SUPERVISOR_OBRAS':
      return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900';
    case 'CLIENTE':
      return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}
