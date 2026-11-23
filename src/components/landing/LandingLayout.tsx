import { AnimatePresence, m } from 'framer-motion';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import logoImper from '../../assets/logo_imper.webp';
import logoImper_footer from '../../assets/logo_imper_footer.webp';
import footerBg from '../../assets/Footer_images/footer_bg.webp';
import { cn } from '../../lib/utils';
import { ThemeToggle } from '../../theme/ThemeToggle';
import { HeroBackground, HeroSlideshowProvider } from './HeroBackground';
import {
  FacebookIconButton,
  InstagramIconButton,
  WhatsAppIconButton,
} from './SocialIconButtons';

const NAV_LINKS = [
  { to: '/', label: 'Início' },
  { to: '/servicos', label: 'Especialidades' },
  { to: '/como-trabalhamos', label: 'Como trabalhamos' },
  { to: '/#contato', label: 'Canais de Atendimento' },
  { to: '/contato', label: 'Envie sua mensagem' },
];

const isHashLink = (to: string) => to.includes('#');

const SECTION_BY_ROUTE: Record<string, string> = {
  '/': 'inicio',
  '/servicos': 'servicos',
  '/como-trabalhamos': 'como-trabalhamos',
  '/contato': 'contato',
};

function LandingShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      const delta = y - lastScrollY.current;
      if (menuOpen || y < 80) {
        setHeaderHidden(false);
      } else if (delta > 6) {
        setHeaderHidden(true);
      } else if (delta < -6) {
        setHeaderHidden(false);
      }
      lastScrollY.current = y;
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const nav = navRef.current;
    if (!nav) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        return;
      }
      if (e.key !== 'Tab') return;
      const focusable = nav!.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKey);
    nav.querySelector<HTMLElement>('a, button')?.focus();
    return () => document.removeEventListener('keydown', handleKey);
  }, [menuOpen]);
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const id = hash ? hash.slice(1) : SECTION_BY_ROUTE[pathname];
    if (!id) return;
    let attempts = 0;
    let raf = 0;
    const scrollToTarget = () => {
      const el = document.getElementById(id);
      if (!el) {
        if (attempts++ < 30) raf = requestAnimationFrame(scrollToTarget);
        return;
      }
      const header = document.querySelector('header');
      const offset = header ? header.offsetHeight : 0;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    };
    raf = requestAnimationFrame(scrollToTarget);
    return () => cancelAnimationFrame(raf);
  }, [pathname, hash]);

  return (
    <div className="flex min-h-full flex-col bg-background">
      <m.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: headerHidden ? '-100%' : 0, opacity: headerHidden ? 0 : 1 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        className="sticky top-0 z-50 isolate"
      >
        <HeroBackground variant="header" />
        <div className="relative z-10 mx-auto flex w-full max-w-[1400px] items-center justify-between gap-x-4 px-4 py-2 sm:px-6 lg:px-8">
          <Link
            to="/"
            aria-label="Imperpoços - Página inicial"
            className="rounded-xl bg-white/95 p-1.5 shadow-sm ring-1 ring-black/5 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <img
              src={logoImper}
              alt="Imperpoços"
              className="h-12 w-auto object-contain sm:h-14 lg:h-16"
            />
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
                        'rounded-lg px-3 py-2 text-sm font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70',
                        isActive &&
                        !isHashLink(link.to) &&
                        'bg-white/15 font-semibold text-white',
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle className="h-11 w-11 border-white/25 text-white hover:bg-white/20 hover:text-white" />
            <WhatsAppIconButton className="h-11 w-11 text-white hover:bg-white/20 hover:text-white" />
            <InstagramIconButton className="hidden h-11 w-11 text-white hover:bg-white/20 hover:text-white sm:inline-flex" />
            <FacebookIconButton className="hidden h-11 w-11 text-white hover:bg-white/20 hover:text-white sm:inline-flex" />
            <Link
              to="/login"
              aria-label="Fazer login"
              className="hidden h-10 w-10 items-center justify-center rounded-lg bg-transparent text-white/85 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 lg:inline-flex"
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
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 lg:hidden"
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
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
              />

              <m.nav
                ref={navRef}
                initial={{ y: '-100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '-100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 26, stiffness: 280 }}
                className="absolute top-full left-0 right-0 z-50 border-b border-white/10 bg-black/85 shadow-2xl backdrop-blur-xl lg:hidden"
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
                            'block rounded-md px-4 py-3 text-base font-medium text-white/80 transition-all hover:bg-white/10 hover:text-white',
                            isActive &&
                            !isHashLink(link.to) &&
                            'bg-white/15 font-semibold text-white',
                          )
                        }
                      >
                        {link.label}
                      </NavLink>
                    </li>
                  ))}
                  <li className="pt-3 border-t border-white/15 flex flex-col gap-2.5 mt-2">
                    <Link
                      to="/contato"
                      onClick={() => setMenuOpen(false)}
                      className="block text-center rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all"
                    >
                      Contato
                    </Link>
                    <Link
                      to="/login"
                      onClick={() => setMenuOpen(false)}
                      className="block text-center rounded-md border border-white/30 px-4 py-3 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      Office
                    </Link>
                  </li>
                  <li className="flex items-center justify-center gap-3 pt-2">
                    <InstagramIconButton className="h-11 w-11 text-white hover:bg-white/20 hover:text-white" />
                    <FacebookIconButton className="h-11 w-11 text-white hover:bg-white/20 hover:text-white" />
                  </li>
                </ul>
              </m.nav>
            </>
          )}
        </AnimatePresence>
      </m.header>

      <main className="flex-1 bg-background h-full">{children}</main>

      <footer className="relative isolate overflow-hidden border-t py-16 min-h-[420px] sm:py-20">
        <img
          src={footerBg}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-background/36"
        />
        <div className="relative mx-auto grid w-full max-w-[1400px] gap-8 px-4 sm:grid-cols-4">
          <div className="flex flex-col items-start gap-4 rounded-xl border border-border/60 bg-background/55 p-6 text-left backdrop-blur-sm">
            <h3 className="w-full text-lg font-bold tracking-tight text-primary font-serif">
              Imperpoços
            </h3>
            <p className="max-w-xl text-base text-muted-foreground">
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
                className="inline-flex items-center gap-2 rounded px-1.5 py-3 text-sm font-medium transition-colors hover:text-primary"
              >
                Rua São Paulo, 511 — Centro
              </a>
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 rounded-xl border border-border/60 bg-background/55 p-6 text-left backdrop-blur-sm">
            <h3 className="text-lg font-semibold tracking-tight text-foreground font-serif">
              Redes sociais
            </h3>
            <div className="flex flex-col items-start gap-3">
              <a
                href="https://www.facebook.com/imperpocos"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Imperpoços no Facebook"
                className="inline-flex items-center gap-2 rounded px-0 py-3 text-sm font-medium transition-colors hover:text-primary"
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
                aria-label="Imperpoços no Instagram"
                className="inline-flex items-center gap-2 rounded px-0 py-3 text-sm font-medium transition-colors hover:text-primary"
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
          <div className="flex flex-col items-start gap-3 rounded-xl border border-border/60 bg-background/55 p-6 text-left backdrop-blur-sm">
            <h3 className="text-lg font-semibold tracking-tight text-foreground font-serif">
              Mapa do site
            </h3>
            <ul className="flex flex-col items-start gap-2">
              {NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="rounded px-1.5 py-3 text-sm transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/login"
                  className="rounded px-1.5 py-3 text-sm transition-colors hover:text-primary"
                >
                  Office
                </Link>
              </li>
            </ul>
          </div>
          <div className="flex flex-col items-center justify-center gap-3 text-center sm:items-center">
            <img
              src={logoImper_footer}
              alt="Imperpoços"
              className="h-56 w-auto rounded-3xl object-contain opacity-90"
            />
          </div>
        </div>
        <div className="mx-auto w-full max-w-[1400px] px-4 pt-8 text-center">
          <p className="inline-block rounded-full bg-background/60 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur-sm">
            © {new Date().getFullYear()} Imperpoços. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}

export function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <HeroSlideshowProvider>
      <LandingShell>{children}</LandingShell>
    </HeroSlideshowProvider>
  );
}
