import { useEffect, useState } from 'react';
import type { AtendimentoItem, FichaInput } from '../../lib/api';
import { obterAtendimento } from '../../lib/api';
import logoImper from '../../assets/logo_imper.webp';
import { brl, formatarEnderecoCompleto, telefoneWhatsApp } from '../../lib/format';
import {
  atualizarFicha,
  btnPrimarioClasses,
  btnSecundarioClasses,
  cardClasses,
  dataBr,
  diasDeValidade,
  inputClasses,
  labelClasses,
  OPCOES_VALIDADE,
  selectClasses,
  subtotalLinha,
  textareaClasses,
  totaisDoEstado,
  validadeDiasParaData,
  type AtualizarEstado,
  type WizardState,
} from './tipos';

interface Props {
  state: WizardState;
  set: AtualizarEstado;
  /** Nº do orçamento (código); vazio em orçamento novo. */
  codigo?: string | null;
}

/** Passo 3: validade + análise crítica de riscos + relatório somente-leitura. */
export function PassoFichaResumo({ state, set, codigo }: Props) {
  const [atendimento, setAtendimento] = useState<AtendimentoItem | null>(null);
  const totais = totaisDoEstado(state);
  const ficha = state.ficha;
  const f = (patch: Partial<FichaInput>) =>
    set((s) => atualizarFicha(s, patch));

  useEffect(() => {
    if (state.atendimentoId == null) {
      setAtendimento(null);
      return;
    }
    let cancelado = false;
    obterAtendimento(state.atendimentoId)
      .then((a) => {
        if (!cancelado) setAtendimento(a);
      })
      .catch(() => {
        if (!cancelado) setAtendimento(null);
      });
    return () => {
      cancelado = true;
    };
  }, [state.atendimentoId]);

  const diasSelecionados = diasDeValidade(state.validade);
  const agendamento =
    atendimento?.agendamentos?.find((ag) => ag.id === state.agendamentoId) ??
    atendimento?.agendamentos?.find((ag) => ag.endereco) ??
    null;
  const enderecoTexto = formatarEnderecoCompleto(agendamento?.endereco ?? null);
  const clienteNome = atendimento?.user?.nome ?? '—';
  const clienteTel = atendimento?.user?.telefone ?? null;
  const clienteEmail = atendimento?.user?.email ?? null;

  const linhas = ([1, 2, 3] as const).map((n) => {
    const risco = ((ficha[`risco${n}`] as string | null) ?? '').trim();
    const acao = ((ficha[`acao${n}`] as string | null) ?? '').trim();
    return { n, risco, acao, preenchido: Boolean(risco || acao), completo: Boolean(risco && acao) };
  });
  const totalPares = linhas.filter((l) => l.completo).length;
  const algumPreenchido = linhas.some((l) => l.preenchido);
  const algumVazio = linhas.some((l) => !l.preenchido);
  // slots editáveis: todos até 3 pares; esconde vazios após o último preenchido
  const slotsVisiveis = linhas.filter((l, i) => {
    if (l.preenchido) return true;
    return linhas.slice(0, i).some((p) => p.preenchido) || !algumPreenchido;
  });

  const textoResumo = [
    `Olá! Segue o orçamento${codigo ? ` nº ${codigo}` : ''} da Imper.`,
    clienteNome !== '—' ? `Cliente: ${clienteNome}` : null,
    enderecoTexto ? `Endereço: ${enderecoTexto}` : null,
    `Validade: ${dataBr(state.validade)}`,
    `Mão de obra: ${brl(totais.valorMO)}`,
    `Materiais: ${brl(totais.valorMateriais)}`,
    `EPIs: ${brl(totais.valorEpis)}`,
    `Total: ${brl(totais.total)}`,
  ]
    .filter(Boolean)
    .join('\n');

  const wa = telefoneWhatsApp(clienteTel);
  const mailtoHref =
    clienteEmail != null && clienteEmail !== ''
      ? `mailto:${encodeURIComponent(clienteEmail)}?subject=${encodeURIComponent(
          `Orçamento ${codigo ?? ''} — Imper`.trim(),
        )}&body=${encodeURIComponent(textoResumo)}`
      : null;

  const baixarPdf = async () => {
    const { gerarPdfOrcamento } = await import('../../lib/export/orcamento-pdf');
    const { materiaisValor, episValor, moValorTotal } = await import(
      '../../lib/orcamento-calculo'
    );
    const linhasPdf = state.atividades.flatMap((a) =>
      a.linhas.map((l, li) => {
        return {
          etapa: li === 0 ? a.etapaNome : '',
          subServico: li === 0 ? a.subServicoNome : '',
          descricao: l.descricao || l.objetoNome,
          quantidade: l.quantidade != null ? String(l.quantidade) : '—',
          mo: moValorTotal(l),
          materiais: materiaisValor(
            l.materiais.map((m) => ({
              quantidade: m.quantidade,
              custoUnitario: m.custoUnitario ?? 0,
            })),
          ),
          epis: episValor(
            (l.epis ?? []).map((e) => ({
              quantidade: e.quantidade,
              custoUnitario: e.custoUnitario ?? 0,
            })),
          ),
          subtotal: subtotalLinha(l),
        };
      }),
    );
    await gerarPdfOrcamento({
      codigo,
      clienteNome,
      clienteTelefone: clienteTel,
      clienteEmail,
      endereco: enderecoTexto,
      urgencia: state.urgencia,
      validade: state.validade,
      observacoes: state.observacoes,
      linhas: linhasPdf,
      totais,
      riscos: linhas.filter((l) => l.completo).map((l) => ({
        risco: String(ficha[`risco${l.n}`] ?? ''),
        acao: String(ficha[`acao${l.n}`] ?? ''),
      })),
      cuidados: (ficha.cuidados ?? []).filter(Boolean),
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Validade */}
      <section className={cardClasses}>
        <h3 className="mb-3 text-sm font-semibold">Validade da proposta</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className={labelClasses}>Validade *</span>
            <select
              className={selectClasses}
              value={diasSelecionados ?? ''}
              onChange={(e) => {
                const dias = e.target.value ? Number(e.target.value) : null;
                set((s) => ({
                  ...s,
                  validade: dias != null ? validadeDiasParaData(dias) : '',
                }));
              }}
            >
              <option value="">—</option>
              {OPCOES_VALIDADE.map((d) => (
                <option key={d} value={d}>
                  {d} dias
                </option>
              ))}
              {diasSelecionados == null && state.validade ? (
                <option value={state.validade} hidden>
                  {dataBr(state.validade)} (custom)
                </option>
              ) : null}
            </select>
          </label>
          <div className="flex flex-col justify-end pb-1 text-sm text-muted-foreground">
            Válida até <strong className="text-foreground">{dataBr(state.validade)}</strong>
          </div>
        </div>
      </section>

      {/* Análise crítica de riscos (editável) */}
      <section className={cardClasses}>
        <h3 className="mb-1 text-sm font-semibold">Análise crítica de riscos</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Cada risco deve ter a ação correspondente (pareados). Máximo de 3.
        </p>
        <div className="flex flex-col gap-3">
          {slotsVisiveis.map(({ n, risco, acao }) => (
            <div key={n} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <label className="flex flex-col gap-1">
                <span className={labelClasses}>Risco {n}</span>
                <input
                  className={inputClasses}
                  type="text"
                  value={risco}
                  onChange={(e) =>
                    f({ [`risco${n}`]: e.target.value || null } as Partial<FichaInput>)
                  }
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className={labelClasses}>Ação {n}</span>
                <input
                  className={inputClasses}
                  type="text"
                  value={acao}
                  onChange={(e) =>
                    f({ [`acao${n}`]: e.target.value || null } as Partial<FichaInput>)
                  }
                />
              </label>
              <button
                type="button"
                className="self-end pb-2 text-xs text-destructive hover:underline"
                onClick={() =>
                  f({
                    [`risco${n}`]: null,
                    [`acao${n}`]: null,
                  } as Partial<FichaInput>)
                }
                aria-label={`Remover risco ${n}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        {totalPares < 3 && algumPreenchido && algumVazio ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Preencha o próximo par risco/ação abaixo (máx. 3).
          </p>
        ) : null}
        <label className="mt-4 flex flex-col gap-1">
          <span className={labelClasses}>Cuidados (um por linha)</span>
          <textarea
            className={`${textareaClasses} min-h-20`}
            placeholder={'Ex.:\nProteger o piso antes de iniciar\nVentilar o ambiente'}
            value={(ficha.cuidados ?? []).join('\n')}
            onChange={(e) =>
              f({
                cuidados: e.target.value === '' ? undefined : e.target.value.split('\n'),
              })
            }
          />
        </label>
      </section>

      {/* Botões de envio */}
      <section className={`${cardClasses} print:hidden`}>
        <h3 className="mb-3 text-sm font-semibold">Enviar</h3>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={btnPrimarioClasses}
            onClick={() => window.print()}
          >
            Imprimir / PDF
          </button>
          <button
            type="button"
            className={btnSecundarioClasses}
            onClick={() => void baixarPdf()}
          >
            Baixar PDF
          </button>
          {wa ? (
            <a
              className={`${btnSecundarioClasses} inline-flex items-center`}
              href={`https://wa.me/${wa}?text=${encodeURIComponent(textoResumo)}`}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
          ) : null}
          {mailtoHref ? (
            <a
              className={`${btnSecundarioClasses} inline-flex items-center`}
              href={mailtoHref}
            >
              E-mail
            </a>
          ) : null}
        </div>
      </section>

      {/* Relatório somente-leitura */}
      <section
        className={`${cardClasses} relatorio-print text-sm`}
        aria-label="Relatório do orçamento"
      >
        <header className="mb-4 flex items-start justify-between gap-4 border-b pb-3">
          <div className="flex items-center gap-3">
            <img
              src={logoImper}
              alt="Imper"
              className="h-10 w-auto no-print-hide"
            />
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Proposta de orçamento
              </p>
              <p className="text-lg font-semibold">
                {codigo ? `Nº ${codigo}` : 'Nº — (novo)'}
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>Emitido em {dataBr(new Date().toISOString().slice(0, 10))}</p>
            <p>
              Válida até <strong className="text-foreground">{dataBr(state.validade)}</strong>
            </p>
          </div>
        </header>

        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Cliente</p>
            <p>{clienteNome}</p>
            {clienteTel ? <p className="text-muted-foreground">{clienteTel}</p> : null}
            {clienteEmail ? (
              <p className="text-muted-foreground">{clienteEmail}</p>
            ) : null}
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Endereço</p>
            <p>{enderecoTexto || '—'}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Urgência: <strong className="text-foreground">{state.urgencia}</strong>
            </p>
          </div>
        </div>

        {state.observacoes.trim() ? (
          <div className="mb-4">
            <p className="text-xs font-semibold text-muted-foreground">Observações</p>
            <p className="whitespace-pre-wrap">{state.observacoes}</p>
          </div>
        ) : null}

        <h4 className="mb-2 text-sm font-semibold">Atividades</h4>
        <div className="mb-4 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-1 pr-2 font-semibold">Etapa › Sub-serviço</th>
                <th className="py-1 pr-2 font-semibold">Descrição</th>
                <th className="py-1 pr-2 text-right font-semibold">Qtd.</th>
                <th className="py-1 pr-2 text-right font-semibold">MO</th>
                <th className="py-1 pr-2 text-right font-semibold">Materiais</th>
                <th className="py-1 pr-2 text-right font-semibold">EPIs</th>
                <th className="py-1 text-right font-semibold">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {state.atividades.flatMap((a, ai) =>
                a.linhas.map((l, li) => {
                  const mats = l.materiais.reduce(
                    (acc, m) => acc + m.quantidade * (m.custoUnitario ?? 0),
                    0,
                  );
                  const epis = (l.epis ?? []).reduce(
                    (acc, e) => acc + e.quantidade * (e.custoUnitario ?? 0),
                    0,
                  );
                  const mo =
                    l.moPessoas != null && l.moHoras != null && l.moValorHora != null
                      ? l.moPessoas * l.moHoras * l.moValorHora
                      : 0;
                  return (
                    <tr key={`${ai}-${li}`} className="border-b align-top">
                      <td className="py-1.5 pr-2">
                        {li === 0 ? (
                          <span className="font-medium">
                            {a.etapaNome} › {a.subServicoNome}
                          </span>
                        ) : null}
                      </td>
                      <td className="py-1.5 pr-2">{l.descricao || l.objetoNome}</td>
                      <td className="py-1.5 pr-2 text-right">
                        {l.quantidade ?? '—'}
                      </td>
                      <td className="py-1.5 pr-2 text-right">{brl(mo)}</td>
                      <td className="py-1.5 pr-2 text-right">{brl(mats)}</td>
                      <td className="py-1.5 pr-2 text-right">{brl(epis)}</td>
                      <td className="py-1.5 text-right font-medium">
                        {brl(subtotalLinha(l))}
                      </td>
                    </tr>
                  );
                }),
              )}
              {state.atividades.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-3 text-center text-muted-foreground">
                    Nenhuma atividade.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mb-4 ml-auto max-w-xs text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Mão de obra</span>
            <span>{brl(totais.valorMO)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Materiais</span>
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

        {totalPares > 0 ? (
          <div className="border-t pt-3">
            <h4 className="mb-1 text-sm font-semibold">Análise crítica de riscos</h4>
            <ul className="flex list-disc flex-col gap-1 pl-4 text-xs">
              {linhas
                .filter((l) => l.completo)
                .map((l) => (
                  <li key={l.n}>
                    <strong>{ficha[`risco${l.n}`]}</strong> → {ficha[`acao${l.n}`]}
                  </li>
                ))}
            </ul>
          </div>
        ) : null}

        {(ficha.cuidados ?? []).filter(Boolean).length > 0 ? (
          <div className="mt-3 border-t pt-3">
            <h4 className="mb-1 text-sm font-semibold">Cuidados</h4>
            <ul className="flex list-disc flex-col gap-1 pl-4 text-xs">
              {(ficha.cuidados ?? []).filter(Boolean).map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </div>
  );
}
