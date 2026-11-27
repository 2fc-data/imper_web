import { useEffect, useState } from 'react';
import { CascataVocabulario } from './CascataVocabulario';
import { EpisLinhaEditor } from './EpisLinhaEditor';
import { MateriaisLinhaEditor } from './MateriaisLinhaEditor';
import { brl } from '../../lib/format';
import { InputMoeda } from '../ui/input-moeda';
import {
  listarTermos,
  type OpcaoCascata,
} from '../../lib/api';
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
  removerLinha,
  rotuloAtividade,
  selectClasses,
  subtotalLinha,
  textareaClasses,
  totaisDoEstado,
  type AtualizarEstado,
  type LinhaForm,
  type ValorCascata,
  type WizardState,
} from './tipos';

interface Props {
  state: WizardState;
  set: AtualizarEstado;
  onSalvar?: () => Promise<void> | void;
  salvando?: boolean;
  erroGlobal?: string | null;
}

/**
 * Passo 2 — cobertura.
 *
 * 1. Selecione o que será feito: só Etapa + Sub-serviço.
 * 2. Detalhe da atividade: Verbo/Objeto/Local/Característica + descrição
 *    + adicionar. Para cada combinação etapa+sub-serviço o usuário pode
 *    adicionar várias linhas.
 * 3. Atividades adicionadas (agrupadas por etapa+sub-serviço): cada atividade
 *    é um card-acordeão; ao expandir, cada linha expõe Medidas, Mão de obra,
 *    Produtos e EPIs.
 * 4. Totais: MO + Produtos + EPIs.
 *
 * Todos os selects são independentes entre si (cada um lista todas as
 * opções ativas, sem filtragem cruzada nem bloqueio).
 */
