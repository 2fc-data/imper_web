import { useState } from 'react';
import { Input } from './input';
import { formatarMoedaInput, parseMoedaInput } from '../../lib/format';

export function InputMoeda({
  id,
  value,
  onChange,
  disabled,
  required,
}: {
  id: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  disabled?: boolean;
  required?: boolean;
}) {
  const [texto, setTexto] = useState<string | null>(null);
  return (
    <Input
      id={id}
      inputMode="decimal"
      disabled={disabled}
      required={required}
      placeholder="R$ 0,00"
      value={texto ?? formatarMoedaInput(value)}
      onFocus={() => setTexto(value != null ? String(value).replace('.', ',') : '')}
      onChange={(e) => {
        setTexto(e.target.value);
        onChange(parseMoedaInput(e.target.value));
      }}
      onBlur={() => setTexto(null)}
    />
  );
}
