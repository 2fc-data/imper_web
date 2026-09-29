import React from 'react';

interface ProcessFiltersProps {
  busca: string;
  onBuscaChange: (v: string) => void;
  statusFiltro?: string;
  onStatusFiltroChange?: (v: string) => void;
  opcoesStatus?: { value: string; label: string }[];
  dataDe?: string;
  onDataDeChange?: (v: string) => void;
  dataAte?: string;
  onDataAteChange?: (v: string) => void;
  placeholder?: string;
  modoVisao?: 'kanban' | 'tabela';
  onModoVisaoChange?: (v: 'kanban' | 'tabela') => void;
  actionsRight?: React.ReactNode;
}

export function ProcessFilters({
  busca,
  onBuscaChange,
  statusFiltro,
  onStatusFiltroChange,
  opcoesStatus,
  dataDe,
  onDataDeChange,
  dataAte,
  onDataAteChange,
  placeholder = 'Buscar por cliente, telefone ou descrição...',
  modoVisao,
  onModoVisaoChange,
  actionsRight,
}: ProcessFiltersProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card/70 backdrop-blur-md p-4 shadow-sm space-y-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
        {/* Campo de Busca */}
        <div className="relative flex-1">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground/70"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder={placeholder}
            value={busca}
            onChange={(e) => onBuscaChange(e.target.value)}
            className="w-full rounded-xl border border-input bg-background/80 pl-10 pr-4 py-2 text-sm shadow-2xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-all"
          />
          {busca && (
            <button
              type="button"
              onClick={() => onBuscaChange('')}
              className="absolute right-3 top-2.5 text-xs text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filtro de Status */}
        {statusFiltro !== undefined && onStatusFiltroChange && (
          <select
            value={statusFiltro}
            onChange={(e) => onStatusFiltroChange(e.target.value)}
            className="rounded-xl border border-input bg-background/80 px-3.5 py-2 text-sm shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 font-medium"
          >
            <option value="">Todos os status</option>
            {opcoesStatus?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        {/* Toggle Modo de Visão (Kanban vs Tabela) */}
        {modoVisao && onModoVisaoChange && (
          <div className="flex items-center gap-1 rounded-xl border border-border/80 bg-muted/60 p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => onModoVisaoChange('kanban')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                modoVisao === 'kanban'
                  ? 'bg-background text-primary shadow-xs ring-1 ring-border/50'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              Kanban
            </button>
            <button
              type="button"
              onClick={() => onModoVisaoChange('tabela')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                modoVisao === 'tabela'
                  ? 'bg-background text-primary shadow-xs ring-1 ring-border/50'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              Tabela
            </button>
          </div>
        )}

        {actionsRight && <div className="flex items-center gap-2">{actionsRight}</div>}
      </div>

      {/* Período de Datas */}
      {(onDataDeChange || onDataAteChange) && (
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border/40 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground flex items-center gap-1">
            <svg className="h-3.5 w-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Período:
          </span>
          {onDataDeChange && (
            <div className="flex items-center gap-1.5">
              <span>De</span>
              <input
                type="date"
                value={dataDe || ''}
                onChange={(e) => onDataDeChange(e.target.value)}
                className="rounded-lg border border-input bg-background px-2.5 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
          )}
          {onDataAteChange && (
            <div className="flex items-center gap-1.5">
              <span>Até</span>
              <input
                type="date"
                value={dataAte || ''}
                onChange={(e) => onDataAteChange(e.target.value)}
                className="rounded-lg border border-input bg-background px-2.5 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
