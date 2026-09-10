import { type ReactNode, useId, useState } from 'react';
import { cn } from '../lib/utils';

export function Accordion({
  items,
}: {
  items: {
    titulo: string;
    descricao?: string;
    conteudo: ReactNode;
  }[];
}) {
  return (
    <div className="space-y-2" role="list">
      {items.map((item, i) => (
        <AccordionItem key={i} index={i} {...item} />
      ))}
    </div>
  );
}

function AccordionItem({
  titulo,
  descricao,
  conteudo,
  index,
}: {
  titulo: string;
  descricao?: string;
  conteudo: ReactNode;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const triggerId = `accordion-trigger-${id}`;
  const panelId = `accordion-panel-${id}`;

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 transition-colors" role="listitem">
      <button
        type="button"
        id={triggerId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
      >
        <div className="min-w-0">
          <span className="text-sm font-semibold">{titulo}</span>
          {descricao && (
            <span className="ml-2 text-xs text-muted-foreground">
              {descricao}
            </span>
          )}
        </div>
        <svg
          aria-hidden="true"
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180',
          )}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div
          id={panelId}
          role="region"
          aria-labelledby={triggerId}
          className="border-t border-border/40 px-4 pb-4 pt-3"
        >
          {conteudo}
        </div>
      )}
    </div>
  );
}
