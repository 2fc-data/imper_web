import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import {
  apiObterSlots,
  apiListarDatas,
  apiCriarData,
  apiAtualizarData,
  type DisponibilidadeSlot,
} from '../../lib/api';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function ListaDisponibilidade() {
  const { user } = useAuth();
  const userId = user?.id ?? 0;

  const now = new Date();
  const [mesAtual, setMesAtual] = useState(now.getMonth() + 1);
  const [anoAtual, setAnoAtual] = useState(now.getFullYear());
  const [slots, setSlots] = useState<DisponibilidadeSlot[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState<'todos' | 'disponivel' | 'lotado'>('todos');

  // Estado para Edição de Vagas
  const [editSlotKey, setEditSlotKey] = useState<string | null>(null);
  const [novaCapacidade, setNovaCapacidade] = useState<number>(1);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function carregarSlots() {
    let cancelado = false;
    setCarregando(true);
    setErro(null);
    apiObterSlots(mesAtual, anoAtual)
      .then((res) => { if (!cancelado) setSlots(res.slots); })
      .catch((err) => { if (!cancelado) setErro(err?.message || 'Erro ao carregar horários'); })
      .finally(() => { if (!cancelado) setCarregando(false); });
    return () => { cancelado = true; };
  }

  useEffect(() => {
    return carregarSlots();
  }, [mesAtual, anoAtual]);

  function voltarMes() {
    setEditSlotKey(null);
    if (mesAtual === 1) { setMesAtual(12); setAnoAtual(anoAtual - 1); }
    else setMesAtual(mesAtual - 1);
  }

  function avancarMes() {
    setEditSlotKey(null);
    if (mesAtual === 12) { setMesAtual(1); setAnoAtual(anoAtual + 1); }
    else setMesAtual(mesAtual + 1);
  }

  async function handleSalvarVagas(slot: DisponibilidadeSlot) {
    setSalvando(true);
    setErro(null);
    try {
      // List existing specific dates for this month to check if an override already exists
      const datasExistentes = await apiListarDatas(userId, mesAtual, anoAtual);
      const dataStr = slot.data;
      const existente = datasExistentes.find((d) => {
        const dStr = d.data.split('T')[0];
        return dStr === dataStr && d.horaInicio === slot.horaInicio;
      });

      if (existente) {
        await apiAtualizarData(existente.id, {
          capacidade: novaCapacidade,
          excluida: false,
        });
      } else {
        await apiCriarData({
          userId,
          data: `${dataStr}T00:00:00.000Z`,
          horaInicio: slot.horaInicio,
          horaFim: slot.horaFim,
          capacidade: novaCapacidade,
          excluida: false,
        });
      }

      setEditSlotKey(null);
      carregarSlots();
    } catch (err: any) {
      setErro(err?.message || 'Erro ao atualizar vagas do horário');
    } finally {
      setSalvando(false);
    }
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

      {erro && <p className="text-sm text-destructive">{erro}</p>}

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
                <th className="text-left px-3 py-2">Vagas (Livre/Total)</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-right px-3 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {slotsFiltrados.map((s) => {
                const key = `${s.data}_${s.horaInicio}`;
                const ehEditando = editSlotKey === key;

                return (
                  <tr key={key} className="border-t">
                    <td className="px-3 py-2 font-medium">{s.data.split('-').reverse().join('/')}</td>
                    <td className="px-3 py-2">{s.horaInicio} - {s.horaFim}</td>
                    <td className="px-3 py-2">
                      {ehEditando ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            value={novaCapacidade}
                            onChange={(e) => setNovaCapacidade(Number(e.target.value))}
                            className="w-16 border rounded px-2 py-1 text-xs bg-background"
                          />
                          <span className="text-xs text-muted-foreground">total</span>
                        </div>
                      ) : (
                        s.capacidade === 0 ? 'Ilimitado' : `${s.capacidade - s.ocupados}/${s.capacidade}`
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${s.disponivel ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                        {s.disponivel ? 'Disponível' : 'Lotado'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right space-x-2">
                      {ehEditando ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSalvarVagas(s)}
                            disabled={salvando}
                            className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                          >
                            {salvando ? 'Salvando...' : 'Salvar'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditSlotKey(null)}
                            disabled={salvando}
                            className="text-xs text-muted-foreground hover:underline disabled:opacity-50"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditSlotKey(key);
                            setNovaCapacidade(s.capacidade);
                          }}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Editar Vagas
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
