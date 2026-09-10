import { m } from 'framer-motion';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { fadeUp, stagger } from '../../lib/motion';
import { ThemeToggle } from '../../theme/ThemeToggle';

const CALLOUTS = [
  'Lajes, terraços e coberturas',
  "Caixas d'água e reservatórios",
  'Estruturas enterradas e subsolos',
];

const STATS = [
  { value: '30+', label: 'anos de obra' },
  { value: 'NBR 9574', label: 'norma de execução' },
  { value: '5.000+', label: 'm² impermeabilizados' },
];

function BackHomeLink() {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      Voltar para Home
    </Link>
  );
}

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full">
      <aside className="relative hidden w-[45%] shrink-0 overflow-hidden border-r border-border lg:flex">
        <div
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
          style={{
            background: 'linear-gradient(160deg, hsl(var(--primary) / 0.7) 0%, hsl(var(--primary) / 0.15) 50%, hsl(var(--primary) / 0.4) 100%)',
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-primary/20 mix-blend-multiply"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, var(--border) 0 1px, transparent 1px 72px), repeating-linear-gradient(90deg, var(--border) 0 1px, transparent 1px 72px)',
            opacity: 0.35,
            mixBlendMode: 'multiply',
          }}
        />
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 h-full w-1 bg-primary"
        />

        <div className="relative z-10 flex flex-col p-10">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-primary font-serif">
            Imperpoços
          </p>

          <div className="mt-auto space-y-8">
            <h1 className="max-w-md text-4xl font-bold leading-tight tracking-tight font-serif">
              Engenharia que protege onde a água ataca.
            </h1>

            <ul className="space-y-3">
              {CALLOUTS.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm">
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 shrink-0 rotate-45 bg-primary"
                  />
                  {item}
                </li>
              ))}
            </ul>

            <dl className="grid grid-cols-3 gap-6 border-t border-border pt-6">
              {STATS.map((stat) => (
                <div key={stat.label}>
                  <dt className="text-lg font-bold tracking-tight text-foreground font-serif">
                    {stat.value}
                  </dt>
                   <dd className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                    {stat.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-background">
        <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <BackHomeLink />
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
