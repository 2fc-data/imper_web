import { AnimatePresence, m } from 'framer-motion';
import { type ReactNode, useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import logoImper from '../../assets/logo_imper.webp';
import { cn } from '../../lib/utils';
import { ThemeToggle } from '../../theme/ThemeToggle';
import {
  FacebookIconButton,
  InstagramIconButton,
  WhatsAppIconButton,
} from './SocialIconButtons';

const NAV_LINKS = [
  { to: '/', label: 'Início' },
  { to: '/servicos', label: 'Serviços' },
  { to: '/como-trabalhamos', label: 'Como trabalhamos' },
  { to: '/area-de-atuacao', label: 'Área de atuação' },
  { to: '/contato', label: 'Contato' },
];

const SECTION_BY_ROUTE: Record<string, string> = {
  '/': 'inicio',
  '/servicos': 'servicos',
  '/como-trabalhamos': 'como-trabalhamos',
  '/area-de-atuacao': 'area-de-atuacao',
  '/contato': 'contato',
};

export function LandingLayout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const id = SECTION_BY_ROUTE[pathname];
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;
    const header = document.querySelector('header');
    const offset = header ? header.offsetHeight : 0;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }, [pathname]);

  return (
    <div className="flex min-h-full flex-col bg-background">
      <m.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur-md"
      >
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-x-4 px-4 py-3">
          <Link
            to="/"
            className="rounded px-1.5 py-0.5 text-lg font-bold tracking-tight text-primary transition-colors hover:text-primary/80"
          >
            IMPERPOÇOS
          </Link>
          <nav className="hidden lg:block">
            <ul className="flex items-center gap-x-1">
              {NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.to === '/'}
                    className={({ isActive }) =>
                      cn(
                        'rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:text-primary',
                        isActive && 'text-primary',
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <WhatsAppIconButton />
            <InstagramIconButton />
            <FacebookIconButton />
            <Link
              to="/login"
              aria-label="Fazer login"
              className="hidden h-8 w-8 items-center justify-center rounded-lg bg-transparent text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground lg:inline-flex"
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
                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
                <path d="M10 17l5-5-5-5" />
                <path d="M15 12H3" />
              </svg>
            </Link>
            <button
              type="button"
              aria-label="Abrir menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-primary/10 hover:text-foreground lg:hidden"
            >
              {menuOpen ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {menuOpen && (
            <>
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setMenuOpen(false)}
                className="fixed inset-0 z-40 bg-background/60 backdrop-blur-xs lg:hidden"
              />

              <m.nav
                initial={{ y: '-100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '-100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 26, stiffness: 280 }}
                className="absolute top-full left-0 right-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur-md shadow-2xl lg:hidden"
              >
                <ul className="mx-auto flex w-full max-w-[1400px] flex-col gap-y-1 px-4 py-5 sm:px-6">
                  {NAV_LINKS.map((link) => (
                    <li key={link.to}>
                      <NavLink
                        to={link.to}
                        end={link.to === '/'}
                        onClick={() => setMenuOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            'block rounded-md px-4 py-3 text-base font-medium text-muted-foreground transition-all hover:text-foreground hover:bg-primary/10',
                            isActive &&
                              'text-foreground font-semibold bg-primary/10',
                          )
                        }
                      >
                        {link.label}
                      </NavLink>
                    </li>
                  ))}
                  <li className="pt-3 border-t border-border/60 flex flex-col gap-2.5 mt-2">
                    <Link
                      to="/orcamento"
                      onClick={() => setMenuOpen(false)}
                      className="block text-center rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all"
                    >
                      Solicitar Orçamento
                    </Link>
                    <Link
                      to="/login"
                      onClick={() => setMenuOpen(false)}
                      className="block text-center rounded-md border border-border px-4 py-3 text-sm font-medium text-primary transition-colors hover:text-foreground"
                    >
                      Office
                    </Link>
                  </li>
                </ul>
              </m.nav>
            </>
          )}
        </AnimatePresence>
      </m.header>

      <main className="flex-1 bg-background h-full">{children}</main>

      <footer className="border-t bg-secondary py-8">
        <div className="mx-auto grid w-full max-w-[1400px] gap-8 px-4 sm:grid-cols-4">
          <div className="border-border/60 flex flex-col items-start gap-4 p-6 text-left rounded-xl shadow-lg">
            <span className="text-lg font-bold tracking-tight text-center w-full text-primary font-serif">
              Imperpoços
            </span>
            <p className="max-w-xl text-md text-muted-foreground">
              Engenharia em Impermeabilização.
            </p>
            <p className="max-w-xl px-1.5 text-sm text-muted-foreground">
              Poços de Caldas/MG
            </p>
            <p className="max-w-xl text-sm text-muted-foreground">
              <a
                href="https://www.google.com/maps/search/?api=1&query=Rua+S%C3%A3o+Paulo,+511+-+Centro,+Po%C3%A7os+de+Caldas/MG"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded px-1.5 py-0.5 text-sm font-medium transition-colors hover:text-primary"
              >
                Rua São Paulo, 511 — Centro
              </a>
            </p>
          </div>
          <div className="border-border/60 flex flex-col items-center gap-3 text-center sm:items-center p-6 rounded-xl shadow-lg">
            <p className="text-lg font-semibold tracking-tight text-foreground font-serif">
              Redes sociais
            </p>
            <div className="flex flex-col items-start gap-3">
              <a
                href="https://www.facebook.com/imperpocos"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded px-0 py-0.5 text-sm font-medium transition-colors hover:text-primary"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M13.5 21.9v-8h2.7l.4-3.1h-3.1V8.8c0-.9.25-1.5 1.55-1.5h1.65v-2.8c-.3-.04-1.3-.12-2.45-.12-2.4 0-4.05 1.47-4.05 4.17v2.32H7.5v3.1h2.7v8h3.3z" />
                </svg>
                /imperpocos
              </a>
              <a
                href="https://www.instagram.com/imperpocos"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded px-0 py-0.5 text-sm font-medium transition-colors hover:text-primary"
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
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
                @imperpocos
              </a>
            </div>
          </div>
          <div className="border-border/60 flex flex-col items-center gap-3 text-center p-6 rounded-xl shadow-lg">
            <p className="text-lg font-semibold tracking-tight text-foreground font-serif">
              Mapa do site
            </p>
            <ul className="flex flex-col items-start gap-2">
              {NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="rounded px-1.5 py-0.5 text-sm transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/login"
                  className="rounded px-1.5 py-0.5 text-sm transition-colors hover:text-primary"
                >
                  Office
                </Link>
              </li>
            </ul>
          </div>
          <div className="flex flex-col items-center justify-center gap-3 text-center sm:items-center">
            <img
              src={logoImper}
              alt="Imperpoços"
              className="h-45 w-auto rounded-md border-6 border-white object-contain opacity-90"
            />
          </div>
        </div>
        <div className="mx-auto w-full max-w-[1400px] px-4 pt-8 text-center">
          <p className="text-xs text-muted-foreground">
            © 2026 Imperpoços. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
