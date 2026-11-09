import React from 'react';
import { cn } from '../../lib/utils';

export interface StorytellingProps {
  statusGeral?: 'otimo' | 'atencao' | 'critico' | 'estavel';
  resumoExecutivo: string;
  cenario: string[];
  diagnostico: string[];
  recomendacoes: string[];
  className?: string;
}

const statusConfig = {
  otimo: {
    rotulo: 'Desempenho Saudável',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    bordaTop: 'border-l-emerald-500',
  },
  estavel: {
    rotulo: 'Operação Estável',
    badgeClass: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20',
    bordaTop: 'border-l-sky-500',
  },
  atencao: {
    rotulo: 'Atenção Operacional',
    badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    bordaTop: 'border-l-amber-500',
  },
  critico: {
    rotulo: 'Ação Urgente Necessária',
    badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
    bordaTop: 'border-l-rose-500',
  },
};

export function StorytellingPanel({
  statusGeral = 'estavel',
  resumoExecutivo,
  cenario,
  diagnostico,
  recomendacoes,
  className,
}: StorytellingProps) {
  const status = statusConfig[statusGeral];

  return (
    <div
      className={cn(
        'rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/20 p-5 shadow-xs transition-all',
        className,
      )}
    >
      {/* Cabeçalho com Badge e Resumo Executivo */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/50 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground">
                Diagnóstico Executivo & Storytelling
              </h3>
              <span
                className={cn(
                  'rounded-full border px-2.5 py-0.5 text-2xs font-semibold uppercase tracking-wider',
                  status.badgeClass,
                )}
              >
                {status.rotulo}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Leitura analítica automatizada sobre causas, riscos e oportunidades.
            </p>
          </div>
        </div>
      </div>

      {/* Frase-Chave de Destaque Executivo */}
      <div className="mt-3.5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-xs font-medium text-foreground">
        <span className="font-semibold text-primary">Síntese:</span> {resumoExecutivo}
      </div>

      {/* Grid de 3 Pilares do Storytelling */}
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {/* Pilar 1: Cenário & Fatos */}
        <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="h-2 w-2 rounded-full bg-sky-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-sky-900 dark:text-sky-300">
              1. Cenário & Fatos
            </h4>
          </div>
          <ul className="space-y-2 text-xs text-muted-foreground flex-1">
            {cenario.map((item, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-sky-500 font-bold leading-none mt-0.5">•</span>
                <span className="leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pilar 2: Diagnóstico & Causas */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
              2. Diagnóstico & Impacto
            </h4>
          </div>
          <ul className="space-y-2 text-xs text-muted-foreground flex-1">
            {diagnostico.map((item, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-amber-500 font-bold leading-none mt-0.5">•</span>
                <span className="leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pilar 3: Ações Recomendadas */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
              3. Ações Recomendadas
            </h4>
          </div>
          <ul className="space-y-2 text-xs text-muted-foreground flex-1">
            {recomendacoes.map((item, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold leading-none mt-0.5">✓</span>
                <span className="leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

