import { useState, useEffect } from 'react';
import { apiObterSlots, type DisponibilidadeSlot } from '../../lib/api';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const DIAS_CABECALHO = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function getDiasDoMes(ano: number, mes: number): (number | null)[] {
  const primeiroDia = new Date(ano, mes - 1, 1).getDay();
  const totalDias = new Date(ano, mes, 0).getDate();
  const dias: (number | null)[] = [];
  const offset = primeiroDia === 0 ? 6 : primeiroDia - 1;
  for (let i = 0; i < offset; i++) dias.push(null);
  for (let d = 1; d <= totalDias; d++) dias.push(d);
  return dias;
}

export function CalendarioDisponibilidade() {
  const now = new Date();
  const [mesAtual, setMesAtual] = useState(now.getMonth() + 1);
  const [anoAtual, setAnoAtual] = useState(now.getFullYear());
  const [slots, setSlots] = useState<DisponibilidadeSlot[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);
  const [modoLista, setModoLista] = useState(false);

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
    setDiaSelecionado(null);
  }

  function avancarMes() {
    if (mesAtual === 12) { setMesAtual(1); setAnoAtual(anoAtual + 1); }
    else setMesAtual(mesAtual + 1);
    setDiaSelecionado(null);
  }

  function irParaHoje() {
    setMesAtual(now.getMonth() + 1);
    setAnoAtual(now.getFullYear());
    setDiaSelecionado(null);
  }

  function formatarDataISO(dia: number): string {
    return `${anoAtual}-${String(mesAtual).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  }

  function slotsDoDia(dataISO: string): DisponibilidadeSlot[] {
    return slots.filter((s) => s.data === dataISO);
  }

  function statusDia(dataISO: string): 'available' | 'limited' | 'full' | 'none' {
    const diaSlots = slotsDoDia(dataISO);
    if (diaSlots.length === 0) return 'none';
    const todosLotados = diaSlots.every((s) => !s.disponivel);
    if (todosLotados) return 'full';
    const algumLimitado = diaSlots.some((s) => s.ocupados > 0 && s.disponivel);
    if (algumLimitado) return 'limited';
    return 'available';
  }

  const diasDoMes = getDiasDoMes(anoAtual, mesAtual);
  const slotsOrdenados = [...slots].sort((a, b) => {
    if (a.data !== b.data) return a.data.localeCompare(b.data);
    return a.horaInicio.localeCompare(b.horaInicio);
  });

  const statusColors: Record<string, string> = {
    available: 'bg-green-100 text-green-800',
    limited: 'bg-yellow-100 text-yellow-800',
    full: 'bg-gray-100 text-gray-500',
    none: 'bg-white',
  };

  const statusLabels: Record<string, string> = {
    available: 'Disponível',
    limited: 'Parcial',
    full: 'Lotado',
    none: 'Sem slots',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button type="button" onClick={voltarMes} className="text-sm text-muted-foreground hover:text-foreground">&larr;</button>
          <span className="text-sm font-medium min-w-[140px] text-center">
            {MESES[mesAtual - 1]} {anoAtual}
          </span>
          <button type="button" onClick={avancarMes} className="text-sm text-muted-foreground hover:text-foreground">&rarr;</button>
          <button type="button" onClick={irParaHoje} className="text-xs text-primary hover:underline ml-2">Hoje</button>
        </div>
        <button
          type="button"
          onClick={() => setModoLista(!modoLista)}
          className="text-xs text-muted-foreground hover:text-foreground border rounded px-2 py-1"
        >
          {modoLista ? 'Calendário' : 'Lista'}
        </button>
      </div>

      <div className="flex gap-3 text-xs">
        {Object.entries(statusLabels).filter(([k]) => k !== 'none').map(([key, label]) => (
          <span key={key} className={`px-2 py-0.5 rounded ${statusColors[key]}`}>{label}</span>
        ))}
      </div>

      {carregando ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Carregando calendário...</p>
      ) : modoLista ? (
        <div className="border rounded-md max-h-96 overflow-y-auto">
          {slotsOrdenados.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum horário disponível neste mês.</p>
          ) : (
            <div className="divide-y">
              {slotsOrdenados.map((slot, i) => (
                <div key={i} className={`px-3 py-2 flex items-center justify-between ${!slot.disponivel ? 'opacity-50' : ''}`}>
                  <div>
                    <span className="text-sm font-medium">
                      {slot.data.split('-').reverse().join('/')}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {slot.horaInicio} - {slot.horaFim}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {slot.capacidade === 0 ? 'Ilimitado' : `${slot.ocupados}/${slot.capacidade}`}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${slot.disponivel ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                      {slot.disponivel ? 'Disponível' : 'Lotado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="border rounded-md overflow-hidden">
            <div className="grid grid-cols-7 bg-muted">
              {DIAS_CABECALHO.map((dia) => (
                <div key={dia} className="text-xs font-medium text-center py-2 border-r last:border-r-0">
                  {dia}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {diasDoMes.map((dia, idx) => {
                if (dia === null) return <div key={`empty-${idx}`} className="border-r border-b last:border-r-0 min-h-[60px]" />;
                const dataISO = formatarDataISO(dia);
                const status = statusDia(dataISO);
                const selecionado = diaSelecionado === dataISO;
                const diaSlots = slotsDoDia(dataISO);
                const disponiveisCount = diaSlots.filter((s) => s.disponivel).length;

                return (
                  <div
                    key={dia}
                    className={`border-r border-b last:border-r-0 min-h-[60px] p-1 cursor-pointer transition-colors ${
                      selecionado ? 'bg-primary/10 ring-2 ring-primary' : 'hover:bg-muted/50'
                    } ${statusColors[status] === 'bg-white' ? '' : statusColors[status] + '/30'}`}
                    onClick={() => setDiaSelecionado(selecionado ? null : dataISO)}
                  >
                    <p className="text-xs font-medium">{dia}</p>
                    {diaSlots.length > 0 && (
                      <p className="text-[10px] text-muted-foreground">
                        {disponiveisCount}/{diaSlots.length}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {diaSelecionado && (
            <div className="border rounded-md p-3 space-y-2">
              <p className="text-sm font-medium">
                {diaSelecionado.split('-').reverse().join('/')}
              </p>
              {slotsDoDia(diaSelecionado).length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum horário neste dia.</p>
              ) : (
                <div className="space-y-1">
                  {slotsDoDia(diaSelecionado).map((slot, i) => (
                    <div key={i} className={`flex items-center justify-between text-sm px-2 py-1 rounded ${!slot.disponivel ? 'opacity-50' : ''}`}>
                      <span>{slot.horaInicio} - {slot.horaFim}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {slot.capacidade === 0 ? 'Ilimitado' : `${slot.ocupados}/${slot.capacidade}`}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${slot.disponivel ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                          {slot.disponivel ? 'Disponível' : 'Lotado'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
