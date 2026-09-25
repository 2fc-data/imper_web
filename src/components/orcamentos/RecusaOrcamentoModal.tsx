import { useEffect, useState } from 'react';
import {
  btnPerigoClasses,
  btnSecundarioClasses,
  cardClasses,
  labelClasses,
  textareaClasses,
} from './tipos';

interface Props {
  aberto: boolean;
  onConfirmar: (motivo: string) => void;
  onFechar: () => void;
}

/** Modal de recusa de orçamento (motivo 1–500 caracteres, obrigatório). */
export function RecusaOrcamentoModal({ aberto, onConfirmar, onFechar }: Props) {
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (aberto) {
      setMotivo('');
      setEnviando(false);
    }
  }, [aberto]);

  if (!aberto) return null;

  const valido = motivo.trim().length >= 1 && motivo.trim().length <= 500;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50 p-4">
      <div className={`${cardClasses} w-full max-w-md`}>
        <h2 className="text-base font-semibold">Recusar orçamento</h2>
        <label className="mt-3 flex flex-col gap-1">
          <span className={labelClasses}>Motivo da recusa *</span>
          <textarea
            className={`${textareaClasses} min-h-24`}
            maxLength={500}
            placeholder="Explique o motivo da recusa…"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            disabled={enviando}
          />
          <span className="text-right text-[10px] text-muted-foreground">
            {motivo.length}/500
          </span>
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className={btnSecundarioClasses}
            onClick={onFechar}
            disabled={enviando}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={btnPerigoClasses}
            disabled={!valido || enviando}
            onClick={() => {
              setEnviando(true);
              onConfirmar(motivo.trim());
            }}
          >
            Recusar
          </button>
        </div>
      </div>
    </div>
  );
}
