import { useAuth } from '../auth/AuthContext';
import { CalendarioDisponibilidade } from '../components/disponibilidade/CalendarioDisponibilidade';
import { GerenciarDatas } from '../components/disponibilidade/GerenciarDatas';
import { GerenciarPadroes } from '../components/disponibilidade/GerenciarPadroes';
import { ListaDisponibilidade } from '../components/disponibilidade/ListaDisponibilidade';
import { PageHeader } from '../components/ui/page-header';

export type CalendarioView = 'calendario' | 'disponibilidade' | 'datas' | 'padroes';

interface CalendarioPageProps {
  viewAtiva?: CalendarioView;
  onNavegar?: (view: CalendarioView) => void;
}

export function CalendarioPage({
  viewAtiva = 'calendario',
  onNavegar,
}: CalendarioPageProps) {
  const { user } = useAuth();
  const userId = user?.id ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendário de Visitas Técnicas"
        description="Gerencie datas, horários disponíveis e bloqueios para agendamento de visitas técnicas."
      />

      {viewAtiva === 'calendario' && (
        <div className="space-y-6">
          <CalendarioDisponibilidade />
          <div className="pt-4 border-t">
            <ListaDisponibilidade />
          </div>
        </div>
      )}

      {viewAtiva === 'disponibilidade' && (
        <div className="space-y-8">
          <GerenciarPadroes userId={userId} />
          <GerenciarDatas userId={userId} />
          <ListaDisponibilidade />
        </div>
      )}

      {viewAtiva === 'datas' && (
        <div className="space-y-6">
          <GerenciarDatas userId={userId} />
          <ListaDisponibilidade />
        </div>
      )}

      {viewAtiva === 'padroes' && (
        <div className="space-y-6">
          <GerenciarPadroes userId={userId} />
          <ListaDisponibilidade />
        </div>
      )}
    </div>
  );
}
