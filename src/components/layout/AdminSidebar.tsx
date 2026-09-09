import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { iniciais, itensPara, type NavItem } from '../../lib/nav';
import { cn } from '../../lib/utils';

type MenuModo = 'operacional' | 'analitico';
const STORAGE_KEY = 'sidebar-menu-modo';

interface AdminSidebarProps {
  openOnMobile: boolean;
  onClose: () => void;
  onLogout: () => void;
}

function ItemMenu({ item, end }: { item: NavItem; end?: boolean }) {
  const location = useLocation();

  if (item.children && item.children.length > 0) {
    const isChildActive = item.children.some(
      (child) => child.to && location.pathname.startsWith(child.to),
    );
    const [open, setOpen] = useState(isChildActive);

    useEffect(() => {
      if (isChildActive) {
        setOpen(true);
      }
    }, [isChildActive]);

    return (
      <div className="flex flex-col">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'flex w-full items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary cursor-pointer',
            isChildActive && 'text-primary font-semibold',
          )}
        >
          <div className="flex items-center gap-2.5">
            {item.icon}
            <span>{item.label}</span>
          </div>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              'h-4 w-4 transition-transform duration-200',
              open && 'rotate-180',
            )}
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden pl-4 mt-1 flex flex-col gap-1 border-l-2 border-primary/20 ml-3"
            >
              {item.children.map((child) => (
                <NavLink
                  key={child.to}
                  to={child.to!}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary',
                      isActive && 'bg-primary/10 text-primary font-semibold',
                    )
                  }
                >
                  {child.icon}
                  <span>{child.label}</span>
                </NavLink>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (!item.to) return null;

  return (
    <NavLink
      to={item.to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary',
          isActive && 'bg-primary/10 text-primary font-semibold',
        )
      }
    >
      {item.icon}
      <span>{item.label}</span>
    </NavLink>
  );
}

function MenuToggle({
  value,
  onChange,
}: {
  value: MenuModo;
  onChange: (m: MenuModo) => void;
}) {
  return (
    <div className="flex rounded-lg border bg-card/60 p-0.5">
      <button
        type="button"
        onClick={() => onChange('operacional')}
        className={cn(
          'flex-1 cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
          value === 'operacional'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        Operacional
      </button>
      <button
        type="button"
        onClick={() => onChange('analitico')}
        className={cn(
          'flex-1 cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
          value === 'analitico'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        Analítico
      </button>
    </div>
  );
}

export function AdminSidebar({
  openOnMobile,
  onClose,
  onLogout,
}: AdminSidebarProps) {
  const location = useLocation();
  const { user } = useAuth();

  const defaultModo: MenuModo =
    user?.papel === 'ADMIN' ? 'analitico' : 'operacional';

  const [menuAtivo, setMenuAtivo] = useState<MenuModo>(() => {
    const salvo = localStorage.getItem(STORAGE_KEY) as MenuModo | null;
    if (salvo === 'operacional' || salvo === 'analitico') return salvo;
    return defaultModo;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, menuAtivo);
  }, [menuAtivo]);

  const navigate = useNavigate();

  const handleMenuChange = useCallback(
    (novo: MenuModo) => {
      setMenuAtivo(novo);
      if (novo === 'analitico') navigate('/painel');
    },
    [navigate],
  );

  const itens = itensPara(user?.permissoes ?? []);
  const itensFiltrados =
    menuAtivo === 'analitico'
      ? itens.filter((item) => item.to === '/painel' || item.to === '/execucao')
      : itens.filter(
          (item) => item.to !== '/painel' && item.to !== '/execucao',
        );

  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, onClose]);

  const navItems = (
    <>
      <MenuToggle value={menuAtivo} onChange={handleMenuChange} />
      <nav
        aria-label={
          menuAtivo === 'analitico' ? 'Menu analítico' : 'Menu operacional'
        }
        className="mt-3 flex flex-col gap-1"
      >
        {itensFiltrados.map((item, idx) => (
          <ItemMenu
            key={item.to || item.label || idx}
            item={item}
            end={menuAtivo === 'analitico'}
          />
        ))}
      </nav>
    </>
  );

  const userBlock = user && (
    <div className="border-t p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {iniciais(user.nome)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{user.nome}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onLogout}
        className="mt-3 inline-flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
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
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
        Sair
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop: fixa */}
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="sticky top-14 flex h-[calc(100vh-3.5rem)] flex-col border-r bg-card/60">
          <div className="flex-1 overflow-y-auto p-4">{navItems}</div>
          {userBlock}
        </div>
      </aside>

      {/* Mobile: drawer */}
      <AnimatePresence>
        {openOnMobile && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-40 bg-overlay/40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r bg-background shadow-xl lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
            >
              <div
                className={cn(
                  'flex items-center justify-between border-b px-4 py-3 h-14',
                )}
              >
                <span className="text-sm font-semibold">Menu</span>
                <button
                  type="button"
                  aria-label="Fechar"
                  onClick={onClose}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
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
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">{navItems}</div>
              {userBlock}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
