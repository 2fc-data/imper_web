import { useCallback, useEffect, useState } from 'react';
import {
  aprovarOrcamentoAdmin,
  criarOrcamentoAdmin,
  editarOrcamentoAdmin,
  enviarOrcamentoAdmin,
  listarCatalogoAtividades,
  listarEtapas,
  listarSubServicos,
  listarTermos,
  obterOrcamentoAdminDetalhe,
  recusarOrcamentoAdmin,
  type CatalogoAtividadeItem,
  type OrcamentoAdminItem,
} from '../../lib/api';
import { PassoClienteServico } from './PassoClienteServico';
import { PassoCobertura } from './PassoCobertura';
import { PassoFichaResumo } from './PassoFichaResumo';
import { PassoPrecificacao } from './PassoPrecificacao';
import { PendenciasAprovacaoModal } from './PendenciasAprovacaoModal';
import { RecusaOrcamentoModal } from './RecusaOrcamentoModal';
import {
  PASSOS,
  btnPrimarioClasses,
  btnSecundarioClasses,
  cardClasses,
  estadoDeEdicao,
  estadoInicialWizard,
  montarInput,
  validarAte,
  validarPasso,
  type AtualizarEstado,
  type PassoWizard,
  type ResolverEdicao,
  type WizardState,
} from './tipos';

interface Props {
  onSalvo: () => void;
  onCancel: () => void;
  orcamentoEdicao?: OrcamentoAdminItem;
  /** Atendimento fixado quando o wizard abre via agendamento ("Planejar orçamento"). */
  atendimentoTravado?: number | null;
}

type ErroApi = Error & {
  status?: number;
  details?: unknown;
};

interface Detalhe409 {
  codigo?: string;
  pendencias?: string[];
  details?: { codigo?: string; pendencias?: string[] };
}

export function pendenciasDe409(err: unknown): string[] | null {
  const e = err as ErroApi | null;
  if (!e || typeof e !== 'object' || e.status !== 409) return null;
  const raw = e.details as Detalhe409 | null | undefined;
  if (!raw || typeof raw !== 'object') return null;
  const d =
    typeof raw.codigo === 'string'
      ? raw
      : raw.details && typeof raw.details === 'object'
        ? raw.details
        : null;
  if (d?.codigo === 'ANALISE_CRITICA' && Array.isArray(d.pendencias)) {
    return d.pendencias;
  }
  return null;
}

export function mensagemDeErro(err: unknown): string {
  const e = err as ErroApi | null;
  return e && typeof e === 'object' && e.message
    ? e.message
    : 'Erro inesperado. Tente novamente.';
}

