import { useEffect, useRef, useState } from 'react';
import { listarEpis, type EpiItem } from '../../lib/api';
import { inputClasses, labelClasses, type EpiLinhaForm } from './tipos';

interface Props {
  epis: EpiLinhaForm[];
  onChange: (e: EpiLinhaForm[]) => void;
}

function custoDe(e: EpiItem): number | null {
  if (e.custoUnitario == null || e.custoUnitario === '') return null;
  const n = Number(e.custoUnitario);
  return Number.isFinite(n) ? n : null;
}

/** Busca com debounce (300ms) + lista de EPIs adicionados na linha. */
export function EpisLinhaEditor({ epis, onChange }: Props) {
  const [q, setQ] = useState('');
  const [resultados, setResultados] = useState<EpiItem[]>([]);
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
      listarEpis({ q: termo })
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

  const adicionar = (e: EpiItem) => {
    if (epis.some((x) => x.epiId === e.id)) return;
    onChange([
      ...epis,
      {
        epiId: e.id,
        nome: e.nome,
        codigo: e.codigo,
        quantidade: 1,
        custoUnitario: custoDe(e),
      },
    ]);
    setQ('');
    setResultados([]);
  };

  const atualizar = (idx: number, patch: Partial<EpiLinhaForm>) => {
    onChange(epis.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
  };

  const remover = (idx: number) => {
    onChange(epis.filter((_, i) => i !== idx));
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="flex flex-col gap-1">
        <span className={labelClasses}>Adicionar EPI</span>
        <input
          className={inputClasses}
          type="search"
          placeholder="Buscar EPI (mín. 2 letras)…"
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
              Nenhum EPI encontrado.
            </p>
          ) : (
            <ul>
              {resultados.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-2 py-1.5 text-left text-sm hover:bg-accent"
                    onClick={() => adicionar(e)}
                  >
                    <span>
                      {e.codigo ? `${e.codigo} · ` : ''}
                      {e.nome}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {custoDe(e) == null ? 'preço não cadastrado' : `R$ ${custoDe(e)}`}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {epis.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {epis.map((e, idx) => (
            <li
              key={e.epiId}
              className="grid grid-cols-[1fr_4.5rem_5.5rem_auto_auto] items-end gap-2 rounded-lg border p-2"
            >
              <span className="self-center text-sm">
                {e.codigo ? `${e.codigo} · ` : ''}
                {e.nome}
              </span>
              <label className="flex flex-col gap-0.5">
                <span className="text-[10px] text-muted-foreground">Qtd</span>
                <input
                  className={inputClasses}
                  type="number"
                  min={0}
                  step="any"
                  value={e.quantidade}
                  onChange={(ev) =>
                    atualizar(idx, { quantidade: Number(ev.target.value) })
                  }
                />
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="text-[10px] text-muted-foreground">
                  Unit. (R$)
                </span>
                <input
                  className={inputClasses}
                  type="number"
                  min={0}
                  step="any"
                  placeholder="n/d"
                  value={e.custoUnitario ?? ''}
                  onChange={(ev) =>
                    atualizar(idx, {
                      custoUnitario:
                        ev.target.value === ''
                          ? null
                          : Number(ev.target.value),
                    })
                  }
                />
              </label>
              <span className="pb-1.5 text-xs text-muted-foreground">
                {e.custoUnitario == null
                  ? 'preço não cadastrado'
                  : `R$ ${(e.quantidade * e.custoUnitario).toFixed(2)}`}
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
