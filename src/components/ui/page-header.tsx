import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  back?: ReactNode;
  className?: string;
  titleAs?: 'h1' | 'h2';
}

export function PageHeader({
  title,
  description,
  actions,
  back,
  className,
  titleAs: Heading = 'h1',
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        {back}
        <Heading className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </Heading>
        {description ? (
          <p className="max-w-[70ch] text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
