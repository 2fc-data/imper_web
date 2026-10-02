import { Link, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { PerfilSwitcher } from '../PerfilSwitcher';

export function PortalLayout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `transition-colors hover:text-foreground ${
      isActive ? 'font-semibold text-primary' : 'text-muted-foreground'
    }`;

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b bg-background/80 px-4 py-3 backdrop-blur md:px-6">
        <Link to="/portal" className="font-semibold hover:opacity-80">
          Portal do Cliente
        </Link>
        <nav className="flex flex-wrap gap-3 text-sm">
          <NavLink to="/portal" end className={linkClass}>
            Início
          </NavLink>
          <NavLink to="/portal/atendimentos" className={linkClass}>
            Atendimentos
          </NavLink>
          <NavLink to="/portal/agendamentos" className={linkClass}>
            Agendamentos
          </NavLink>
          <NavLink to="/portal/orcamentos" className={linkClass}>
            Orçamentos
          </NavLink>
          <NavLink to="/portal/os" className={linkClass}>
            Ordens de serviço
          </NavLink>
          <NavLink to="/portal/dados" className={linkClass}>
            Meus dados
          </NavLink>
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <PerfilSwitcher />
          <span className="hidden sm:inline">{user.nome}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border px-3 py-1.5 transition-colors hover:bg-card"
          >
            Sair
          </button>
        </div>
      </header>
      <main className="w-full flex-1 px-4 py-6 md:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