export function PassoCobertura({ state, set, onSalvar, salvando, erroGlobal }: Props) {
  const [cascata, setCascata] = useState<ValorCascata>(() => ({
    ...cascataVazia(),
    subServicoId: state.servicoMarketingId ?? null,
  }));
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [abertas, setAbertas] = useState<Set<string>>(new Set());
  const [editandoKey, setEditandoKey] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<LinhaForm>>({});
  const [errosEdicao, setErrosEdicao] = useState<{
    verbo?: string;
    objeto?: string;
  }>({});
  const [erroSalvarAtividade, setErroSalvarAtividade] = useState<string | null>(null);
  const [errosValidacao, setErrosValidacao] = useState<{
    etapa?: string;
    subServico?: string;
    verbo?: string;
    objeto?: string;
  }>({});

  // Preenche como padrão o serviço selecionado no Passo 1 caso ainda não tenha atividades adicionadas com outro serviço
  useEffect(() => {
    if (state.servicoMarketingId == null) return;
    setCascata((prev) => {
      if (
        state.atividades.length > 0 &&
        prev.subServicoId != null &&
        prev.subServicoId !== state.servicoMarketingId
      ) {
        return prev;
      }
      if (prev.subServicoId === state.servicoMarketingId) {
        return prev;
      }
      return {
        ...prev,
        subServicoId: state.servicoMarketingId,
        subServicoNome: null,
      };
    });
  }, [state.servicoMarketingId, state.atividades.length]);

  // Listas de termos para os selects de edição inline
  const [verbos, setVerbos] = useState<OpcaoCascata[]>([]);
  const [objetos, setObjetos] = useState<OpcaoCascata[]>([]);
  const [locais, setLocais] = useState<OpcaoCascata[]>([]);
  const [caracteristicas, setCaracteristicas] = useState<OpcaoCascata[]>([]);

  useEffect(() => {
    let vivo = true;
    Promise.all([
      listarTermos('verbos', { ativo: true }),
      listarTermos('objetos', { ativo: true }),
      listarTermos('locais', { ativo: true }),
      listarTermos('caracteristicas', { ativo: true }),
    ])
      .then(([vs, obs, locs, chars]) => {
        if (vivo) {
          setVerbos(vs);
          setObjetos(obs);
          setLocais(locs);
          setCaracteristicas(chars);
        }
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, []);

  const temSelecao = cascata.etapaId != null && cascata.subServicoId != null;

  const totais = totaisDoEstado(state);

  const alternar = (chave: string) =>
    setAbertas((prev) => {
      const novo = new Set(prev);
      if (novo.has(chave)) novo.delete(chave);
      else novo.add(chave);
      return novo;
    });

  const editar = (aIdx: number, lIdx: number, patch: Partial<LinhaForm>) =>
    set((s) => atualizarLinha(s, aIdx, lIdx, patch));

  const iniciarEdicao = (aIdx: number, lIdx: number, l: LinhaForm) => {
    setEditandoKey(`${aIdx}:${lIdx}`);
    setErrosEdicao({});
    setErroSalvarAtividade(null);
    setEditForm({
      titulo: l.titulo ?? '',
      verboId: l.verboId,
      verboNome: l.verboNome,
      objetoId: l.objetoId,
      objetoNome: l.objetoNome,
      localId: l.localId,
      localNome: l.localNome,
      caracteristicaId: l.caracteristicaId,
      caracteristicaNome: l.caracteristicaNome,
      descricao: l.descricao,
    });
  };

  const salvarEdicao = (aIdx: number, lIdx: number) => {
    const novosErros: { verbo?: string; objeto?: string } = {};
    if (!editForm.verboId) {
      novosErros.verbo = 'Selecione a ação';
    }
    if (!editForm.objetoId) {
      novosErros.objeto = 'Selecione o objeto';
    }

    if (Object.keys(novosErros).length > 0) {
      setErrosEdicao(novosErros);
      return;
    }

    setErrosEdicao({});
    set((s) => atualizarLinha(s, aIdx, lIdx, editForm));
    setEditandoKey(null);
    setEditForm({});
    setErroSalvarAtividade(null);
  };

  const cancelarEdicao = () => {
    setEditandoKey(null);
    setEditForm({});
    setErrosEdicao({});
    setErroSalvarAtividade(null);
  };

  const nomeDeOpcao = (lista: OpcaoCascata[], id: number | null) =>
    id == null ? null : (lista.find((o) => o.id === id)?.nome ?? null);

  const adicionar = () => {
    const novosErros: {
      etapa?: string;
      subServico?: string;
      verbo?: string;
      objeto?: string;
    } = {};

    if (cascata.etapaId == null) {
      novosErros.etapa = 'Selecione a etapa';
    }
    if (cascata.subServicoId == null) {
      novosErros.subServico = 'Selecione o serviço';
    }
    if (cascata.verboId == null) {
      novosErros.verbo = 'Selecione a ação';
    }
    if (cascata.objetoId == null) {
      novosErros.objeto = 'Selecione o objeto';
    }

    if (Object.keys(novosErros).length > 0) {
      setErrosValidacao(novosErros);
      return;
    }

    setErrosValidacao({});
    // abre o acordeão da atividade recém-adicionada
    const chaveNova = `${cascata.etapaId}:${cascata.subServicoId}`;
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
        linhaDaCascata(cascata, descricao.trim(), titulo.trim()),
      ),
    );
    setAbertas((prev) => new Set(prev).add(chaveNova));
    // mantém etapa/sub-serviço e título; limpa seleção de termos e descrição
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
          onChange={(novo) => {
            setErrosValidacao((prev) => {
              const next = { ...prev };
              if (novo.etapaId != null) delete next.etapa;
              if (novo.subServicoId != null) delete next.subServico;
              return next;
            });
            if (
              novo.etapaId !== cascata.etapaId ||
              novo.subServicoId !== cascata.subServicoId
            ) {
              setTitulo('');
            }
            setCascata(novo);
          }}
          modo="reduzida"
          erros={errosValidacao}
        />
        <div className="mt-3">
          <label className="flex flex-col gap-1">
            <span className={labelClasses}>Título (opcional)</span>
            <input
              className={`${inputClasses} uppercase`}
              type="text"
              placeholder="Ex.: IMPERMEABILIZAÇÃO DE LAJE"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value.toUpperCase())}
            />
          </label>
        </div>
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
              Os campos abaixo são independentes: escolha ação e objeto para
              adicionar a linha
            </span>
          )}
        </div>
        <CascataVocabulario
          valor={cascata}
          onChange={(novo) => {
            setErrosValidacao((prev) => {
              const next = { ...prev };
              if (novo.verboId != null) delete next.verbo;
              if (novo.objetoId != null) delete next.objeto;
              return next;
            });
            setCascata(novo);
          }}
          modo="termos"
          erros={errosValidacao}
        />
        <div className="mt-3">
          <label className="flex flex-col gap-1">
            <span className={labelClasses}>Descrição</span>
            <textarea
              className={`${textareaClasses} min-h-16 resize-y`}
              rows={2}
              placeholder="Descreva os detalhes da atividade..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-end gap-3">
          {Object.keys(errosValidacao).length > 0 ? (
            <span className="text-xs font-medium text-destructive">
              Preencha os campos obrigatórios destacados em vermelho.
            </span>
          ) : null}
          <button
            type="button"
            className={btnPrimarioClasses}
            onClick={adicionar}
          >
            Adicionar atividade
          </button>
        </div>
      </div>

      <div className={cardClasses}>
        <h3 className="mb-3 text-sm font-semibold">
          3. Atividades adicionadas ({state.atividades.length})
        </h3>
        {state.atividades.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma atividade adicionada ainda.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {state.atividades.map((a, aIdx) => {
              const chaveAtividade = `${a.etapaId}:${a.subServicoId}`;
              const atividadeAberta = abertas.has(chaveAtividade);
              const subtotalAtividade = a.linhas.reduce(
                (acc, l) => acc + subtotalLinha(l),
                0,
              );
              return (
                <div
                  key={chaveAtividade}
                  className={cardClasses}
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      className="flex flex-1 items-center justify-between gap-2 text-left text-sm"
                      onClick={() => alternar(chaveAtividade)}
                    >
                      <span className="font-medium">
                        {rotuloAtividade(a)}
                      </span>
                      <span className="flex items-center gap-2 whitespace-nowrap">
                        <span className="text-xs text-muted-foreground">
                          {a.linhas.length}{' '}
                          {a.linhas.length === 1 ? 'linha' : 'linhas'}
                        </span>
                        <span className="text-4xl leading-none text-muted-foreground">
                          {atividadeAberta ? '▾' : '▸'}
                        </span>
                      </span>
                    </button>
                  </div>

                  {atividadeAberta ? (
                    <>
                    <ul className="mt-3 flex flex-col gap-3">
                      {a.linhas.map((l, lIdx) => {
                        const linhaKey = `${aIdx}:${lIdx}`;
                          const emEdicao = editandoKey === linhaKey;
                          return (
                          <li
                            key={lIdx}
                            className="rounded-lg border border-border/80 bg-muted/40 p-3 shadow-xs"
                          >
                            {emEdicao ? (
                              <div className="mb-2 flex flex-col gap-2">
                                <label className="flex flex-col gap-1">
                                  <span className="text-[10px] text-muted-foreground">Título</span>
                                  <input
                                    className={`${inputClasses} uppercase`}
                                    type="text"
                                    placeholder="Ex.: IMPERMEABILIZAÇÃO DE LAJE"
                                    value={editForm.titulo ?? ''}
                                    onChange={(e) =>
                                      setEditForm((f) => ({ ...f, titulo: e.target.value.toUpperCase() }))
                                    }
                                  />
                                </label>
                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                                  <label className="flex flex-col gap-1">
                                    <span className="text-[10px] text-muted-foreground">Local</span>
                                    <select
                                      className={`${selectClasses} uppercase`}
                                      value={editForm.localId ?? ''}
                                      onChange={(e) => {
                                        const id = e.target.value ? Number(e.target.value) : null;
                                        setEditForm((f) => ({
                                          ...f,
                                          localId: id,
                                          localNome: nomeDeOpcao(locais, id)?.toUpperCase() ?? null,
                                        }));
                                      }}
                                    >
                                      <option value="">SELECIONE...</option>
                                      {locais.map((lc) => (
                                        <option key={lc.id} value={lc.id} className="uppercase">{lc.nome.toUpperCase()}</option>
                                      ))}
                                    </select>
                                  </label>
                                  <label className="flex flex-col gap-1">
                                    <span className="text-[10px] text-muted-foreground">
                                      Ação <span className="text-destructive font-bold">*</span>
                                    </span>
                                    <select
                                      className={`${selectClasses} uppercase ${
                                        errosEdicao.verbo
                                          ? 'border-destructive focus-visible:ring-destructive'
                                          : ''
                                      }`}
                                      value={editForm.verboId ?? ''}
                                      onChange={(e) => {
                                        const id = Number(e.target.value);
                                        setErrosEdicao((prev) => {
                                          const next = { ...prev };
                                          delete next.verbo;
                                          return next;
                                        });
                                        setEditForm((f) => ({
                                          ...f,
                                          verboId: id,
                                          verboNome: nomeDeOpcao(verbos, id)?.toUpperCase() ?? '',
                                        }));
                                      }}
                                    >
                                      <option value="" disabled>Selecione...</option>
                                      {verbos.map((v) => (
                                        <option key={v.id} value={v.id} className="uppercase">{v.nome.toUpperCase()}</option>
                                      ))}
                                    </select>
                                    {errosEdicao.verbo ? (
                                      <span className="text-[10px] text-destructive">
                                        {errosEdicao.verbo}
                                      </span>
                                    ) : null}
                                  </label>
                                  <label className="flex flex-col gap-1">
                                    <span className="text-[10px] text-muted-foreground">
                                      Objeto <span className="text-destructive font-bold">*</span>
                                    </span>
                                    <select
                                      className={`${selectClasses} uppercase ${
                                        errosEdicao.objeto
                                          ? 'border-destructive focus-visible:ring-destructive'
                                          : ''
                                      }`}
                                      value={editForm.objetoId ?? ''}
                                      onChange={(e) => {
                                        const id = Number(e.target.value);
                                        setErrosEdicao((prev) => {
                                          const next = { ...prev };
                                          delete next.objeto;
                                          return next;
                                        });
                                        setEditForm((f) => ({
                                          ...f,
                                          objetoId: id,
                                          objetoNome: nomeDeOpcao(objetos, id)?.toUpperCase() ?? '',
                                        }));
                                      }}
                                    >
                                      <option value="" disabled>Selecione...</option>
                                      {objetos.map((o) => (
                                        <option key={o.id} value={o.id} className="uppercase">{o.nome.toUpperCase()}</option>
                                      ))}
                                    </select>
                                    {errosEdicao.objeto ? (
                                      <span className="text-[10px] text-destructive">
                                        {errosEdicao.objeto}
                                      </span>
                                    ) : null}
                                  </label>
                                  <label className="flex flex-col gap-1">
                                    <span className="text-[10px] text-muted-foreground">Característica</span>
                                    <select
                                      className={`${selectClasses} uppercase`}
                                      value={editForm.caracteristicaId ?? ''}
                                      onChange={(e) => {
                                        const id = e.target.value ? Number(e.target.value) : null;
                                        setEditForm((f) => ({
                                          ...f,
                                          caracteristicaId: id,
                                          caracteristicaNome: nomeDeOpcao(caracteristicas, id)?.toUpperCase() ?? null,
                                        }));
                                      }}
                                    >
                                      <option value="">SELECIONE...</option>
                                      {caracteristicas.map((c) => (
                                        <option key={c.id} value={c.id} className="uppercase">{c.nome.toUpperCase()}</option>
                                      ))}
                                    </select>
                                  </label>
                                </div>
                                <label className="flex flex-col gap-1">
                                  <span className="text-[10px] text-muted-foreground">Descrição</span>
                                  <textarea
                                    className={`${textareaClasses} min-h-14 resize-y text-xs`}
                                    rows={2}
                                    value={editForm.descricao ?? ''}
                                    onChange={(e) =>
                                      setEditForm((f) => ({ ...f, descricao: e.target.value }))
                                    }
                                  />
                                </label>
                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    className="rounded bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                                    onClick={() => salvarEdicao(aIdx, lIdx)}
                                  >
                                    Salvar alterações
                                  </button>
                                  <button
                                    type="button"
                                    className="text-xs text-muted-foreground hover:underline"
                                    onClick={cancelarEdicao}
                                  >
                                    Cancelar
                                  </button>
                                  {Object.keys(errosEdicao).length > 0 ? (
                                    <span className="text-xs font-medium text-destructive">
                                      Preencha os campos obrigatórios (*).
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            ) : (
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <div className="flex flex-col">
                                {l.titulo ? (
                                  <span className="text-xs font-bold tracking-wide text-foreground uppercase">
                                    {l.titulo}
                                  </span>
                                ) : null}
                                <span className="text-sm">
                                  {l.localNome ? `${l.localNome} ` : ''}
                                  {l.verboNome} {l.objetoNome}
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
                              </div>
                              <span className="flex items-center gap-2 whitespace-nowrap">
                                <span className="text-xs font-medium text-muted-foreground">
                                  {brl(subtotalLinha(l))}
                                </span>
                                <button
                                  type="button"
                                  className="text-xs text-primary hover:underline"
                                  onClick={() => iniciarEdicao(aIdx, lIdx, l)}
                                >
                                  editar
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
                              </span>
                            </div>
                            )}

                            <div className="flex flex-col gap-4">
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
                                    <InputMoeda
                                      id={`mo-valor-hora-${aIdx}-${lIdx}`}
                                      value={l.moValorHora ?? undefined}
                                      onChange={(v) =>
                                        editar(aIdx, lIdx, { moValorHora: v !== undefined ? v : null })
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
                          </li>
                          );
                        })}
                      </ul>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t pt-2 text-xs">
                        <span className="text-muted-foreground">
                          Subtotal da atividade:{' '}
                          <span className="font-semibold text-foreground">
                            {brl(subtotalAtividade)}
                          </span>
                        </span>
                        <div className="flex flex-col items-end gap-1.5 sm:flex-row sm:items-center">
                          {erroSalvarAtividade || erroGlobal ? (
                            <span className="text-xs font-semibold text-destructive">
                              {erroSalvarAtividade || erroGlobal}
                            </span>
                          ) : null}
                          {onSalvar ? (
                            <button
                              type="button"
                              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                              onClick={async () => {
                                if (editandoKey) {
                                  // Se houver uma linha em edição nessa atividade ou outra
                                  const [editAIdxStr, editLIdxStr] = editandoKey.split(':');
                                  const editAIdx = Number(editAIdxStr);
                                  const editLIdx = Number(editLIdxStr);
                                  if (editAIdx === aIdx) {
                                    if (!editForm.verboId || !editForm.objetoId) {
                                      setErrosEdicao({
                                        ...(!editForm.verboId ? { verbo: 'Selecione a ação' } : {}),
                                        ...(!editForm.objetoId ? { objeto: 'Selecione o objeto' } : {}),
                                      });
                                      setErroSalvarAtividade('Preencha os campos obrigatórios (*) da linha em edição antes de salvar.');
                                      return;
                                    }
                                    // Salva a edição da linha antes de persistir
                                    salvarEdicao(editAIdx, editLIdx);
                                  } else {
                                    setErroSalvarAtividade('Conclua ou cancele a linha em edição antes de salvar.');
                                    return;
                                  }
                                }
                                setErroSalvarAtividade(null);
                                await onSalvar();
                              }}
                              disabled={salvando}
                            >
                              {salvando ? 'Salvando…' : 'Salvar'}
                            </button>
                          ) : null}
                        </div>
                      </div>
                      </>
                    ) : null}
                  </div>
                );
              })}
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
          <div className="mt-1 flex justify-between border-t pt-1 text-base font-semibold">
            <span>Total</span>
            <span>{brl(totais.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
