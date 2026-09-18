import { useAuth } from '../auth/AuthContext';
import { CalendarioDisponibilidade } from '../components/disponibilidade/CalendarioDisponibilidade';
import { GerenciarDatas } from '../components/disponibilidade/GerenciarDatas';
import { GerenciarPadroes } from '../components/disponibilidade/GerenciarPadroes';
import { ListaDisponibilidade } from '../components/disponibilidade/ListaDisponibilidade';

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
    <div className="p-6 space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Calendário de Visitas Técnicas</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie datas, horários disponíveis e bloqueios para agendamento de visitas técnicas.
        </p>
      </div>

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
