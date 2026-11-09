import React from 'react';
import { Button } from '../ui/button';

export type PeriodoOpcao = '7d' | '30d' | 'mes' | 'ano' | 'tudo' | 'custom';

export interface FiltrosAnalyticsState {
  periodo: PeriodoOpcao;
  dataInicio?: string;
  dataFim?: string;
  status?: string;
  categoria?: string; // canal ou tipo
  busca?: string;
}

interface AnalyticsFilterBarProps {
  filtros: FiltrosAnalyticsState;
  onChange: (novosFiltros: FiltrosAnalyticsState) => void;
  opcoesStatus?: { valor: string; rotulo: string }[];
  opcoesCategoria?: { valor: string; rotulo: string }[];
  labelCategoria?: string;
  onExportarCsv?: () => void;
  onExportarPdf?: () => void;
  isExporting?: boolean;
}

export function AnalyticsFilterBar({
  filtros,
  onChange,
  opcoesStatus = [],
  opcoesCategoria = [],
  labelCategoria = 'Categoria',
  onExportarCsv,
  onExportarPdf,
  isExporting = false,
}: AnalyticsFilterBarProps) {
  const periodos: { id: PeriodoOpcao; label: string }[] = [
    { id: '7d', label: '7 dias' },
    { id: '30d', label: '30 dias' },
    { id: 'mes', label: 'Este mês' },
    { id: 'ano', label: 'Este ano' },
    { id: 'tudo', label: 'Tudo' },
    { id: 'custom', label: 'Personalizado' },
  ];

  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Botões de Período Rápido */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Período:
          </span>
          {periodos.map((p) => {
            const ativo = filtros.periodo === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onChange({ ...filtros, periodo: p.id })}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  ativo
                    ? 'bg-primary text-primary-foreground shadow-2xs'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Botões de Exportação */}
        <div className="flex items-center gap-2">
          {onExportarCsv && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isExporting}
              onClick={onExportarCsv}
              className="h-8 gap-1.5 text-xs font-medium"
            >
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              CSV
            </Button>
          )}
          {onExportarPdf && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isExporting}
              onClick={onExportarPdf}
              className="h-8 gap-1.5 text-xs font-medium"
            >
              <svg
                className="h-3.5 w-3.5 text-destructive"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              PDF
            </Button>
          )}
        </div>
      </div>

      {/* Linha secundária de filtros: Data customizada, Status e Categoria */}
      <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-border/50 text-xs">
        <div className="flex items-center gap-1.5 flex-1 min-w-[140px] max-w-xs">
          <input
            type="text"
            placeholder="Buscar..."
            value={filtros.busca || ''}
            onChange={(e) =>
              onChange({ ...filtros, busca: e.target.value || undefined })
            }
            className="w-full rounded-lg border border-input bg-background px-2.5 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        {filtros.periodo === 'custom' && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">De:</span>
            <input
              type="date"
              value={filtros.dataInicio || ''}
              onChange={(e) =>
                onChange({ ...filtros, dataInicio: e.target.value })
              }
              className="rounded-lg border border-input bg-background px-2 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <span className="text-muted-foreground">Até:</span>
            <input
              type="date"
              value={filtros.dataFim || ''}
              onChange={(e) =>
                onChange({ ...filtros, dataFim: e.target.value })
              }
              className="rounded-lg border border-input bg-background px-2 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        )}

        {opcoesStatus.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Status:</span>
            <select
              value={filtros.status || ''}
              onChange={(e) =>
                onChange({ ...filtros, status: e.target.value || undefined })
              }
              className="rounded-lg border border-input bg-background px-2.5 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Todos os status</option>
              {opcoesStatus.map((op) => (
                <option key={op.valor} value={op.valor}>
                  {op.rotulo}
                </option>
              ))}
            </select>
          </div>
        )}

        {opcoesCategoria.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">{labelCategoria}:</span>
            <select
              value={filtros.categoria || ''}
              onChange={(e) =>
                onChange({ ...filtros, categoria: e.target.value || undefined })
              }
              className="rounded-lg border border-input bg-background px-2.5 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Todas</option>
              {opcoesCategoria.map((op) => (
                <option key={op.valor} value={op.valor}>
                  {op.rotulo}
                </option>
              ))}
            </select>
          </div>
        )}

        {(filtros.status || filtros.categoria || filtros.busca || filtros.periodo !== 'tudo') && (
          <button
            type="button"
            onClick={() =>
              onChange({
                periodo: 'tudo',
                status: undefined,
                categoria: undefined,
                busca: undefined,
                dataInicio: undefined,
                dataFim: undefined,
              })
            }
            className="ml-auto text-xs text-muted-foreground hover:text-foreground underline"
          >
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  );
}

