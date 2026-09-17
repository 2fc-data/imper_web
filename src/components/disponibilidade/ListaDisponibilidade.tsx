import { useState, useEffect } from 'react';
import { apiObterSlots, type DisponibilidadeSlot } from '../../lib/api';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function ListaDisponibilidade() {
  const now = new Date();
  const [mesAtual, setMesAtual] = useState(now.getMonth() + 1);
  const [anoAtual, setAnoAtual] = useState(now.getFullYear());
  const [slots, setSlots] = useState<DisponibilidadeSlot[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState<'todos' | 'disponivel' | 'lotado'>('todos');

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    apiObterSlots(mesAtual, anoAtual)
      .then((res) => { if (!cancelado) setSlots(res.slots); })
      .catch(() => {})
      .finally(() => { if (!cancelado) setCarregando(false); });
    return () => { cancelado = true; };
  }, [mesAtual, anoAtual]);

  function voltarMes() {
    if (mesAtual === 1) { setMesAtual(12); setAnoAtual(anoAtual - 1); }
    else setMesAtual(mesAtual - 1);
  }

  function avancarMes() {
    if (mesAtual === 12) { setMesAtual(1); setAnoAtual(anoAtual + 1); }
    else setMesAtual(mesAtual + 1);
  }

  const slotsFiltrados = slots.filter((s) => {
    if (filtro === 'disponivel') return s.disponivel;
    if (filtro === 'lotado') return !s.disponivel;
    return true;
  }).sort((a, b) => {
    if (a.data !== b.data) return a.data.localeCompare(b.data);
    return a.horaInicio.localeCompare(b.horaInicio);
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Próximos Horários</h3>

      <div className="flex items-center justify-between">
        <button type="button" onClick={voltarMes} className="text-sm text-muted-foreground hover:text-foreground">&larr; Anterior</button>
        <span className="text-sm font-medium">{MESES[mesAtual - 1]} {anoAtual}</span>
        <button type="button" onClick={avancarMes} className="text-sm text-muted-foreground hover:text-foreground">Próximo &rarr;</button>
      </div>

      <div className="flex gap-2">
        {(['todos', 'disponivel', 'lotado'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFiltro(f)}
            className={`text-xs px-2 py-1 rounded ${filtro === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
          >
            {f === 'todos' ? 'Todos' : f === 'disponivel' ? 'Disponíveis' : 'Lotados'}
          </button>
        ))}
      </div>

      {carregando ? (
        <p className="text-sm text-muted-foreground py-4">Carregando...</p>
      ) : slotsFiltrados.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">Nenhum horário encontrado.</p>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-3 py-2">Data</th>
                <th className="text-left px-3 py-2">Horário</th>
                <th className="text-left px-3 py-2">Vagas</th>
                <th className="text-left px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {slotsFiltrados.map((s, i) => (
                <tr key={i} className="border-t">
                  <td className="px-3 py-2">{s.data.split('-').reverse().join('/')}</td>
                  <td className="px-3 py-2">{s.horaInicio} - {s.horaFim}</td>
                  <td className="px-3 py-2">{s.capacidade === 0 ? 'Ilimitado' : `${s.capacidade - s.ocupados}/${s.capacidade}`}</td>
                  <td className="px-3 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${s.disponivel ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                      {s.disponivel ? 'Disponível' : 'Lotado'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
