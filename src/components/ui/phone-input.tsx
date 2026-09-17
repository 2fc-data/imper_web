import { Input } from './input';
import { formatPhone } from '../../lib/format';
import { cn } from '../../lib/utils';

interface PhoneInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
  className?: string;
}

export function PhoneInput({
  id,
  name,
  value,
  onChange,
  disabled,
  required,
  autoComplete = 'tel',
  placeholder = '(00) 00000-0000',
  className,
}: PhoneInputProps) {
  return (
    <Input
      id={id}
      name={name}
      type="tel"
      inputMode="numeric"
      autoComplete={autoComplete}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(formatPhone(e.target.value))}
      disabled={disabled}
      required={required}
      className={className}
    />
  );
}
