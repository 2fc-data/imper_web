import type { FichaInput } from '../../lib/api';
import {
  atualizarFicha,
  cardClasses,
  inputClasses,
  labelClasses,
  numero,
  selectClasses,
  subtotalLinha,
  textareaClasses,
  totaisDoEstado,
  type AtualizarEstado,
  type WizardState,
} from './tipos';

interface Props {
  state: WizardState;
  set: AtualizarEstado;
}

const brl = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const OPCOES: Record<string, { valor: string; rotulo: string }[]> = {
  acabamentoPiso: [
    { valor: 'CERAMICA', rotulo: 'Cerâmica' },
    { valor: 'PORCELANATO', rotulo: 'Porcelanato' },
    { valor: 'CIMENTO', rotulo: 'Cimento' },
    { valor: 'REVESTIMENTO', rotulo: 'Revestimento' },
    { valor: 'OUTRO', rotulo: 'Outro' },
  ],
  acabamentoParede: [
    { valor: 'PINTURA', rotulo: 'Pintura' },
    { valor: 'REVESTIMENTO_CERAMICO', rotulo: 'Revestimento cerâmico' },
    { valor: 'APLICACAO', rotulo: 'Aplicação' },
    { valor: 'OUTRO', rotulo: 'Outro' },
  ],
  tipoForro: [
    { valor: 'GESSO', rotulo: 'Gesso' },
    { valor: 'PVC', rotulo: 'PVC' },
    { valor: 'DRYWALL', rotulo: 'Drywall' },
    { valor: 'ALVENARIA', rotulo: 'Alvenaria' },
    { valor: 'NENHUM', rotulo: 'Nenhum' },
  ],
  tipoEsquadria: [
    { valor: 'ALUMINIO', rotulo: 'Alumínio' },
    { valor: 'MADEIRA', rotulo: 'Madeira' },
    { valor: 'FERRO', rotulo: 'Ferro' },
    { valor: 'PVC', rotulo: 'PVC' },
    { valor: 'OUTRO', rotulo: 'Outro' },
  ],
  padraoAcabamento: [
    { valor: 'BASICO', rotulo: 'Básico' },
    { valor: 'STANDARD', rotulo: 'Standard' },
    { valor: 'PREMIUM', rotulo: 'Premium' },
  ],
};

type ChaveOpcao = keyof typeof OPCOES;

function SelectFicha({
  chave,
  valor,
  onChange,
}: {
  chave: ChaveOpcao;
  valor: string | null | undefined;
  onChange: (v: string | null) => void;
}) {
  return (
    <select
      className={selectClasses}
      value={valor ?? ''}
      onChange={(e) => onChange(e.target.value ? e.target.value : null)}
    >
      <option value="">—</option>
      {OPCOES[chave].map((o) => (
        <option key={o.valor} value={o.valor}>
          {o.rotulo}
        </option>
      ))}
    </select>
  );
}

function NumFicha({
  valor,
  onChange,
  placeholder,
}: {
  valor: number | null | undefined;
  onChange: (v: number | null) => void;
  placeholder?: string;
}) {
  return (
    <input
      className={inputClasses}
      type="number"
      min={0}
      step="any"
      placeholder={placeholder ?? '—'}
      value={valor ?? ''}
      onChange={(e) => onChange(numero(e.target.value))}
    />
  );
}

