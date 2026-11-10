import React from 'react';

interface KpiCardProps {
  titulo: string;
  valor: string | number;
  subtitulo?: string;
  icone?: React.ReactNode;
  variacao?: {
    valor: string;
    positiva?: boolean;
    neutra?: boolean;
  };
  destaque?: 'default' | 'primary' | 'success' | 'warning' | 'info' | 'destructive';
}

const destaquesClasses = {
  default: 'border-border/80 bg-card text-foreground',
  primary: 'border-primary/30 bg-primary/5 text-primary',
  success: 'border-success/30 bg-success/5 text-success',
  warning: 'border-warning/30 bg-warning/5 text-warning',
  info: 'border-info/30 bg-info/5 text-info',
  destructive: 'border-destructive/30 bg-destructive/5 text-destructive',
};

const badgeClasses = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  info: 'bg-info/15 text-info',
  destructive: 'bg-destructive/15 text-destructive',
};

export function KpiCard({
  titulo,
  valor,
  subtitulo,
  icone,
  variacao,
  destaque = 'default',
}: KpiCardProps) {
  return (
    <div
      className={`rounded-2xl border p-4.5 shadow-xs transition-all duration-200 hover:shadow-sm ${destaquesClasses[destaque]}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground line-clamp-1">
          {titulo}
        </span>
        {icone && (
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-xl p-1.5 ${badgeClasses[destaque]}`}
          >
            {icone}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {valor}
        </span>
        {variacao && (
          <span
            className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${
              variacao.neutra
                ? 'bg-muted text-muted-foreground'
                : variacao.positiva
                  ? 'bg-success/15 text-success'
                  : 'bg-destructive/15 text-destructive'
            }`}
          >
            {variacao.valor}
          </span>
        )}
      </div>

      {subtitulo && (
        <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
          {subtitulo}
        </p>
      )}
    </div>
  );
}

