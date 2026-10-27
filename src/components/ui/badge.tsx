import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

const TONS = {
  neutro: 'bg-muted text-muted-foreground border-border',
  primario: 'bg-primary/10 text-primary border-primary/30',
  info: 'bg-info/10 text-info border-info/30',
  sucesso: 'bg-success/10 text-success border-success/30',
  alerta: 'bg-warning/10 text-warning border-warning/30',
  perigo: 'bg-destructive/10 text-destructive border-destructive/30',
  ouro: 'bg-gold/10 text-gold border-gold/30',
} as const;

export type BadgeTom = keyof typeof TONS;

const TAMANHOS = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-0.5 text-xs',
} as const;

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tom?: BadgeTom;
  size?: keyof typeof TAMANHOS;
}

export function Badge({
  tom = 'neutro',
  size = 'md',
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium leading-none tracking-wide',
        TONS[tom],
        TAMANHOS[size],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function AtivoBadge({
  ativo,
  size = 'md',
  className,
}: {
  ativo: boolean;
  size?: keyof typeof TAMANHOS;
  className?: string;
}) {
  return (
    <Badge tom={ativo ? 'sucesso' : 'neutro'} size={size} className={className}>
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          ativo ? 'bg-success' : 'bg-muted-foreground',
        )}
        aria-hidden="true"
      />
      {ativo ? 'Ativo' : 'Inativo'}
    </Badge>
  );
}
