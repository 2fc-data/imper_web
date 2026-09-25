import { MateriaisLinhaEditor } from './MateriaisLinhaEditor';
import {
  atualizarLinha,
  cardClasses,
  inputClasses,
  labelClasses,
  numero,
  subtotalLinha,
  totaisDoEstado,
  type AtualizarEstado,
  type MaterialLinhaForm,
  type WizardState,
} from './tipos';

interface Props {
  state: WizardState;
  set: AtualizarEstado;
}

const brl = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Passo 3: precificação por linha (descrição, MO, quantidade, m², materiais). */
export function PassoPrecificacao({ state, set }: Props) {
  const totais = totaisDoEstado(state);

  if (state.atividades.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Adicione atividades no passo Cobertura para precificá-las aqui.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {state.atividades.map((a, aIdx) => (
        <div key={aIdx} className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">
            {a.etapaNome} › {a.subServicoNome} › {a.catalogo.nome}
          </h3>

          {a.linhas.map((l, lIdx) => {
            return (
              <div key={lIdx} className={cardClasses}>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <label className="flex flex-col gap-1 sm:col-span-2 lg:col-span-3">
                    <span className={labelClasses}>Descrição</span>
                    <input
                      className={inputClasses}
                      type="text"
                      value={l.descricao}
                      onChange={(e) =>
                        set((s) =>
                          atualizarLinha(s, aIdx, lIdx, {
                            descricao: e.target.value,
                          }),
                        )
                      }
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className={labelClasses}>Pessoas (MO)</span>
                    <input
                      className={inputClasses}
                      type="number"
                      min={1}
                      placeholder="—"
                      value={l.moPessoas ?? ''}
                      onChange={(e) =>
                        set((s) =>
                          atualizarLinha(s, aIdx, lIdx, {
                            moPessoas:
                              e.target.value === ''
                                ? null
                                : Number(e.target.value),
                          }),
                        )
                      }
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className={labelClasses}>Horas (MO)</span>
                    <input
                      className={inputClasses}
                      type="number"
                      min={0}
                      step="any"
                      placeholder="—"
                      value={l.moHoras ?? ''}
                      onChange={(e) =>
                        set((s) =>
                          atualizarLinha(s, aIdx, lIdx, {
                            moHoras:
                              e.target.value === ''
                                ? null
                                : Number(e.target.value),
                          }),
                        )
                      }
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className={labelClasses}>Valor/hora (R$)</span>
                    <input
                      className={inputClasses}
                      type="number"
                      min={0}
                      step="any"
                      placeholder="—"
                      value={l.moValorHora ?? ''}
                      onChange={(e) =>
                        set((s) =>
                          atualizarLinha(s, aIdx, lIdx, {
                            moValorHora:
                              e.target.value === ''
                                ? null
                                : Number(e.target.value),
                          }),
                        )
                      }
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className={labelClasses}>Quantidade (un.)</span>
                    <input
                      className={inputClasses}
                      type="number"
                      min={0}
                      step="any"
                      placeholder="—"
                      value={l.quantidade ?? ''}
                      onChange={(e) =>
                        set((s) =>
                          atualizarLinha(s, aIdx, lIdx, {
                            quantidade: numero(e.target.value),
                          }),
                        )
                      }
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className={labelClasses}>Área (m²)</span>
                    <input
                      className={inputClasses}
                      type="number"
                      min={0}
                      step="any"
                      placeholder="—"
                      value={l.areaM2 ?? ''}
                      onChange={(e) =>
                        set((s) =>
                          atualizarLinha(s, aIdx, lIdx, {
                            areaM2: numero(e.target.value),
                          }),
                        )
                      }
                    />
                  </label>

                  <div className="flex items-end justify-end pb-1.5">
                    <span className="text-sm font-semibold">
                      {brl(subtotalLinha(l))}
                    </span>
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3">
                    <MateriaisLinhaEditor
                      materiais={l.materiais}
                      onChange={(materiais: MaterialLinhaForm[]) =>
                        set((s) => atualizarLinha(s, aIdx, lIdx, { materiais }))
                      }
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      <div className={`${cardClasses} flex flex-col gap-1`}>
        <h3 className="text-sm font-semibold">Totais</h3>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Mão de obra</span>
          <span>{brl(totais.valorMO)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Materiais</span>
          <span>{brl(totais.valorMateriais)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Base m² × valor/m² (P4)
          </span>
          <span>{brl(totais.total - totais.valorMO - totais.valorMateriais)}</span>
        </div>
        <div className="mt-1 flex justify-between border-t pt-1 text-base font-semibold">
          <span>Total</span>
          <span>{brl(totais.total)}</span>
        </div>
      </div>
    </div>
  );
}