/** Wizard de 4 passos para criar/editar orçamentos (T14/T15). */
export function NovoOrcamentoWizard({ onSalvo, onCancel, orcamentoEdicao }: Props) {
  const [state, setState] = useState<WizardState>(() => estadoInicialWizard());
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvoId, setSalvoId] = useState<number | null>(
    orcamentoEdicao?.id ?? null,
  );
  const [pendencias, setPendencias] = useState<string[] | null>(null);
  const [recusaAberta, setRecusaAberta] = useState(false);

  const set: AtualizarEstado = useCallback(
    (fn) => setState((s) => fn(s)),
    [],
  );

  const status = orcamentoEdicao?.status ?? null;
  const podeEditar = status === null || status === 'RASCUNHO' || status === 'ENVIADO';
  const podeEnviar = status === null || status === 'RASCUNHO';
  const podeAprovar =
    status === null || status === 'RASCUNHO' || status === 'ENVIADO';
  const podeRecusar = status === 'RASCUNHO' || status === 'ENVIADO';

  // ---- hidratação em modo edição ------------------------------------------
  useEffect(() => {
    if (!orcamentoEdicao) return;
    let vivo = true;
    setCarregando(true);
    (async () => {
      try {
        const [
          det,
          etapas,
          catalogo,
          verbos,
          objetos,
          locais,
          caracteristicas,
        ] = await Promise.all([
          obterOrcamentoAdminDetalhe(orcamentoEdicao.id),
          listarEtapas(),
          listarCatalogoAtividades({}),
          listarTermos('verbos'),
          listarTermos('objetos'),
          listarTermos('locais'),
          listarTermos('caracteristicas'),
        ]);

        const eids = [...new Set(det.atividades.map((a) => a.etapaId))];
        const subsPorEtapas = await Promise.all(
          eids.map((eid) =>
            listarSubServicos(eid, true).catch(() => []),
          ),
        );

        if (!vivo) return;

        const etapaNome = new Map(etapas.map((e) => [e.id, e.nome]));
        const subNome = new Map<number, string>();
        subsPorEtapas.flat().forEach((s) => subNome.set(s.id, s.nome));
        const catPorId = new Map(catalogo.map((c) => [c.id, c]));
        const termoNome = (
          dim: 'verbos' | 'objetos' | 'locais' | 'caracteristicas',
          id: number,
        ) => {
          const lista =
            dim === 'verbos'
              ? verbos
              : dim === 'objetos'
                ? objetos
                : dim === 'locais'
                  ? locais
                  : caracteristicas;
          return lista.find((t) => t.id === id)?.nome;
        };

        const resolver: ResolverEdicao = {
          etapaNome: (id) => etapaNome.get(id),
          subServicoNome: (id) => subNome.get(id),
          catalogo: (id) => catPorId.get(id) as CatalogoAtividadeItem | undefined,
          termoNome: (dim, id) => termoNome(dim, id),
        };

        setState(estadoDeEdicao(det, resolver));
        setSalvoId(det.id);
      } catch (err) {
        if (vivo) setErro(mensagemDeErro(err));
      } finally {
        if (vivo) setCarregando(false);
      }
    })();
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orcamentoEdicao?.id]);

  // ---- navegação ----------------------------------------------------------
  const irPara = (destino: PassoWizard) => {
    if (destino <= state.passo) {
      setState((s) => ({ ...s, passo: destino }));
      return;
    }
    const erroAte = validarAte(state, destino);
    if (erroAte) {
      setErro(erroAte);
      return;
    }
    setErro(null);
    setState((s) => ({ ...s, passo: destino }));
  };

  const proximo = () => {
    const erroAte = validarAte(state, (state.passo + 1) as PassoWizard);
    if (erroAte) {
      setErro(erroAte);
      return;
    }
    setErro(null);
    setState((s) => ({ ...s, passo: (s.passo + 1) as PassoWizard }));
  };

  // ---- ações --------------------------------------------------------------
  const salvar = async (): Promise<number> => {
    const erroValidacao = validarAte(state, 4) ?? validarPasso(state, 4);
    if (erroValidacao) {
      setErro(erroValidacao);
      throw new Error(erroValidacao);
    }
    setSalvando(true);
    setErro(null);
    try {
      const input = montarInput(state);
      const salvo = orcamentoEdicao
        ? await editarOrcamentoAdmin(orcamentoEdicao.id, input)
        : await criarOrcamentoAdmin(input);
      setSalvoId(salvo.id);
      return salvo.id;
    } catch (err) {
      const msg = mensagemDeErro(err);
      setErro(msg);
      throw err;
    } finally {
      setSalvando(false);
    }
  };

  const comSalvo = async (fn: (id: number) => Promise<unknown>) => {
    try {
      const id = salvoId ?? (await salvar());
      await fn(id);
      onSalvo();
    } catch {
      // erro já tratado em salvar()/abaixo
    }
  };

  const acaoSalvar = async () => {
    try {
      await salvar();
    } catch {
      /* tratado em salvar */
    }
  };

  const acaoEnviar = () => comSalvo((id) => enviarOrcamentoAdmin(id));

  const acaoAprovar = () =>
    comSalvo(async (id) => {
      try {
        await aprovarOrcamentoAdmin(id);
      } catch (err) {
        const p = pendenciasDe409(err);
        if (p) {
          setPendencias(p);
          return;
        }
        throw err;
      }
    });

  const confirmarRecusa = (motivo: string) => {
    setRecusaAberta(false);
    void comSalvo((id) => recusarOrcamentoAdmin(id, motivo));
  };

  // ---- render -------------------------------------------------------------
  if (carregando) {
    return (
      <div className={cardClasses}>
        <p className="text-sm text-muted-foreground">Carregando orçamento…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* stepper */}
      <ol className="flex flex-wrap gap-2">
        {PASSOS.map((p) => {
          const ativo = p.passo === state.passo;
          const feito = p.passo < state.passo;
          return (
            <li key={p.passo}>
              <button
                type="button"
                onClick={() => irPara(p.passo)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  ativo
                    ? 'border-primary bg-primary text-primary-foreground'
                    : feito
                      ? 'border-input bg-muted text-foreground hover:bg-muted/70'
                      : 'border-input bg-background text-muted-foreground hover:bg-muted'
                }`}
              >
                {p.passo}. {p.titulo}
              </button>
            </li>
          );
        })}
      </ol>

      {/* passo ativo */}
      <div>
        {state.passo === 1 ? (
          <PassoClienteServico state={state} set={set} />
        ) : null}
        {state.passo === 2 ? <PassoCobertura state={state} set={set} /> : null}
        {state.passo === 3 ? (
          <PassoPrecificacao state={state} set={set} />
        ) : null}
        {state.passo === 4 ? (
          <PassoFichaResumo state={state} set={set} />
        ) : null}
      </div>

      {erro ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {erro}
        </p>
      ) : null}

      {/* navegação */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            className={btnSecundarioClasses}
            onClick={onCancel}
            disabled={salvando}
          >
            Cancelar
          </button>
          {state.passo > 1 ? (
            <button
              type="button"
              className={btnSecundarioClasses}
              onClick={() =>
                setState((s) => ({ ...s, passo: (s.passo - 1) as PassoWizard }))
              }
              disabled={salvando}
            >
              Anterior
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {state.passo < 4 ? (
            <button
              type="button"
              className={btnPrimarioClasses}
              onClick={proximo}
              disabled={salvando}
            >
              Próximo
            </button>
          ) : (
            <>
              {podeEditar ? (
                <button
                  type="button"
                  className={btnSecundarioClasses}
                  onClick={acaoSalvar}
                  disabled={salvando}
                >
                  {salvando ? 'Salvando…' : orcamentoEdicao ? 'Salvar' : 'Salvar rascunho'}
                </button>
              ) : null}
              {podeEnviar ? (
                <button
                  type="button"
                  className={btnPrimarioClasses}
                  onClick={acaoEnviar}
                  disabled={salvando}
                >
                  Enviar
                </button>
              ) : null}
              {podeAprovar ? (
                <button
                  type="button"
                  className={btnPrimarioClasses}
                  onClick={acaoAprovar}
                  disabled={salvando}
                >
                  Aprovar
                </button>
              ) : null}
              {podeRecusar ? (
                <button
                  type="button"
                  className="rounded-lg border border-destructive/50 px-4 py-2 text-sm font-medium text-destructive shadow-sm transition-colors hover:bg-destructive/10 disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => setRecusaAberta(true)}
                  disabled={salvando}
                >
                  Recusar
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>

      <PendenciasAprovacaoModal
        aberto={pendencias !== null}
        pendencias={pendencias ?? undefined}
        onFechar={() => setPendencias(null)}
      />
      <RecusaOrcamentoModal
        aberto={recusaAberta}
        onConfirmar={confirmarRecusa}
        onFechar={() => setRecusaAberta(false)}
      />
    </div>
  );
}
