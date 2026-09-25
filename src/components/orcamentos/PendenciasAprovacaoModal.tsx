import { cardClasses, btnPrimarioClasses } from './tipos';

interface Props {
  aberto: boolean;
  pendencias?: string[];
  onFechar: () => void;
}

const ROTULOS: Record<string, string> = {
  'ficha-ausente':
    'Ficha de obra ausente — preencha no passo "Ficha & Resumo".',
  'analise-critica-incompleta':
    'Análise crítica incompleta — há risco preenchido sem a ação correspondente.',
  'medicao-ausentes':
    'Medição ausente — informe a área (m²) e o valor por m².',
};

/** Modal exibido quando a aprovação retorna 409 ANALISE_CRITICA. */
export function PendenciasAprovacaoModal({ aberto, pendencias, onFechar }: Props) {
  if (!aberto) return null;
  const lista = (pendencias ?? []).filter((p) => p in ROTULOS);
  const desconhecidas = (pendencias ?? []).filter((p) => !(p in ROTULOS));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50 p-4">
      <div className={`${cardClasses} w-full max-w-md`}>
        <h2 className="text-base font-semibold">
          Pendências antes da aprovação
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          O orçamento não pôde ser aprovado porque há pendências:
        </p>
        <ul className="mt-3 flex flex-col gap-2 text-sm">
          {lista.map((p) => (
            <li key={p} className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900">
              {ROTULOS[p]}
            </li>
          ))}
          {desconhecidas.map((p) => (
            <li key={p} className="rounded-lg border px-3 py-2">
              {p}
            </li>
          ))}
          {lista.length === 0 && desconhecidas.length === 0 ? (
            <li className="text-muted-foreground">
              Nenhuma pendência detalhada retornada pelo servidor.
            </li>
          ) : null}
        </ul>
        <div className="mt-4 flex justify-end">
          <button type="button" className={btnPrimarioClasses} onClick={onFechar}>
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}
