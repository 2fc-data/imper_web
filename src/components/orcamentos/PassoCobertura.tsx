import { useEffect, useState } from 'react';
import {
  listarCatalogoAtividades,
  type CatalogoAtividadeItem,
} from '../../lib/api';
import { CascataVocabulario } from './CascataVocabulario';
import {
  adicionarLinha,
  btnPrimarioClasses,
  btnSecundarioClasses,
  cascataVazia,
  cardClasses,
  catalogoPlaceholder,
  inputClasses,
  labelClasses,
  linhaDaCascata,
  removerAtividade,
  removerLinha,
  selectClasses,
  type AtualizarEstado,
  type ValorCascata,
  type WizardState,
} from './tipos';

interface Props {
  state: WizardState;
  set: AtualizarEstado;
}

/** Passo 2: cascata de vocabulário + catálogo + atividades/linhas adicionadas. */
export function PassoCobertura({ state, set }: Props) {
  const [cascata, setCascata] = useState<ValorCascata>(cascataVazia);
  const [opcoes, setOpcoes] = useState<CatalogoAtividadeItem[]>([]);
  const [catalogoAtividadeId, setCatalogoAtividadeId] = useState('');
  const [descricao, setDescricao] = useState('');

  const temSelecao = cascata.etapaId != null && cascata.subServicoId != null;

  useEffect(() => {
    if (!temSelecao) {
      setOpcoes([]);
      return;
    }
    let vivo = true;
    listarCatalogoAtividades({
      etapaId: cascata.etapaId as number,
      subServicoId: cascata.subServicoId as number,
    })
      .then((r) => {
        if (vivo) setOpcoes(r.filter((o) => o.ativo));
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [temSelecao, cascata.etapaId, cascata.subServicoId]);

  const podeAdicionar =
    cascata.etapaId != null &&
    cascata.subServicoId != null &&
    cascata.verboId != null &&
    cascata.objetoId != null &&
    catalogoAtividadeId !== '' &&
    descricao.trim() !== '';

  const adicionar = () => {
    if (!podeAdicionar) return;
    const catalogo =
      opcoes.find((o) => o.id === catalogoAtividadeId) ??
      catalogoPlaceholder(catalogoAtividadeId);
    set((s) =>
      adicionarLinha(
        s,
        {
          etapaId: cascata.etapaId as number,
          subServicoId: cascata.subServicoId as number,
          catalogoAtividadeId,
          etapaNome: cascata.etapaNome ?? `#${cascata.etapaId}`,
          subServicoNome: cascata.subServicoNome ?? `#${cascata.subServicoId}`,
          catalogo,
        },
        linhaDaCascata(cascata, descricao.trim()),
      ),
    );
    // mantém etapa/sub-serviço; limpa seleção de termos, catálogo e descrição
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
    setCatalogoAtividadeId('');
    setDescricao('');
  };

  return (
    <div className="flex flex-col gap-5">
      <div className={cardClasses}>
        <h3 className="mb-3 text-sm font-semibold">
          1. Selecione o que será feito
        </h3>
        <CascataVocabulario valor={cascata} onChange={setCascata} />
      </div>

      <div className={cardClasses}>
        <h3 className="mb-3 text-sm font-semibold">
          2. Atividade do catálogo
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className={labelClasses}>Atividade</span>
            <select
              className={selectClasses}
              value={catalogoAtividadeId}
              onChange={(e) => setCatalogoAtividadeId(e.target.value)}
              disabled={!temSelecao}
            >
              <option value="">
                {temSelecao
                  ? 'Selecione a atividade…'
                  : 'Selecione etapa e sub-serviço primeiro'}
              </option>
              {opcoes.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className={labelClasses}>Descrição da linha</span>
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
            {state.atividades.map((a, aIdx) => (
              <div key={`${a.etapaId}:${a.subServicoId}:${a.catalogoAtividadeId}`} className={cardClasses}>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="text-sm">
                    <span className="font-medium">{a.etapaNome}</span>
                    <span className="text-muted-foreground"> › </span>
                    <span className="font-medium">{a.subServicoNome}</span>
                    <span className="text-muted-foreground"> › </span>
                    <span>{a.catalogo.nome}</span>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-destructive hover:underline"
                    onClick={() => set((s) => removerAtividade(s, aIdx))}
                  >
                    remover atividade
                  </button>
                </div>
                <ul className="flex flex-col gap-1">
                  {a.linhas.map((l, lIdx) => (
                    <li
                      key={lIdx}
                      className="flex items-center justify-between gap-2 rounded-lg border px-2 py-1.5 text-sm"
                    >
                      <span>
                        {l.verboNome} {l.objetoNome}
                        {l.localNome ? ` ${l.localNome}` : ''}
                        {l.caracteristicaNome
                          ? ` — ${l.caracteristicaNome}`
                          : ''}{' '}
                        <span className="text-muted-foreground">
                          · {l.descricao}
                        </span>
                      </span>
                      <button
                        type="button"
                        className="text-xs text-destructive hover:underline"
                        onClick={() => set((s) => removerLinha(s, aIdx, lIdx))}
                      >
                        remover
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    className={`${btnSecundarioClasses} text-xs`}
                    onClick={() => {
                      setCascata({
                        ...cascataVazia(),
                        etapaId: a.etapaId,
                        etapaNome: a.etapaNome,
                        subServicoId: a.subServicoId,
                        subServicoNome: a.subServicoNome,
                      });
                      setCatalogoAtividadeId(a.catalogoAtividadeId);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    Adicionar outra linha aqui
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
