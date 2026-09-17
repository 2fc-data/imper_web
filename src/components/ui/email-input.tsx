import { useState } from 'react';
import { Input } from './input';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface EmailInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
  className?: string;
}

export function EmailInput({
  id,
  name,
  value,
  onChange,
  placeholder = 'voce@empresa.com',
  disabled,
  required,
  autoComplete = 'email',
  className,
}: EmailInputProps) {
  const [erro, setErro] = useState(false);

  return (
    <div>
      <Input
        id={id}
        name={name}
        type="email"
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        required={required}
        className={className}
        onChange={(e) => {
          onChange(e.target.value);
          if (erro) setErro(false);
        }}
        onBlur={() => {
          if (value && !EMAIL_REGEX.test(value)) {
            setErro(true);
          }
        }}
      />
      {erro && (
        <p className="text-xs text-destructive mt-1">
          E-mail inválido.
        </p>
      )}
    </div>
  );
}
