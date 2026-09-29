import React from 'react';

export type StatusType =
  | 'NOVO'
  | 'EM_ANDAMENTO'
  | 'ORCAMENTAMENTO'
  | 'CONCLUIDO'
  | 'INATIVO'
  | 'PENDENTE'
  | 'AGENDADA'
  | 'AGENDADO'
  | 'REALIZADO'
  | 'REALIZADA'
  | 'RASCUNHO'
  | 'ENVIADO'
  | 'APROVADO'
  | 'RECUSADO'
  | 'AGUARDANDO_APROVACAO'
  | 'ENTREGUE'
  | 'CONFIRMADO'
  | 'CANCELADO'
  | 'CANCELADA'
  | string;

const MAPA_ROTULOS: Record<string, string> = {
  NOVO: 'Novo Lead',
  EM_ANDAMENTO: 'Em Andamento',
  ORCAMENTAMENTO: 'Orçamentos',
  CONCLUIDO: 'Concluído',
  INATIVO: 'Inativo',
  PENDENTE: 'Pendente',
  AGENDADA: 'Visita Agendada',
  AGENDADO: 'Agendado',
  REALIZADO: 'Realizado',
  REALIZADA: 'Visita Realizada',
  RASCUNHO: 'Rascunho',
  ENVIADO: 'Enviado ao Cliente',
  APROVADO: 'Aprovado',
  RECUSADO: 'Recusado',
  AGUARDANDO_APROVACAO: 'Aguardando Aprovação',
  ENTREGUE: 'Entregue',
  CONFIRMADO: 'Confirmado',
  CANCELADO: 'Cancelado',
  CANCELADA: 'Cancelada',
};

const MAPA_ESTILOS: Record<string, string> = {
  NOVO: 'bg-info/10 text-info dark:bg-info/20 border-info/30 ring-1 ring-info/20',
  EM_ANDAMENTO: 'bg-primary/10 text-primary dark:bg-primary/20 border-primary/30 ring-1 ring-primary/20',
  ORCAMENTAMENTO: 'bg-warning/10 text-warning dark:bg-warning/20 border-warning/30 ring-1 ring-warning/20',
  CONCLUIDO: 'bg-success/10 text-success dark:bg-success/20 border-success/30 ring-1 ring-success/20',
  INATIVO: 'bg-muted/80 text-muted-foreground border-border/60',
  PENDENTE: 'bg-warning/10 text-warning dark:bg-warning/20 border-warning/30 ring-1 ring-warning/20',
  AGENDADA: 'bg-info/10 text-info dark:bg-info/20 border-info/30 ring-1 ring-info/20',
  AGENDADO: 'bg-info/10 text-info dark:bg-info/20 border-info/30 ring-1 ring-info/20',
  REALIZADO: 'bg-success/10 text-success dark:bg-success/20 border-success/30 ring-1 ring-success/20',
  REALIZADA: 'bg-success/10 text-success dark:bg-success/20 border-success/30 ring-1 ring-success/20',
  RASCUNHO: 'bg-muted/80 text-muted-foreground border-border/60',
  ENVIADO: 'bg-primary/10 text-primary dark:bg-primary/20 border-primary/30 ring-1 ring-primary/20',
  APROVADO: 'bg-success/10 text-success dark:bg-success/20 border-success/30 ring-1 ring-success/20',
  RECUSADO: 'bg-destructive/10 text-destructive dark:bg-destructive/20 border-destructive/30 ring-1 ring-destructive/20',
  AGUARDANDO_APROVACAO: 'bg-warning/10 text-warning dark:bg-warning/20 border-warning/30 ring-1 ring-warning/20',
  ENTREGUE: 'bg-success/10 text-success dark:bg-success/20 border-success/30 ring-1 ring-success/20',
  CONFIRMADO: 'bg-success/10 text-success dark:bg-success/20 border-success/30 ring-1 ring-success/20',
  CANCELADO: 'bg-destructive/10 text-destructive dark:bg-destructive/20 border-destructive/30 ring-1 ring-destructive/20',
  CANCELADA: 'bg-destructive/10 text-destructive dark:bg-destructive/20 border-destructive/30 ring-1 ring-destructive/20',
};

const STATUS_COM_PULSO = ['NOVO', 'EM_ANDAMENTO', 'AGENDADA', 'AGENDADO', 'AGUARDANDO_APROVACAO'];

interface StatusBadgeProps {
  status: StatusType;
  labelOverride?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, labelOverride, className = '', size = 'md' }: StatusBadgeProps) {
  const rotulo = labelOverride || MAPA_ROTULOS[status] || status;
  const estilo = MAPA_ESTILOS[status] || 'bg-muted text-muted-foreground border-border';
  const comPulso = STATUS_COM_PULSO.includes(status);
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold tracking-wide transition-all shadow-2xs ${sizeClasses} ${estilo} ${className}`}
    >
      <span className="relative flex h-2 w-2 items-center justify-center">
        {comPulso && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
        )}
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
      </span>
      {rotulo}
    </span>
  );
}
