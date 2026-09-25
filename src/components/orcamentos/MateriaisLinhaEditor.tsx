import { useEffect, useRef, useState } from 'react';
import { listarMateriais, type MaterialItem } from '../../lib/api';
import { inputClasses, labelClasses, type MaterialLinhaForm } from './tipos';

interface Props {
  materiais: MaterialLinhaForm[];
  onChange: (m: MaterialLinhaForm[]) => void;
}

function custoDe(m: MaterialItem): number | null {
  if (m.custoUnitario == null || m.custoUnitario === '') return null;
  const n = Number(m.custoUnitario);
  return Number.isFinite(n) ? n : null;
}

/** Busca com debounce (300ms) + lista de materiais adicionados na linha. */
export function MateriaisLinhaEditor({ materiais, onChange }: Props) {
  const [q, setQ] = useState('');
  const [resultados, setResultados] = useState<MaterialItem[]>([]);
  const [carregando, setCarregando] = useState(false);
  const seq = useRef(0);

  useEffect(() => {
    const termo = q.trim();
    if (termo.length < 2) {
      setResultados([]);
      return;
    }
    const id = ++seq.current;
    setCarregando(true);
    const t = window.setTimeout(() => {
      listarMateriais({ q: termo })
        .then((r) => {
          if (seq.current === id) setResultados(r.slice(0, 8));
        })
        .catch(() => {})
        .finally(() => {
          if (seq.current === id) setCarregando(false);
        });
    }, 300);
    return () => window.clearTimeout(t);
  }, [q]);

  const adicionar = (m: MaterialItem) => {
    if (materiais.some((x) => x.materialId === m.id)) return;
    onChange([
      ...materiais,
      { materialId: m.id, nome: m.nome, quantidade: 1, custoUnitario: custoDe(m) },
    ]);
    setQ('');
    setResultados([]);
  };

  const atualizar = (idx: number, patch: Partial<MaterialLinhaForm>) => {
    onChange(materiais.map((m, i) => (i === idx ? { ...m, ...patch } : m)));
  };

  const remover = (idx: number) => {
    onChange(materiais.filter((_, i) => i !== idx));
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="flex flex-col gap-1">
        <span className={labelClasses}>Adicionar material</span>
        <input
          className={inputClasses}
          type="search"
          placeholder="Buscar material (mín. 2 letras)…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </label>

      {q.trim().length >= 2 ? (
        <div className="rounded-lg border bg-popover">
          {carregando ? (
            <p className="p-2 text-xs text-muted-foreground">Buscando…</p>
          ) : resultados.length === 0 ? (
            <p className="p-2 text-xs text-muted-foreground">
              Nenhum material encontrado.
            </p>
          ) : (
            <ul>
              {resultados.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-2 py-1.5 text-left text-sm hover:bg-accent"
                    onClick={() => adicionar(m)}
                  >
                    <span>{m.nome}</span>
                    <span className="text-xs text-muted-foreground">
                      {custoDe(m) == null ? '—' : `R$ ${custoDe(m)}`}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {materiais.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {materiais.map((m, idx) => (
            <li
              key={m.materialId}
              className="grid grid-cols-[1fr_auto_4.5rem_auto] items-end gap-2 rounded-lg border p-2"
            >
              <span className="self-center text-sm">{m.nome}</span>
              <label className="flex flex-col gap-0.5">
                <span className="text-[10px] text-muted-foreground">Qtd</span>
                <input
                  className={inputClasses}
                  type="number"
                  min={0}
                  step="any"
                  value={m.quantidade}
                  onChange={(e) =>
                    atualizar(idx, { quantidade: Number(e.target.value) })
                  }
                />
              </label>
              <span className="pb-1.5 text-xs text-muted-foreground">
                {m.custoUnitario == null
                  ? 'custo n/d'
                  : `R$ ${(m.quantidade * m.custoUnitario).toFixed(2)}`}
              </span>
              <button
                type="button"
                className="pb-1.5 text-xs text-destructive hover:underline"
                onClick={() => remover(idx)}
              >
                remover
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
