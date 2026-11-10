import React from 'react';
import { cn } from '../../lib/utils';

export interface ChartStorytellingNoteProps {
  oQueAconteceu: string;
  impacto: string;
  acaoRecomendada: string;
  destaque?: 'info' | 'alerta' | 'sucesso' | 'neutro';
  className?: string;
}

const destaqueConfig = {
  neutro: {
    borda: 'border-border/60 bg-muted/30',
    tag: 'bg-muted text-muted-foreground',
    rotulo: 'Diagnóstico do Gráfico',
  },
  info: {
    borda: 'border-sky-500/30 bg-sky-500/5',
    tag: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
    rotulo: 'Insight Operacional',
  },
  alerta: {
    borda: 'border-amber-500/30 bg-amber-500/5',
    tag: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    rotulo: 'Ponto de Atenção',
  },
  sucesso: {
    borda: 'border-emerald-500/30 bg-emerald-500/5',
    tag: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    rotulo: 'Resultado Positivo',
  },
};

export function ChartStorytellingNote({
  oQueAconteceu,
  impacto,
  acaoRecomendada,
  destaque = 'info',
  className,
}: ChartStorytellingNoteProps) {
  const cfg = destaqueConfig[destaque];

  return (
    <div
      className={cn(
        'mt-4 rounded-xl border p-3.5 text-xs transition-colors',
        cfg.borda,
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className={cn('rounded px-1.5 py-0.5 text-3xs font-bold uppercase tracking-wider', cfg.tag)}>
          {cfg.rotulo}
        </span>
      </div>
      <div className="space-y-1.5 text-muted-foreground leading-relaxed">
        <p>
          <strong className="font-semibold text-foreground">O que aconteceu:</strong> {oQueAconteceu}
        </p>
        <p>
          <strong className="font-semibold text-foreground">Impacto:</strong> {impacto}
        </p>
        <p className="text-foreground">
          <strong className="font-semibold text-primary">Ação recomendada:</strong> {acaoRecomendada}
        </p>
      </div>
    </div>
  );
}