/** Passo 4: ficha (blocos 2–4) + medição base + resumo + validade. */
export function PassoFichaResumo({ state, set }: Props) {
  const totais = totaisDoEstado(state);
  const ficha = state.ficha;
  const f = (patch: Partial<FichaInput>) =>
    set((s) => atualizarFicha(s, patch));

  const cuidadosTexto = (ficha.cuidados ?? []).join('\n');
  const riscos: [1 | 2 | 3][] = [[1], [2], [3]];

  return (
    <div className="flex flex-col gap-5">
      {/* Bloco 2 — Medições da obra */}
      <section className={cardClasses}>
        <h3 className="mb-3 text-sm font-semibold">Medições da obra</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1">
            <span className={labelClasses}>Área do piso (m²)</span>
            <NumFicha
              valor={ficha.areaPisoM2}
              onChange={(v) => f({ areaPisoM2: v })}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClasses}>Área de parede (m²)</span>
            <NumFicha
              valor={ficha.areaParedeM2}
              onChange={(v) => f({ areaParedeM2: v })}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClasses}>Área do teto (m²)</span>
            <NumFicha
              valor={ficha.areaTetoM2}
              onChange={(v) => f({ areaTetoM2: v })}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClasses}>Perímetro (m)</span>
            <NumFicha
              valor={ficha.perimetroM}
              onChange={(v) => f({ perimetroM: v })}
            />
          </label>
        </div>
      </section>

      {/* Bloco 3 — Acabamentos */}
      <section className={cardClasses}>
        <h3 className="mb-3 text-sm font-semibold">Acabamentos</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1">
            <span className={labelClasses}>Acabamento do piso</span>
            <SelectFicha
              chave="acabamentoPiso"
              valor={ficha.acabamentoPiso}
              onChange={(v) =>
                f({ acabamentoPiso: v as FichaInput['acabamentoPiso'] })
              }
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClasses}>Acabamento de parede</span>
            <SelectFicha
              chave="acabamentoParede"
              valor={ficha.acabamentoParede}
              onChange={(v) =>
                f({ acabamentoParede: v as FichaInput['acabamentoParede'] })
              }
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClasses}>Tipo de forro</span>
            <SelectFicha
              chave="tipoForro"
              valor={ficha.tipoForro}
              onChange={(v) =>
                f({ tipoForro: v as FichaInput['tipoForro'] })
              }
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClasses}>Tipo de esquadria</span>
            <SelectFicha
              chave="tipoEsquadria"
              valor={ficha.tipoEsquadria}
              onChange={(v) =>
                f({ tipoEsquadria: v as FichaInput['tipoEsquadria'] })
              }
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClasses}>Padrão de acabamento</span>
            <SelectFicha
              chave="padraoAcabamento"
              valor={ficha.padraoAcabamento}
              onChange={(v) =>
                f({ padraoAcabamento: v as FichaInput['padraoAcabamento'] })
              }
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClasses}>Caixas de luz</span>
            <NumFicha
              valor={ficha.caixasLuz}
              onChange={(v) => f({ caixasLuz: v })}
            />
          </label>
        </div>
      </section>

      {/* Bloco 4 — Análise crítica de riscos + cuidados */}
      <section className={cardClasses}>
        <h3 className="mb-3 text-sm font-semibold">
          Análise crítica de riscos
        </h3>
        <div className="flex flex-col gap-3">
          {riscos.map(([n]) => (
            <div
              key={n}
              className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
            >
              <label className="flex flex-col gap-1">
                <span className={labelClasses}>Risco {n}</span>
                <input
                  className={inputClasses}
                  type="text"
                  value={(ficha[`risco${n}`] as string | null) ?? ''}
                  onChange={(e) =>
                    f({
                      [`risco${n}`]: e.target.value || null,
                    } as Partial<FichaInput>)
                  }
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className={labelClasses}>Ação {n}</span>
                <input
                  className={inputClasses}
                  type="text"
                  value={(ficha[`acao${n}`] as string | null) ?? ''}
                  onChange={(e) =>
                    f({
                      [`acao${n}`]: e.target.value || null,
                    } as Partial<FichaInput>)
                  }
                />
              </label>
              <span className="hidden self-end pb-2 text-[10px] text-muted-foreground sm:block">
                (pareado)
              </span>
            </div>
          ))}
        </div>

        <label className="mt-3 flex flex-col gap-1">
          <span className={labelClasses}>
            Cuidados (um por linha)
          </span>
          <textarea
            className={`${textareaClasses} min-h-20`}
            placeholder={'Ex.:\nProteger o piso antes de iniciar\nVentilar o ambiente'}
            value={cuidadosTexto}
            onChange={(e) =>
              f({
                cuidados:
                  e.target.value === ''
                    ? undefined
                    : e.target.value.split('\n'),
              })
            }
          />
        </label>
      </section>

      {/* Medição base (m² × valor/m²) + validade */}
      <section className={cardClasses}>
        <h3 className="mb-3 text-sm font-semibold">Medição base e validade</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1">
            <span className={labelClasses}>Área total (m²)</span>
            <NumFicha
              valor={state.areaM2}
              onChange={(v) => set((s) => ({ ...s, areaM2: v }))}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClasses}>Valor por m² (R$)</span>
            <NumFicha
              valor={state.valorM2}
              onChange={(v) => set((s) => ({ ...s, valorM2: v }))}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClasses}>Validade da proposta *</span>
            <input
              className={inputClasses}
              type="date"
              value={state.validade}
              onChange={(e) =>
                set((s) => ({ ...s, validade: e.target.value }))
              }
            />
          </label>
        </div>
        {(state.areaM2 == null || state.valorM2 == null) ? (
          <p className="mt-2 text-xs text-amber-600">
            Área e valor por m² são obrigatórios para aprovar o orçamento
            (pendência <code>medicao-ausentes</code>).
          </p>
        ) : null}
      </section>

      {/* Resumo */}
      <section className={cardClasses}>
        <h3 className="mb-3 text-sm font-semibold">Resumo</h3>
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Atividades</span>
            <span>
              {state.atividades.length} ·{' '}
              {state.atividades.reduce((n, a) => n + a.linhas.length, 0)} linhas
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Mão de obra</span>
            <span>{brl(totais.valorMO)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Materiais</span>
            <span>{brl(totais.valorMateriais)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Medição (m² × valor/m²)</span>
            <span>
              {brl(
                state.areaM2 != null && state.valorM2 != null
                  ? state.areaM2 * state.valorM2
                  : 0,
              )}
            </span>
          </div>
          <div className="mt-1 flex justify-between border-t pt-1 text-base font-semibold">
            <span>Total do orçamento</span>
            <span>{brl(totais.total)}</span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-1 text-xs text-muted-foreground">
          <p>
            Subtotal por atividade:{' '}
            {state.atividades
              .map(
                (a) =>
                  `${a.catalogo.nome}: ${brl(
                    a.linhas.reduce((acc, l) => acc + subtotalLinha(l), 0),
                  )}`,
              )
              .join(' · ')}
          </p>
        </div>
      </section>
    </div>
  );
}
