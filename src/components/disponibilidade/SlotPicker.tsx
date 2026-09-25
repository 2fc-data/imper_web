import { useState, useEffect } from 'react';
import { apiObterSlots, type DisponibilidadeSlot } from '../../lib/api';

const DIAS_SEMANA_CURTO = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface SlotPickerProps {
  value: string;
  onChange: (isoDatetime: string) => void;
  className?: string;
  disabled?: boolean;
  erro?: string | null;
}

function formatarDataBR(data: string): string {
  const [ano, mes, dia] = data.split('-');
  const d = new Date(Number(ano), Number(mes) - 1, Number(dia));
  const diaSemana = DIAS_SEMANA_CURTO[d.getDay()];
  return `${diaSemana}, ${dia}/${mes}/${ano}`;
}

export function SlotPicker({ value, onChange, className, disabled, erro }: SlotPickerProps) {
  const now = new Date();
  const [mesAtual, setMesAtual] = useState(now.getMonth() + 1);
  const [anoAtual, setAnoAtual] = useState(now.getFullYear());
  const [slots, setSlots] = useState<DisponibilidadeSlot[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erroFetch, setErroFetch] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErroFetch(null);

    apiObterSlots(mesAtual, anoAtual)
      .then((res) => {
        if (!cancelado) setSlots(res.slots);
      })
      .catch((err) => {
        if (!cancelado) setErroFetch(err?.message || 'Erro ao carregar horários');
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => { cancelado = true; };
  }, [mesAtual, anoAtual]);

  const slotsPorData = slots.reduce<Record<string, DisponibilidadeSlot[]>>((acc, slot) => {
    if (!acc[slot.data]) acc[slot.data] = [];
    acc[slot.data].push(slot);
    return acc;
  }, {});

  const datasOrdenadas = Object.keys(slotsPorData).sort();

  function voltarMes() {
    if (mesAtual === 1) {
      setMesAtual(12);
      setAnoAtual(anoAtual - 1);
    } else {
      setMesAtual(mesAtual - 1);
    }
  }

  function avancarMes() {
    if (mesAtual === 12) {
      setMesAtual(1);
      setAnoAtual(anoAtual + 1);
    } else {
      setMesAtual(mesAtual + 1);
    }
  }

  function selecionarSlot(slot: DisponibilidadeSlot) {
    const iso = `${slot.data}T${slot.horaInicio}:00`;
    onChange(iso);
  }

  const valorSelecionado = value || '';

  const MESES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={voltarMes}
          disabled={disabled}
          className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          &larr; Anterior
        </button>
        <span className="text-sm font-medium">
          {MESES[mesAtual - 1]} {anoAtual}
        </span>
        <button
          type="button"
          onClick={avancarMes}
          disabled={disabled}
          className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          Próximo &rarr;
        </button>
      </div>

      {carregando && (
        <p className="text-sm text-muted-foreground text-center py-4">Carregando horários...</p>
      )}
      {erroFetch && (
        <p className="text-sm text-destructive text-center py-4">{erroFetch}</p>
      )}

      {!carregando && !erroFetch && datasOrdenadas.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhum horário cadastrado neste mês.
        </p>
      )}

      {!carregando && !erroFetch && (
        <div className="max-h-64 overflow-y-auto border rounded-md divide-y">
          {datasOrdenadas.map((data) => (
            <div key={data} className="p-2">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {formatarDataBR(data)}
              </p>
              <div className="flex flex-wrap gap-1">
                {slotsPorData[data].map((slot) => {
                  const slotIso = `${slot.data}T${slot.horaInicio}:00`;
                  const selecionado = valorSelecionado === slotIso;
                  const disponivel = slot.disponivel;
                  const vagas = slot.capacidade > 0 ? slot.capacidade - slot.ocupados : null;

                  return (
                    <button
                      key={`${slot.data}-${slot.horaInicio}`}
                      type="button"
                      disabled={disabled || !disponivel}
                      onClick={() => disponivel && selecionarSlot(slot)}
                      title={!disponivel ? 'Horário lotado' : undefined}
                      className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                        !disponivel
                          ? 'bg-muted/60 text-muted-foreground border-border/80 cursor-not-allowed opacity-75'
                          : selecionado
                          ? 'bg-primary text-primary-foreground border-primary font-medium'
                          : 'bg-background hover:bg-muted border-border text-foreground'
                      }`}
                    >
                      {slot.horaInicio}-{slot.horaFim}
                      {!disponivel ? (
                        <span className="ml-1.5 text-[10px] font-semibold text-destructive/90">(Lotado)</span>
                      ) : vagas !== null ? (
                        <span className="ml-1 opacity-70">({vagas}v)</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {erro && <p className="text-xs text-destructive mt-1">{erro}</p>}
    </div>
  );
}
