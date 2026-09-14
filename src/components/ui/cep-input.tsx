import { useState, useCallback } from 'react';
import { Input } from './input';

function formatarCep(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 8);
  if (d.length > 5) return `${d.slice(0, 5)}-${d.slice(5)}`;
  return d;
}

export interface CepDados {
  logradouro: string;
  bairro: string;
  cidade: string;
  estado: string;
}

interface CepInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  onConsulta?: (dados: CepDados) => void;
  disabled?: boolean;
  autoComplete?: string;
}

export function CepInput({
  id,
  name,
  value,
  onChange,
  onConsulta,
  disabled,
  autoComplete = 'postal-code',
}: CepInputProps) {
  const [status, setStatus] = useState<'idle' | 'ok' | 'erro'>('idle');

  const buscarCep = useCallback(
    async (digitos: string) => {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (data.erro) {
          setStatus('erro');
          return;
        }
        setStatus('ok');
        onConsulta?.({
          logradouro: data.logradouro ?? '',
          bairro: data.bairro ?? '',
          cidade: data.localidade ?? '',
          estado: data.uf ?? '',
        });
      } catch {
        setStatus('erro');
      }
    },
    [onConsulta],
  );

  return (
    <div>
      <Input
        id={id}
        name={name}
        autoComplete={autoComplete}
        inputMode="numeric"
        placeholder="00000-000"
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const valor = formatarCep(e.target.value);
          onChange(valor);
          if (valor.replace(/\D/g, '').length === 8) {
            setStatus('idle');
            buscarCep(valor.replace(/\D/g, ''));
          } else {
            setStatus('idle');
          }
        }}
      />
      {status === 'ok' && (
        <p className="mt-1 text-xs text-green-600">CEP encontrado</p>
      )}
      {status === 'erro' && (
        <p className="mt-1 text-xs text-destructive">
          CEP não encontrado. Verifique e tente novamente.
        </p>
      )}
    </div>
  );
}
