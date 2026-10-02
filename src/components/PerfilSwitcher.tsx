import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function opcoesSwitcher(user: { papeis: string[] }) {
  return {
    portal: user.papeis.includes('CLIENTE'),
    painel: user.papeis.some((nome) => nome !== 'CLIENTE'),
  };
}

export function PerfilSwitcher() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;
  const { portal, painel } = opcoesSwitcher(user);
  if (!portal || !painel) return null;

  const ativo = location.pathname.startsWith('/painel') ? '/painel' : '/portal';

  function trocar(destino: '/portal' | '/painel') {
    navigate(destino);
  }

  return (
    <div className="flex items-center gap-1 rounded-full border p-0.5 text-xs">
      <button
        type="button"
        onClick={() => trocar('/portal')}
        className={
          ativo === '/portal'
            ? 'rounded-full bg-primary px-2.5 py-1 text-primary-foreground'
            : 'rounded-full px-2.5 py-1 text-muted-foreground'
        }
      >
        Portal
      </button>
      <button
        type="button"
        onClick={() => trocar('/painel')}
        className={
          ativo === '/painel'
            ? 'rounded-full bg-primary px-2.5 py-1 text-primary-foreground'
            : 'rounded-full px-2.5 py-1 text-muted-foreground'
        }
      >
        Painel
      </button>
    </div>
  );
}