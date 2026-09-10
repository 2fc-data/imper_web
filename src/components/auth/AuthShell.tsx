import { m } from 'framer-motion';
import type { ReactNode } from 'react';
import { fadeUp, stagger } from '../../lib/motion';
import { ThemeToggle } from '../../theme/ThemeToggle';

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full">
      <aside className="relative hidden w-[45%] shrink-0 overflow-hidden border-r border-border bg-primary/70 lg:flex">
        <div className="relative z-10 flex flex-col p-10">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-primary font-serif">
            Imperpoços
          </p>

          <div className="mt-auto space-y-6">
            <h1 className="max-w-md text-4xl font-bold leading-tight tracking-tight font-serif">
              Engenharia que protege onde a água ataca.
            </h1>

            <div className="flex items-center gap-3 text-sm">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 shrink-0 rotate-45 bg-primary"
              />
              Conformidade com a{' '}
              <a
                href="https://pt.scribd.com/document/713022317/ABNT-NBR-9575-2010-Impermeabilizacao-Selecao-de-projeto"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 decoration-foreground/30 transition-colors hover:text-foreground hover:decoration-foreground"
              >
                NBR 9574
              </a>{' '}
              — garantia e suporte especializado
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-background">
        <div className="flex items-center justify-end px-4 py-4 sm:px-6 lg:px-8">
          <ThemeToggle />
        </div>

        <m.div
          className="flex flex-1 items-center justify-center px-4 pb-10 sm:px-6"
          variants={stagger(0.1, 0.05)}
          initial="hidden"
          animate="visible"
        >
          <m.div variants={fadeUp} className="w-full max-w-md">
            {children}
          </m.div>
        </m.div>
      </div>
    </div>
  );
}
