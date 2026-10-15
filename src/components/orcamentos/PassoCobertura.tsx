import { useState } from 'react';
import { CascataVocabulario } from './CascataVocabulario';
import { EpisLinhaEditor } from './EpisLinhaEditor';
import { MateriaisLinhaEditor } from './MateriaisLinhaEditor';
import {
  adicionarLinha,
  atualizarLinha,
  btnPrimarioClasses,
  cascataVazia,
  cardClasses,
  inputClasses,
  labelClasses,
  linhaDaCascata,
  numero,
  removerAtividade,
  removerLinha,
  rotuloAtividade,
  subtotalLinha,
  totaisDoEstado,
  type AtualizarEstado,
  type LinhaForm,
  type ValorCascata,
  type WizardState,
} from './tipos';

interface Props {
  state: WizardState;
  set: AtualizarEstado;
}

const brl = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/**
 * Passo 2 — cobertura.
 *
 * 1. Selecione o que será feito: só Etapa + Sub-serviço.
 * 2. Detalhe da atividade: Verbo/Objeto/Local/Característica + descrição
 *    + adicionar. Para cada combinação etapa+sub-serviço o usuário pode
 *    adicionar várias linhas.
 * 3. Linhas adicionadas (agrupadas por etapa+sub-serviço): cada linha é um
 *    card expansível com Medidas, Mão de obra, Produtos e EPIs.
 * 4. Totais: MO + Produtos + EPIs + medição (m² × valor/m²).
 *
 * Todos os selects são independentes entre si (cada um lista todas as
 * opções ativas, sem filtragem cruzada nem bloqueio).
 */
