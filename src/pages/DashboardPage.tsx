import { m, type Variants } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { fadeUp, stagger } from '../lib/motion';
import { cn } from '../lib/utils';

interface DashboardResumo {
  atendimentosNovos: number;
  orcamentosAbertos: number;
  osAndamento: number;
  baixaEstoque: number;
}

type Tendencia = 'primario' | 'secundario' | 'alerta';

const container: Variants = stagger(0.08, 0.05);

function KpiCard({
  label,
  value,
  icon,
  to,
  tendencia,
  hint,
}: {
  label: string;
  value?: number;
  icon: React.ReactNode;
  to: string;
  tendencia: Tendencia;
  hint?: string;
}) {
  const badge =
    tendencia === 'alerta'
      ? 'bg-destructive/10 text-destructive'
      : tendencia === 'secundario'
        ? 'bg-secondary text-secondary-foreground'
        : 'bg-primary/10 text-primary';

  return (
    <m.div variants={fadeUp}>
      <Link
        to={to}
        className="group flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm transition-colors hover:border-primary/40 hover:text-primary"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            {label}
          </span>
          <span
            className={cn(
              'rounded-md p-1.5 transition-transform group-hover:scale-110',
              badge,
            )}
          >
            {icon}
          </span>
        </div>
        <div className="flex items-end justify-between gap-2">
          <span className="text-4xl font-semibold tabular-nums tracking-tight">
            {value === undefined ? '–' : value}
          </span>
          {hint && (
            <span className="text-xs text-muted-foreground">{hint}</span>
          )}
        </div>
      </Link>
    </m.div>
  );
}

const icone = (d: string) => (
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
    <path d={d} />
  </svg>
);

export default function DashboardPage() {
  const [resumo, setResumo] = useState<DashboardResumo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recarregando, setRecarregando] = useState(false);

  const carregar = useCallback(async (reload = false) => {
    if (reload) setRecarregando(true);
    try {
      const dados = await api.get<DashboardResumo>('/dashboard/resumo');
      setResumo(dados);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao carregar o resumo',
      );
    } finally {
      setRecarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const itens = [
    {
      label: 'Atendimentos novos',
      value: resumo?.atendimentosNovos,
      to: '/atendimentos',
      tendencia: 'primario' as Tendencia,
      icon: icone('M12 3a3 3 0 100 6 3 3 0 000-6zM8 21v-2a4 4 0 018 0v2'),
    },
    {
      label: 'Orçamentos abertos',
      value: resumo?.orcamentosAbertos,
      to: '/orcamentos',
      tendencia: 'primario' as Tendencia,
      icon: icone(
        'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      ),
    },
    {
      label: 'OS em andamento',
      value: resumo?.osAndamento,
      to: '/os',
      tendencia: 'primario' as Tendencia,
      icon: icone('M9 12h6M9 16h6M8 8h8M20 12a8 8 0 11-16 0 8 8 0 0116 0z'),
    },
    {
      label: 'Materiais em baixa',
      value: resumo?.baixaEstoque,
      to: '/materiais',
      tendencia:
        resumo !== null && resumo.baixaEstoque > 0
          ? ('alerta' as Tendencia)
          : ('secundario' as Tendencia),
      icon: icone('M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10'),
    },
  ];

  return (
    <m.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <m.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Início</h1>
          <p className="text-sm text-muted-foreground">
            Resumo das operações de hoje
          </p>
        </div>
        <button
          type="button"
          onClick={() => carregar(true)}
          disabled={recarregando}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium text-muted-foreground shadow-sm transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-60"
        >
          <span className={cn(recarregando && 'animate-spin')}>
            {icone('M21 12a9 9 0 11-3-6.7M21 3v4h-4')}
          </span>
          <span className="hidden sm:inline">Atualizar</span>
        </button>
      </m.div>

      {error && (
        <m.p
          variants={fadeUp}
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </m.p>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {itens.map((item) => (
          <KpiCard key={item.label} {...item} />
        ))}
      </div>

      <m.div
        variants={fadeUp}
        className="rounded-lg border bg-card p-4 shadow-sm"
      >
        <h2 className="mb-1 text-sm font-semibold">Atalhos rápidos</h2>
        <p className="text-sm text-muted-foreground">
          Use a barra lateral para acessar ações do módulo atual e as abas no
          topo para navegar entre as áreas.
        </p>
      </m.div>
    </m.div>
  );
}
