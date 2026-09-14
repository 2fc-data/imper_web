import { useState, useEffect, useCallback } from 'react';
import { Input } from './input';

function formatarCpf(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function formatarCnpj(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12)
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

function validarCpf(cpf: string): boolean {
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(d[i]) * (10 - i);
  let r = (soma * 10) % 11;
  if (r === 10) r = 0;
  if (r !== parseInt(d[9])) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(d[i]) * (11 - i);
  r = (soma * 10) % 11;
  if (r === 10) r = 0;
  return r === parseInt(d[10]);
}

function validarCnpj(cnpj: string): boolean {
  const d = cnpj.replace(/\D/g, '');
  if (d.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(d)) return false;
  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let soma = 0;
  for (let i = 0; i < 12; i++) soma += parseInt(d[i]) * pesos1[i];
  let r = soma % 11;
  const dv1 = r < 2 ? 0 : 11 - r;
  if (parseInt(d[12]) !== dv1) return false;
  soma = 0;
  for (let i = 0; i < 13; i++) soma += parseInt(d[i]) * pesos2[i];
  r = soma % 11;
  const dv2 = r < 2 ? 0 : 11 - r;
  return parseInt(d[13]) === dv2;
}

interface CpfCnpjInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoComplete?: string;
}

export function CpfCnpjInput({
  id,
  name,
  value,
  onChange,
  disabled,
  autoComplete = 'one-time-code',
}: CpfCnpjInputProps) {
  const [erro, setErro] = useState('');
  const digitos = value.replace(/\D/g, '');

  const detectarEValidar = useCallback(() => {
    if (digitos.length === 0) {
      setErro('');
      return;
    }
    if (digitos.length <= 11) {
      setErro(digitos.length === 11 && !validarCpf(digitos) ? 'CPF inválido' : '');
    } else {
      setErro(digitos.length === 14 && !validarCnpj(digitos) ? 'CNPJ inválido' : '');
    }
  }, [digitos]);

  useEffect(() => {
    detectarEValidar();
  }, [detectarEValidar]);

  const tipo = digitos.length > 11 ? 'CNPJ' : 'CPF';
  const mascarado = digitos.length <= 11 ? formatarCpf(value) : formatarCnpj(value);

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <Input
          id={id}
          name={name}
          autoComplete={autoComplete}
          inputMode="numeric"
          value={mascarado}
          onChange={(e) => onChange(e.target.value)}
          placeholder="CPF ou CNPJ"
          disabled={disabled}
          className={erro ? 'border-destructive pr-14' : 'pr-14'}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {digitos.length > 11 ? 'CNPJ' : digitos.length > 0 ? 'CPF' : ''}
        </span>
      </div>
      {erro && <p className="mt-1 text-xs text-destructive">{erro}</p>}
    </div>
  );
}
