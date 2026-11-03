import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { PapelRbac } from '../lib/api/usuarios';
import { badgetColor, ROTULO_PAPEL } from '../lib/papeis-ui';

export function selecionarPapel(ids: number[], id: number): number[] {
  if (ids.includes(id)) {
    const restantes = ids.filter((valor) => valor !== id);
    return restantes.length > 0 ? restantes : ids;
  }
  return [...ids, id];
}

interface MultiSelectPapeisProps {
  papeis: PapelRbac[];
  value: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
}

export function MultiSelectPapeis({
  papeis,
  value,
  onChange,
  disabled,
}: MultiSelectPapeisProps) {
  const [aberto, setAberto] = useState(false);
  const [pos, setPos] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    maxHeight: number;
    abrirParaCima: boolean;
  } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const selecionados = papeis.filter((p) => value.includes(p.id));

  function alternar() {
    if (!aberto && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const ALTURA_ESTIMADA = 250;
      const MARGEM = 12;
      const espacoAbaixo = window.innerHeight - r.bottom - MARGEM;
      const espacoAcima = r.top - MARGEM;
      const abrirParaCima = espacoAbaixo < ALTURA_ESTIMADA && espacoAcima > espacoAbaixo;

      const maxHeight = Math.max(120, Math.min(260, abrirParaCima ? espacoAcima : espacoAbaixo));

      let left = r.left;
      const LARGURA = 240;
      if (left + LARGURA > window.innerWidth - MARGEM) {
        left = Math.max(MARGEM, r.right - LARGURA);
      }

      setPos({
        top: abrirParaCima ? undefined : r.bottom + 4,
        bottom: abrirParaCima ? window.innerHeight - r.top + 4 : undefined,
        left,
        maxHeight,
        abrirParaCima,
      });
    }
    setAberto((v) => !v);
  }

  return (
    <div className="relative w-full">
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={alternar}
        className="flex min-h-[36px] h-auto w-full min-w-[190px] flex-wrap items-center gap-1.5 rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs shadow-xs hover:border-accent transition-colors disabled:opacity-50 text-left cursor-pointer"
        title="Clique para gerenciar perfis"
      >
        {selecionados.length === 0 ? (
          <span className="text-muted-foreground">Nenhum perfil</span>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            {selecionados.map((p) => (
              <span
                key={p.id}
                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium shadow-2xs leading-normal ${badgetColor(p.nome)}`}
              >
                {ROTULO_PAPEL[p.nome] ?? p.nome}
              </span>
            ))}
          </div>
        )}
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
              className="fixed z-50 w-60 overflow-y-auto rounded-lg border bg-popover p-2 shadow-lg"
              style={{
                top: pos.top !== undefined ? `${pos.top}px` : undefined,
                bottom: pos.bottom !== undefined ? `${pos.bottom}px` : undefined,
                left: `${pos.left}px`,
                maxHeight: `${pos.maxHeight}px`,
              }}
            >
              <div className="px-1.5 pb-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b mb-1">
                Perfis de Acesso
              </div>
              <div className="space-y-1">
                {papeis.map((p) => {
                  const isChecked = value.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className={`flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-accent ${
                        isChecked ? 'bg-accent/40 font-medium' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 rounded border-input text-primary focus:ring-1"
                          checked={isChecked}
                          onChange={() => onChange(selecionarPapel(value, p.id))}
                        />
                        <span
                          className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium border ${badgetColor(p.nome)}`}
                        >
                          {ROTULO_PAPEL[p.nome] ?? p.nome}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}