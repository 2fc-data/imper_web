import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface ColaboradorOption {
  id: number;
  nome: string;
  cargo?: { id?: number; nome: string } | null;
  telefone?: string | null;
  papeis?: Array<{ papel: { id?: number; nome: string } }> | null;
}

interface MultiSelectColaboradoresProps {
  colaboradores: ColaboradorOption[];
  value: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function alternarColaborador(atuais: number[], id: number): number[] {
  if (atuais.includes(id)) {
    return atuais.filter((v) => v !== id);
  }
  return [...atuais, id];
}

export function filtrarApenasColaboradores(colaboradores: ColaboradorOption[]): ColaboradorOption[] {
  return colaboradores.filter((c) => {
    if (!c.papeis || !Array.isArray(c.papeis) || c.papeis.length === 0) {
      return false;
    }
    return c.papeis.some((p) => {
      const nome = p.papel?.nome?.trim().toUpperCase() ?? '';
      return nome === 'COLABORADOR' || nome === 'COLABORADORES';
    });
  });
}

export function MultiSelectColaboradores({
  colaboradores,
  value,
  onChange,
  disabled,
  placeholder = 'Selecione o(s) colaborador(es)...',
}: MultiSelectColaboradoresProps) {
  const [aberto, setAberto] = useState(false);
  const [filtro, setFiltro] = useState('');
  const [pos, setPos] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
    maxHeight: number;
    abrirParaCima: boolean;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Garante apresentação somente de usuários com papel de Colaboradores caso papeis estejam presentes
  const colaboradoresValidos = filtrarApenasColaboradores(colaboradores);

  const selecionados = colaboradoresValidos.filter((c) => value.includes(c.id));

  function alternar() {
    if (disabled) return;
    if (!aberto && containerRef.current) {
      const r = containerRef.current.getBoundingClientRect();
      const ALTURA_ESTIMADA = 280;
      const MARGEM = 10;
      const espacoAbaixo = window.innerHeight - r.bottom - MARGEM;
      const espacoAcima = r.top - MARGEM;
      const abrirParaCima = espacoAbaixo < ALTURA_ESTIMADA && espacoAcima > espacoAbaixo;
      const maxHeight = Math.max(140, Math.min(300, abrirParaCima ? espacoAcima : espacoAbaixo));

      let left = r.left;
      const largura = Math.max(r.width, 260);
      if (left + largura > window.innerWidth - MARGEM) {
        left = Math.max(MARGEM, window.innerWidth - largura - MARGEM);
      }

      setPos({
        top: abrirParaCima ? undefined : r.bottom + 4,
        bottom: abrirParaCima ? window.innerHeight - r.top + 4 : undefined,
        left,
        width: largura,
        maxHeight,
        abrirParaCima,
      });
      setFiltro('');
    }
    setAberto((v) => !v);
  }

  function toggleColaborador(id: number) {
    onChange(alternarColaborador(value, id));
  }

  function removerColaborador(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    onChange(value.filter((v) => v !== id));
  }

  const listaFiltrada = colaboradoresValidos.filter((c) => {
    if (!filtro.trim()) return true;
    const termo = filtro.toLowerCase();
    const nomeMatch = c.nome.toLowerCase().includes(termo);
    const cargoMatch = c.cargo?.nome?.toLowerCase().includes(termo) ?? false;
    return nomeMatch || cargoMatch;
  });

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={alternar}
        className="flex min-h-[34px] w-full flex-wrap items-center justify-between gap-1.5 rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-2xs hover:border-primary/50 transition-colors disabled:opacity-50 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
          {selecionados.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            selecionados.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1 rounded bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-xs font-medium"
              >
                <span className="truncate max-w-[140px]">{c.nome}</span>
                {c.cargo?.nome && (
                  <span className="text-[10px] opacity-75 hidden sm:inline">
                    ({c.cargo.nome})
                  </span>
                )}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => removerColaborador(c.id, e)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      removerColaborador(c.id, e as unknown as React.MouseEvent);
                    }
                  }}
                  className="hover:text-destructive hover:bg-primary/20 rounded-full w-3.5 h-3.5 inline-flex items-center justify-center text-[11px] leading-none ml-0.5"
                  title={`Remover ${c.nome}`}
                >
                  ✕
                </span>
              </span>
            ))
          )}
        </div>
        <div className="flex items-center gap-1 text-muted-foreground shrink-0 text-[10px]">
          {selecionados.length > 0 && (
            <span className="bg-primary/10 text-primary font-semibold px-1.5 py-0.2 rounded-full">
              {selecionados.length}
            </span>
          )}
          <span>{aberto ? '▲' : '▼'}</span>
        </div>
      </button>

      {aberto &&
        pos &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-40"
              aria-hidden
              onClick={() => setAberto(false)}
            />
            <div
              className="fixed z-50 flex flex-col rounded-lg border border-border bg-popover p-2 shadow-xl animate-in fade-in-50 duration-100"
              style={{
                top: pos.top !== undefined ? `${pos.top}px` : undefined,
                bottom: pos.bottom !== undefined ? `${pos.bottom}px` : undefined,
                left: `${pos.left}px`,
                width: `${pos.width}px`,
                maxHeight: `${pos.maxHeight}px`,
              }}
            >
              {/* Cabeçalho com busca */}
              <div className="mb-2 space-y-1.5 pb-1.5 border-b border-border/50">
                <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <span>Selecionar Especialistas</span>
                  {value.length > 0 && (
                    <button
                      type="button"
                      onClick={() => onChange([])}
                      className="text-[10px] text-destructive hover:underline font-normal normal-case"
                    >
                      Limpar seleção
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  placeholder="Filtrar por nome ou cargo..."
                  className="w-full rounded border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
              </div>

              {/* Lista com scroll */}
              <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                {listaFiltrada.length === 0 ? (
                  <p className="text-center py-3 text-xs text-muted-foreground">
                    Nenhum colaborador encontrado.
                  </p>
                ) : (
                  listaFiltrada.map((c) => {
                    const isChecked = value.includes(c.id);
                    return (
                      <label
                        key={c.id}
                        className={`flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-accent ${
                          isChecked ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5 rounded border-input text-primary focus:ring-primary"
                            checked={isChecked}
                            onChange={() => toggleColaborador(c.id)}
                          />
                          <span className="truncate">{c.nome}</span>
                        </div>
                        {c.cargo?.nome && (
                          <span className="text-[10px] text-muted-foreground shrink-0 ml-1">
                            {c.cargo.nome}
                          </span>
                        )}
                      </label>
                    );
                  })
                )}
              </div>

              {/* Rodapé */}
              <div className="pt-2 mt-1 border-t border-border/40 flex items-center justify-between text-xs">
                <span className="text-[11px] text-muted-foreground">
                  {value.length} selecionado(s)
                </span>
                <button
                  type="button"
                  onClick={() => setAberto(false)}
                  className="rounded bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Concluir
                </button>
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
