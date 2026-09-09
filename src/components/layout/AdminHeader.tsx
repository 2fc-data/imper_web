import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { ThemeToggle } from '../../theme/ThemeToggle';

interface AdminHeaderProps {
  onToggleSidebar: () => void;
  timeLeft?: number;
  sessionDuration?: number;
}

function formatarTempo(totalSeg: number): string {
  const seg = Math.max(0, totalSeg);
  const min = Math.floor(seg / 60);
  const rest = seg % 60;
  return `${String(min).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

export function AdminHeader({
  onToggleSidebar,
  timeLeft,
  sessionDuration,
}: AdminHeaderProps) {
  const baixo = timeLeft !== undefined && timeLeft <= 60;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-6">
      <button
        type="button"
        aria-label="Abrir ações da página"
        onClick={onToggleSidebar}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-card text-muted-foreground transition-colors hover:text-foreground lg:hidden"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M3 6h18M3 12h18M9 18h12" />
        </svg>
      </button>

      <Link
        to="/"
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M8 8h8M8 12h8M8 16h8" />
          </svg>
        </div>
        <span className="text-base font-semibold tracking-tight uppercase">
          Imperpoços
        </span>
      </Link>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        {timeLeft !== undefined && sessionDuration !== undefined && (
          <span
            title="Sessão expira em"
            className={cn(
              'inline-flex h-9 items-center gap-1.5 rounded-md border border-transparent px-2 text-sm tabular-nums text-muted-foreground transition-colors sm:px-3',
              baixo &&
                'border-destructive/40 bg-destructive/10 text-destructive',
            )}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
            <span className="hidden sm:inline">{formatarTempo(timeLeft)}</span>
          </span>
        )}
      </div>
    </header>
  );
}
