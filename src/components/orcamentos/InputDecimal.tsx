import { useState } from 'react';
import { inputClasses } from './tipos';

interface Props {
  value: number;
  onChange: (v: number) => void;
}

/** Input decimal para quantidades — aceita vírgula (pt-BR) ou ponto. */
export function InputDecimal({ value, onChange }: Props) {
  const [texto, setTexto] = useState<string | null>(null);
  const mostrar = (v: number) => String(v).replace('.', ',');
  return (
    <input
      className={inputClasses}
      type="text"
      inputMode="decimal"
      value={texto ?? mostrar(value)}
      onFocus={(e) => {
        setTexto(mostrar(value));
        e.currentTarget.select();
      }}
      onChange={(e) => {
        setTexto(e.target.value);
        const bruto = e.target.value.trim();
        if (bruto === '') {
          onChange(0);
          return;
        }
        const n = Number(bruto.replace(',', '.'));
        if (Number.isFinite(n) && n >= 0) onChange(n);
      }}
      onBlur={() => setTexto(null)}
    />
  );
}
