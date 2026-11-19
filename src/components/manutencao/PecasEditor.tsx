import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { InputMoeda } from '../ui/input-moeda';
import { selectClasses } from '../ui/form-classes';
import { somarMoeda } from '../../lib/format';
import { formatarValor } from '../../lib/datetime';
import {
  ACAO_PECA_LABEL,
  ORIGEM_PECA_LABEL,
  type AcaoPecaManutencao,
  type OrigemPecaManutencao,
  type PecaManutencaoInput,
} from '../../lib/api/pecas-manutencao';

export function PecasEditor({
  pecas,
  onChange,
  idPrefix = 'peca',
}: {
  pecas: PecaManutencaoInput[];
  onChange: (pecas: PecaManutencaoInput[]) => void;
  idPrefix?: string;
}) {
  const atualizar = (indice: number, alteracao: Partial<PecaManutencaoInput>) => {
    onChange(
      pecas.map((peca, i) =>
        i === indice ? { ...peca, ...alteracao } : peca,
      ),
    );
  };

  const remover = (indice: number) => {
    onChange(pecas.filter((_, i) => i !== indice));
  };

  const adicionar = () => {
    onChange([
      ...pecas,
      { descricao: '', acao: 'TROCADA', origem: null, valor: undefined },
    ]);
  };

  const total = somarMoeda(...pecas.map((peca) => peca.valor));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Peças</span>
        <Button type="button" variant="outline" size="sm" onClick={adicionar}>
          + Adicionar peça
        </Button>
      </div>

      {pecas.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhuma peça adicionada.
        </p>
      )}

      <div className="space-y-2">
        {pecas.map((peca, indice) => (
          <div
            key={indice}
            className="grid gap-2 rounded-lg border border-input p-3 sm:grid-cols-[minmax(0,1fr)_150px_160px_150px_auto] sm:items-center"
          >
            <Input
              aria-label={`Descrição da peça ${indice + 1}`}
              placeholder="Descrição da peça"
              value={peca.descricao}
              onChange={(e) =>
                atualizar(indice, { descricao: e.target.value })
              }
            />

            <select
              aria-label={`Ação da peça ${indice + 1}`}
              className={selectClasses}
              value={peca.acao}
              onChange={(e) => {
                const acao = e.target.value as AcaoPecaManutencao;
                atualizar(indice, {
                  acao,
                  origem: acao === 'CONSERTADA' ? null : peca.origem,
                });
              }}
            >
              {(
                Object.keys(ACAO_PECA_LABEL) as AcaoPecaManutencao[]
              ).map((acao) => (
                <option key={acao} value={acao}>
                  {ACAO_PECA_LABEL[acao]}
                </option>
              ))}
            </select>

            {peca.acao === 'TROCADA' ? (
              <select
                aria-label={`Origem da peça ${indice + 1}`}
                className={selectClasses}
                value={peca.origem ?? ''}
                onChange={(e) =>
                  atualizar(indice, {
                    origem: (e.target.value || null) as
                      | OrigemPecaManutencao
                      | null,
                  })
                }
              >
                <option value="" disabled>
                  Selecione a origem...
                </option>
                {(
                  Object.keys(ORIGEM_PECA_LABEL) as OrigemPecaManutencao[]
                ).map((origem) => (
                  <option key={origem} value={origem}>
                    {ORIGEM_PECA_LABEL[origem]}
                  </option>
                ))}
              </select>
            ) : (
              <span className="hidden text-sm text-muted-foreground sm:block">
                —
              </span>
            )}

            <InputMoeda
              id={`${idPrefix}-valor-${indice}`}
              value={peca.valor}
              onChange={(valor) => atualizar(indice, { valor })}
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remover peça ${indice + 1}`}
              onClick={() => remover(indice)}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
              </svg>
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-input pt-2 text-sm">
        <span className="text-muted-foreground">Total de peças</span>
        <span className="font-semibold">{formatarValor(total)}</span>
      </div>
    </div>
  );
}
