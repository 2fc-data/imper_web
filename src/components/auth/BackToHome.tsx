import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { buttonVariants } from '../ui/button';

interface BackToHomeProps {
  to?: string;
  label?: string;
  className?: string;
  variant?: 'outline' | 'secondary' | 'ghost' | 'default';
}

export function BackToHome({
  to = '/',
  label = 'Voltar para Home',
  className,
  variant = 'outline',
}: BackToHomeProps) {
  return (
    <Link
      to={to}
      className={cn(
        buttonVariants({ variant, size: 'default' }),
        'w-full hover-lift transition-all duration-300',
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:-translate-x-0.5"
        aria-hidden="true"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
      <span>{label}</span>
    </Link>
  );
}
