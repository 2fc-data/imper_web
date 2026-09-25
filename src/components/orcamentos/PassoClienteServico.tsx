import { useEffect, useState } from 'react';
import {
  listarAtendimentos,
  listarServicos,
  type AtendimentoItem,
  type ServicoMarketing,
} from '../../lib/api';
import type { Urgencia } from '../../schemas';
import {
  labelClasses,
  selectClasses,
  textareaClasses,
  type AtualizarEstado,
  type WizardState,
} from './tipos';

interface Props {
  state: WizardState;
  set: AtualizarEstado;
}

const URGENCIAS: { valor: Urgencia; rotulo: string }[] = [
  { valor: 'NORMAL', rotulo: 'Normal' },
  { valor: 'URGENTE', rotulo: 'Urgente' },
  { valor: 'URGENTISSIMO', rotulo: 'Urgentíssimo' },
];

/** Passo 1: atendimento, serviço de marketing, urgência e observações. */
export function PassoClienteServico({ state, set }: Props) {
  const [atendimentos, setAtendimentos] = useState<AtendimentoItem[]>([]);
  const [servicos, setServicos] = useState<ServicoMarketing[]>([]);

  useEffect(() => {
    let vivo = true;
    listarAtendimentos()
      .then((r) => {
        if (vivo) setAtendimentos(r);
      })
      .catch(() => {});
    listarServicos()
      .then((r) => {
        if (vivo) setServicos(r);
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className={labelClasses}>Atendimento *</span>
        <select
          className={selectClasses}
          value={state.atendimentoId ?? ''}
          onChange={(e) =>
            set((s) => ({
              ...s,
              atendimentoId: e.target.value ? Number(e.target.value) : null,
            }))
          }
        >
          <option value="">Selecione o atendimento…</option>
          {atendimentos.map((a) => (
            <option key={a.id} value={a.id}>
              #{a.id} — {a.user?.nome ?? '—'} ·{' '}
              {a.descricao ?? a.canal}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className={labelClasses}>Serviço de marketing (opcional)</span>
        <select
          className={selectClasses}
          value={state.servicoMarketingId ?? ''}
          onChange={(e) =>
            set((s) => ({
              ...s,
              servicoMarketingId: e.target.value
                ? Number(e.target.value)
                : null,
            }))
          }
        >
          <option value="">Nenhum</option>
          {servicos
            .filter((s) => s.ativo)
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.titulo}
              </option>
            ))}
        </select>
      </label>

      <fieldset className="flex flex-col gap-1">
        <legend className={labelClasses}>Urgência</legend>
        <div className="flex gap-4">
          {URGENCIAS.map((u) => (
            <label
              key={u.valor}
              className="flex cursor-pointer items-center gap-1.5 text-sm"
            >
              <input
                type="radio"
                name="urgencia"
                value={u.valor}
                checked={state.urgencia === u.valor}
                onChange={() =>
                  set((s) => ({ ...s, urgencia: u.valor }))
                }
              />
              {u.rotulo}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1">
        <span className={labelClasses}>Observações</span>
        <textarea
          className={`${textareaClasses} min-h-24`}
          maxLength={2000}
          placeholder="Observações do orçamento…"
          value={state.observacoes}
          onChange={(e) =>
            set((s) => ({ ...s, observacoes: e.target.value }))
          }
        />
        <span className="text-right text-[10px] text-muted-foreground">
          {state.observacoes.length}/2000
        </span>
      </label>
    </div>
  );
}
