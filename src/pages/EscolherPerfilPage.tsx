import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Button } from '../components/ui/button';
import { homeFor, salvarPerfilUltimo } from '../lib/nav';

export function EscolherPerfilPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;

  const temPortal = user.papeis.includes('CLIENTE');
  const temPainel = user.permissoes.length > 0;

  if (!temPortal || !temPainel) {
    return <Navigate to={homeFor(user)} replace />;
  }

  function escolher(destino: '/portal' | '/painel') {
    salvarPerfilUltimo(destino);
    navigate(destino, { replace: true });
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-6 text-center">
      <div>
        <h1 className="text-2xl font-bold">Olá, {user.nome}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Escolha por onde você quer entrar:
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={() => escolher('/portal')}>Portal do Cliente</Button>
        <Button variant="outline" onClick={() => escolher('/painel')}>
          Painel Interno
        </Button>
      </div>
    </div>
  );
}