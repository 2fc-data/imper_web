import { PASSOS, type PassoWizard } from './tipos';

export interface EvolucaoOrcamentoInfo {
  passos: boolean[];
  etapa: PassoWizard;
  rotulo: string;
}

export function calcularEvolucaoOrcamento(input: {
  atividades?: number;
  valorTotal?: string | number;
  ficha?: { id?: number } | null;
  observacoes?: string | null;
}): EvolucaoOrcamentoInfo {
  const passos = [
    true,
    (input.atividades ?? 0) > 0,
    Number(input.valorTotal ?? 0) > 0,
    input.ficha != null || Boolean(input.observacoes?.trim()),
  ];
  let etapa = 1;
  while (etapa < 4 && passos[etapa]) {
    etapa += 1;
  }
  return {
    passos,
    etapa: etapa as PassoWizard,
    rotulo: PASSOS[etapa - 1].titulo,
  };
}

export function EvolucaoOrcamento({
  evolucao,
  size = 'md',
}: {
  evolucao: EvolucaoOrcamentoInfo;
  size?: 'sm' | 'md';
}) {
  const ponto = size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2';
  const texto = size === 'sm' ? 'text-[10px]' : 'text-xs';
  const dica = PASSOS.map(
    (p, i) => `${p.passo}. ${p.titulo}: ${evolucao.passos[i] ? '✓' : '○'}`,
  ).join('\n');
  return (
    <span
      title={`Evolução do orçamento\n${dica}`}
      className={`inline-flex items-center gap-1.5 ${texto} text-muted-foreground`}
    >
      <span className="flex items-center gap-1">
        {PASSOS.map((p, i) => (
          <span
            key={p.passo}
            aria-hidden
            className={`${ponto} rounded-full ${
              evolucao.passos[i] ? 'bg-primary' : 'bg-muted-foreground/30'
            }`}
          />
        ))}
      </span>
      <span className="font-medium whitespace-nowrap text-foreground/80">
        {evolucao.etapa}/4 · {evolucao.rotulo}
      </span>
    </span>
  );
}
