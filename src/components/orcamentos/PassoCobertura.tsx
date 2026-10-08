import { useState } from 'react';
import { CascataVocabulario } from './CascataVocabulario';
import {
  adicionarLinha,
  btnPrimarioClasses,
  cascataVazia,
  cardClasses,
  inputClasses,
  labelClasses,
  linhaDaCascata,
  removerAtividade,
  removerLinha,
  rotuloAtividade,
  type AtualizarEstado,
  type ValorCascata,
  type WizardState,
} from './tipos';

interface Props {
  state: WizardState;
  set: AtualizarEstado;
}

/**
 * Passo 2 — cobertura.
 *
 * 1. Selecione o que será feito: só Etapa + Sub-serviço.
 * 2. Detalhe da atividade: Verbo/Objeto/Local/Característica + descrição
 *    + adicionar. Para cada combinação etapa+sub-serviço o usuário pode
 *    adicionar várias linhas. O backend auto-resolve `catalogoAtividadeId`
 *    a partir do sub-serviço.
 * 3. Linhas adicionadas (agrupadas por etapa+sub-serviço).
 */
export function PassoCobertura({ state, set }: Props) {
  const [cascata, setCascata] = useState<ValorCascata>(cascataVazia);
  const [descricao, setDescricao] = useState('');

  const temSelecao = cascata.etapaId != null && cascata.subServicoId != null;

  const podeAdicionar =
    cascata.etapaId != null &&
    cascata.subServicoId != null &&
    cascata.verboId != null &&
    cascata.objetoId != null;

  const adicionar = () => {
    if (!podeAdicionar) return;
    set((s) =>
      adicionarLinha(
        s,
        {
          etapaId: cascata.etapaId as number,
          etapaOrdem: cascata.etapaOrdem ?? 0,
          subServicoId: cascata.subServicoId as number,
          catalogoAtividadeId: null,
          etapaNome: cascata.etapaNome ?? `#${cascata.etapaId}`,
          subServicoNome: cascata.subServicoNome ?? `#${cascata.subServicoId}`,
          catalogo: null,
        },
        linhaDaCascata(cascata, descricao.trim()),
      ),
    );
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
        <CascataVocabulario valor={cascata} onChange={setCascata} modo="reduzida" />
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
              Selecione etapa e sub-serviço em «1. Selecione o que será feito»
            </span>
          )}
        </div>
        <CascataVocabulario valor={cascata} onChange={setCascata} modo="termos" />
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
                          : ''}
                        {l.descricao ? (
                          <span className="text-muted-foreground">
                            {' '}
                            · {l.descricao}
                          </span>
                        ) : null}
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