export function PassoCobertura({ state, set }: Props) {
  const [cascata, setCascata] = useState<ValorCascata>(cascataVazia);
  const [descricao, setDescricao] = useState('');
  const [abertas, setAbertas] = useState<Set<string>>(new Set());

  const temSelecao = cascata.etapaId != null && cascata.subServicoId != null;

  const podeAdicionar =
    cascata.etapaId != null &&
    cascata.subServicoId != null &&
    cascata.verboId != null &&
    cascata.objetoId != null;

  const totais = totaisDoEstado(state);
  const temBase = state.areaM2 != null && state.valorM2 != null;

  const alternar = (chave: string) =>
    setAbertas((prev) => {
      const novo = new Set(prev);
      if (novo.has(chave)) novo.delete(chave);
      else novo.add(chave);
      return novo;
    });

  const editar = (aIdx: number, lIdx: number, patch: Partial<LinhaForm>) =>
    set((s) => atualizarLinha(s, aIdx, lIdx, patch));

  const adicionar = () => {
    if (!podeAdicionar) return;
    // abre o card da linha recém-adicionada
    const idx = state.atividades.findIndex(
      (a) =>
        a.etapaId === cascata.etapaId &&
        a.subServicoId === cascata.subServicoId,
    );
    const chaveNova = `${idx === -1 ? state.atividades.length : idx}:${
      idx === -1 ? 0 : state.atividades[idx].linhas.length
    }`;
    set((s) =>
      adicionarLinha(
        s,
        {
          etapaId: cascata.etapaId as number,
          etapaOrdem: cascata.etapaOrdem ?? 0,
          subServicoId: cascata.subServicoId as number,
          etapaNome: cascata.etapaNome ?? `#${cascata.etapaId}`,
          subServicoNome: cascata.subServicoNome ?? `#${cascata.subServicoId}`,
        },
        linhaDaCascata(cascata, descricao.trim()),
      ),
    );
    setAbertas((prev) => new Set(prev).add(chaveNova));
    // mantém etapa/sub-serviço; limpa seleção de termos e descrição
    setCascata((c) => ({
      ...c,
      verboId: null,
      verboNome: null,
      objetoId: null,
      objetoNome: null,
      localId: null,
      localNome: null,
      caracteristicaId: null,
      caracteristicaNome: null,
    }));
    setDescricao('');
  };

  return (
    <div className="flex flex-col gap-5">
      <div className={cardClasses}>
        <h3 className="mb-3 text-sm font-semibold">
          1. Selecione o que será feito
        </h3>
        <CascataVocabulario
          valor={cascata}
          onChange={setCascata}
          modo="reduzida"
        />
      </div>

      <div className={cardClasses}>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold">2. Detalhe da atividade</h3>
          {temSelecao ? (
            <span className="text-xs text-muted-foreground">
              Detalhando: <span className="font-medium">{cascata.etapaNome}</span>{' '}
              › <span className="font-medium">{cascata.subServicoNome}</span>
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              Os campos abaixo são independentes: escolha verbo e objeto para
              adicionar a linha
            </span>
          )}
        </div>
        <CascataVocabulario
          valor={cascata}
          onChange={setCascata}
          modo="termos"
        />
        <div className="mt-3">
          <label className="flex flex-col gap-1">
            <span className={labelClasses}>
              Descrição da linha (opcional)
            </span>
            <input
              className={inputClasses}
              type="text"
              placeholder="Ex.: aplicar tinta acrílica nas paredes"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  adicionar();
                }
              }}
            />
          </label>
        </div>

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            className={btnPrimarioClasses}
            disabled={!podeAdicionar}
            onClick={adicionar}
          >
            Adicionar linha
          </button>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">
          3. Linhas adicionadas ({state.atividades.length})
        </h3>
        {state.atividades.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma atividade adicionada ainda.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {state.atividades
              .map((a, aIdx) => ({ a, aIdx }))
              // ordena por Etapa.ordem (Início, Em andamento, Acabamento,
              // Finalizado); empates preservam a ordem de inserção
              .sort(
                (x, y) => x.a.etapaOrdem - y.a.etapaOrdem || x.aIdx - y.aIdx,
              )
              .map(({ a, aIdx }) => (
                <div
                  key={`${a.etapaId}:${a.subServicoId}`}
                  className={cardClasses}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="text-sm">
                      <span className="font-medium">{rotuloAtividade(a)}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {brl(
                          a.linhas.reduce(
                            (acc, l) => acc + subtotalLinha(l),
                            0,
                          ),
                        )}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="text-xs text-destructive hover:underline"
                      onClick={() => set((s) => removerAtividade(s, aIdx))}
                    >
                      remover atividade
                    </button>
                  </div>
                  <ul className="flex flex-col gap-2">
                    {a.linhas.map((l, lIdx) => {
                      const chave = `${aIdx}:${lIdx}`;
                      const aberta = abertas.has(chave);
                      return (
                        <li key={lIdx} className="rounded-lg border">
                          <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                            <button
                              type="button"
                              className="flex flex-1 items-center justify-between gap-2 text-left text-sm"
                              onClick={() => alternar(chave)}
                            >
                              <span>
                                {l.verboNome} {l.objetoNome}
                                {l.localNome ? ` ${l.localNome}` : ''}
                                {l.caracteristicaNome
                                  ? ` — ${l.caracteristicaNome}`
                                  : ''}
                                {l.descricao ? (
                                  <span className="text-muted-foreground">
                                    {' '}
                                    · {l.descricao}
                                  </span>
                                ) : null}
                              </span>
                              <span className="flex items-center gap-2 whitespace-nowrap">
                                <span className="text-xs font-medium text-muted-foreground">
                                  {brl(subtotalLinha(l))}
                                </span>
                                <span className="text-muted-foreground">
                                  {aberta ? '▾' : '▸'}
                                </span>
                              </span>
                            </button>
                            <button
                              type="button"
                              className="text-xs text-destructive hover:underline"
                              onClick={() =>
                                set((s) => removerLinha(s, aIdx, lIdx))
                              }
                            >
                              remover
                            </button>
                          </div>

                          {aberta ? (
                            <div className="flex flex-col gap-4 border-t px-2 py-3">
                              <section>
                                <h4 className="mb-2 text-xs font-semibold">
                                  Medidas
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                  <label className="flex flex-col gap-1">
                                    <span className="text-[10px] text-muted-foreground">
                                      Área (m²)
                                    </span>
                                    <input
                                      className={inputClasses}
                                      type="number"
                                      min={0}
                                      step="any"
                                      value={l.areaM2 ?? ''}
                                      onChange={(e) =>
                                        editar(aIdx, lIdx, {
                                          areaM2: numero(e.target.value),
                                        })
                                      }
                                    />
                                  </label>
                                  <label className="flex flex-col gap-1">
                                    <span className="text-[10px] text-muted-foreground">
                                      Quantidade (un.)
                                    </span>
                                    <input
                                      className={inputClasses}
                                      type="number"
                                      min={0}
                                      step="any"
                                      value={l.quantidade ?? ''}
                                      onChange={(e) =>
                                        editar(aIdx, lIdx, {
                                          quantidade: numero(e.target.value),
                                        })
                                      }
                                    />
                                  </label>
                                </div>
                              </section>

                              <section>
                                <h4 className="mb-2 text-xs font-semibold">
                                  Mão de obra
                                </h4>
                                <div className="grid grid-cols-3 gap-3">
                                  <label className="flex flex-col gap-1">
                                    <span className="text-[10px] text-muted-foreground">
                                      Pessoas
                                    </span>
                                    <input
                                      className={inputClasses}
                                      type="number"
                                      min={0}
                                      step="any"
                                      value={l.moPessoas ?? ''}
                                      onChange={(e) =>
                                        editar(aIdx, lIdx, {
                                          moPessoas: numero(e.target.value),
                                        })
                                      }
                                    />
                                  </label>
                                  <label className="flex flex-col gap-1">
                                    <span className="text-[10px] text-muted-foreground">
                                      Horas
                                    </span>
                                    <input
                                      className={inputClasses}
                                      type="number"
                                      min={0}
                                      step="any"
                                      value={l.moHoras ?? ''}
                                      onChange={(e) =>
                                        editar(aIdx, lIdx, {
                                          moHoras: numero(e.target.value),
                                        })
                                      }
                                    />
                                  </label>
                                  <label className="flex flex-col gap-1">
                                    <span className="text-[10px] text-muted-foreground">
                                      Valor/hora (R$)
                                    </span>
                                    <input
                                      className={inputClasses}
                                      type="number"
                                      min={0}
                                      step="any"
                                      value={l.moValorHora ?? ''}
                                      onChange={(e) =>
                                        editar(aIdx, lIdx, {
                                          moValorHora: numero(e.target.value),
                                        })
                                      }
                                    />
                                  </label>
                                </div>
                              </section>

                              <section>
                                <h4 className="mb-2 text-xs font-semibold">
                                  Produtos
                                </h4>
                                <MateriaisLinhaEditor
                                  materiais={l.materiais}
                                  onChange={(materiais) =>
                                    editar(aIdx, lIdx, { materiais })
                                  }
                                />
                              </section>

                              <section>
                                <h4 className="mb-2 text-xs font-semibold">
                                  EPIs
                                </h4>
                                <EpisLinhaEditor
                                  epis={l.epis}
                                  onChange={(epis) =>
                                    editar(aIdx, lIdx, { epis })
                                  }
                                />
                              </section>
                            </div>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
          </div>
        )}
      </div>

      <div className={cardClasses}>
        <h3 className="mb-3 text-sm font-semibold">4. Totais</h3>
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Mão de obra</span>
            <span>{brl(totais.valorMO)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Produtos</span>
            <span>{brl(totais.valorMateriais)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">EPIs</span>
            <span>{brl(totais.valorEpis)}</span>
          </div>
          {temBase ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Medição (m² × valor/m²)
              </span>
              <span>{brl((state.areaM2 as number) * (state.valorM2 as number))}</span>
            </div>
          ) : null}
          <div className="mt-1 flex justify-between border-t pt-1 text-base font-semibold">
            <span>Total</span>
            <span>{brl(totais.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
