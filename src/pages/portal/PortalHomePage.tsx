import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

const CARDS = [
  { to: '/portal/atendimentos', titulo: 'Atendimentos', descricao: 'Histórico e andamento dos seus atendimentos' },
  { to: '/portal/agendamentos', titulo: 'Agendamentos', descricao: 'Visitas e agenda confirmada' },
  { to: '/portal/orcamentos', titulo: 'Orçamentos', descricao: 'Propostas, valores e aprovação' },
  { to: '/portal/os', titulo: 'Ordens de serviço', descricao: 'Execução e progresso dos serviços' },
  { to: '/portal/dados', titulo: 'Meus dados', descricao: 'Nome, contato, documentos e senha' },
];

export default function PortalHomePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Olá, {user?.nome}</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe seus atendimentos, orçamentos e ordens de serviço.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="rounded-xl border bg-card p-4 transition-colors hover:border-primary/50"
          >
            <div className="font-medium">{card.titulo}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {card.descricao}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
