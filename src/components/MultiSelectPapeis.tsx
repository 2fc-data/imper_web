import { useState } from 'react';
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
  const selecionados = papeis.filter((p) => value.includes(p.id));

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setAberto((v) => !v)}
        className="flex min-h-8 min-w-32 flex-wrap items-center gap-1 rounded border border-input bg-background px-2 text-xs shadow-sm disabled:opacity-50"
      >
        {selecionados.length === 0 ? (
          <span className="text-muted-foreground">Nenhum perfil</span>
        ) : (
          selecionados.map((p) => (
            <span
              key={p.id}
              className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${badgetColor(p.nome)}`}
            >
              {ROTULO_PAPEL[p.nome] ?? p.nome}
            </span>
          ))
        )}
      </button>
      {aberto && (
        <>
          <div
            className="fixed inset-0 z-40"
            aria-hidden
            onClick={() => setAberto(false)}
          />
          <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-md border bg-popover p-1 shadow-md">
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
        </>
      )}
    </div>
  );
}