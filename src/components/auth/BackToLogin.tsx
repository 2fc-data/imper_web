import { Link } from 'react-router-dom';

interface BackToLoginProps {
  to?: string;
  label?: string;
  className?: string;
}

export function BackToLogin({
  to = '/login',
  label = 'Voltar para o login',
  className,
}: BackToLoginProps) {
  return (
    <Link
      to={to}
      className={
        className ??
        'mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-input bg-background px-4 py-3 text-sm font-medium shadow-sm transition-all hover:bg-primary/10 hover:text-primary hover-lift'
      }
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 shrink-0"
        aria-hidden="true"
      >
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      {label}
    </Link>
  );
}
