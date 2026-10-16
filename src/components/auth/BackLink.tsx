import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { buttonVariants } from '../ui/button';

/** Presets de estilo para os links de voltar. */
export type BackLinkStyle = 'button' | 'bordered' | 'inline';

const STYLE_CLASSES: Record<BackLinkStyle, string> = {
  button: '',
  bordered:
    'mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-input bg-background px-4 py-3 text-sm font-medium shadow-sm transition-all hover:bg-primary/10 hover:text-primary hover-lift',
  inline:
    'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-foreground transition-all hover:bg-primary/10 hover:text-primary focus-gold',
};

const ICON_CLASSES: Record<BackLinkStyle, string> = {
  button:
    'h-4 w-4 shrink-0 text-primary transition-transform group-hover:-translate-x-0.5',
  bordered: 'h-4 w-4 shrink-0',
  inline: 'h-4 w-4 text-primary',
};

const ICONS = {
  home: (
    <>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </>
  ),
  arrow: <path d="M19 12H5M12 19l-7-7 7-7" />,
} as const;

interface BackLinkProps {
  to?: string;
  label?: string;
  className?: string;
  /** 'home' = ícone de casa; 'arrow' = seta para a esquerda (padrão). */
  icon?: keyof typeof ICONS;
  /** Estilo visual: botão, link com borda ou link inline. */
  style?: BackLinkStyle;
  /** Variante do botão (apenas quando style="button"). */
  variant?: 'outline' | 'secondary' | 'ghost' | 'default';
}

export function BackLink({
  to = '/',
  label = 'Voltar para Home',
  className,
  icon = 'arrow',
  style = 'bordered',
  variant = 'outline',
}: BackLinkProps) {
  return (
    <Link
      to={to}
      className={cn(
        style === 'button'
          ? cn(
              buttonVariants({ variant, size: 'default' }),
              'w-full hover-lift transition-all duration-300',
            )
          : STYLE_CLASSES[style],
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
        className={ICON_CLASSES[style]}
        aria-hidden="true"
      >
        {ICONS[icon]}
      </svg>
      {style === 'button' ? <span>{label}</span> : label}
    </Link>
  );
}
