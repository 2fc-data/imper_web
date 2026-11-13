import { useRef, useState } from 'react';
import { Input } from './input';
import { formatarMoedaInput, mascararMoeda } from '../../lib/format';

export function InputMoeda({
  id,
  value,
  onChange,
  disabled,
  required,
}: {
  id: string;
  value: number | string | undefined;
  onChange: (v: number | undefined) => void;
  disabled?: boolean;
  required?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [texto, setTexto] = useState<string | null>(null);

  const formatado = formatarMoedaInput(value);
  return (
    <Input
      ref={ref}
      id={id}
      inputMode="decimal"
      disabled={disabled}
      required={required}
      placeholder="R$ 0,00"
      value={texto ?? formatado}
      onFocus={(e) => {
        setTexto(formatado);
        e.currentTarget.select();
      }}
      onChange={(e) => {
        const { texto: formatadoTexto, valor } = mascararMoeda(e.target.value);
        setTexto(formatadoTexto);
        onChange(valor);
      }}
      onBlur={() => setTexto(null)}
    />
  );
}
