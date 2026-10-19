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
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const selecionados = papeis.filter((p) => value.includes(p.id));

  function alternar() {
    if (!aberto && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left });
    }
    setAberto((v) => !v);
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={alternar}
        className="flex h-11 w-full flex-wrap items-center gap-1 rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm disabled:opacity-50"
      >
        {selecionados.length === 0 ? (
          <span className="text-muted-foreground">Nenhum perfil</span>
        ) : (
          selecionados.map((p) => (
            <span
              key={p.id}
              className={`inline-flex rounded-full px-2 py-0.5 text-sm font-medium ${badgetColor(p.nome)}`}
            >
              {ROTULO_PAPEL[p.nome] ?? p.nome}
            </span>
          ))
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
              className="fixed z-50 max-h-60 w-56 overflow-y-auto rounded-lg border bg-popover p-1 shadow-md"
              style={{ top: pos.top, left: pos.left }}
            >
              {papeis.map((p) => (
                <label
                  key={p.id}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-accent"
                >
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5"
                    checked={value.includes(p.id)}
                    onChange={() => onChange(selecionarPapel(value, p.id))}
                  />
                  <span>{ROTULO_PAPEL[p.nome] ?? p.nome}</span>
                </label>
              ))}
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}