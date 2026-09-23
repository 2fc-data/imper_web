import { useState, useImperativeHandle, forwardRef } from 'react';
import { CepInput, type CepDados } from '../ui/cep-input';
import { SlotPicker } from '../disponibilidade/SlotPicker';

export interface AgendarDados {
  cep: string;
  endereco: string;
  bairro: string;
  cidade: string;
  estado: string;
  numero: string;
  complemento: string;
  slotIso: string;
}

export interface AgendarVisitaHandle {
  getDados: () => AgendarDados | null;
  isValid: () => boolean;
}

interface AgendarVisitaProps {
  disabled?: boolean;
  titulo?: string;
}

const campoInput =
  'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';
const campoLabel = 'text-xs font-semibold text-foreground';

export const AgendarVisita = forwardRef<AgendarVisitaHandle, AgendarVisitaProps>(
  function AgendarVisita({ disabled = false, titulo = 'Horários Disponíveis' }, ref) {
    const [agendar, setAgendar] = useState(false);
    const [agendarSlot, setAgendarSlot] = useState('');
    const [cep, setCep] = useState('');
    const [endereco, setEndereco] = useState('');
    const [bairro, setBairro] = useState('');
    const [cidade, setCidade] = useState('');
    const [estado, setEstado] = useState('');
    const [numero, setNumero] = useState('');
    const [complemento, setComplemento] = useState('');
    const [cepValido, setCepValido] = useState(false);

    useImperativeHandle(ref, () => ({
      getDados: () => {
        const result = { cep, endereco, bairro, cidade, estado, numero, complemento, slotIso: agendarSlot };
        console.log('[AgendarVisita] getDados called:', { agendar, agendarSlot, cepValido, result });
        if (!agendar || !agendarSlot || !cepValido) return null;
        return result;
      },
      isValid: () => {
        const valid = agendar && !!agendarSlot && cepValido;
        console.log('[AgendarVisita] isValid called:', { agendar, agendarSlot, cepValido, valid });
        return valid;
      },
    }));

    function handleCheckboxChange(checked: boolean) {
      setAgendar(checked);
      if (!checked) {
        setAgendarSlot('');
        setCep('');
        setEndereco('');
        setBairro('');
        setCidade('');
        setEstado('');
        setNumero('');
        setComplemento('');
        setCepValido(false);
      }
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="agendar-visita-checkbox"
            checked={agendar}
            onChange={(e) => handleCheckboxChange(e.target.checked)}
            disabled={disabled}
            className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
          />
          <label
            htmlFor="agendar-visita-checkbox"
            className="text-sm font-medium text-foreground cursor-pointer select-none"
          >
            Agendar visita técnica
          </label>
        </div>

        {agendar && (
          <div className="space-y-1.5">
            <label className={campoLabel}>CEP (Local da visita técnica)</label>
            <CepInput
              value={cep}
              onChange={setCep}
              onConsulta={(dados: CepDados) => {
                console.log('[AgendarVisita] onConsulta fired:', dados);
                setEndereco(dados.logradouro);
                setBairro(dados.bairro);
                setCidade(dados.cidade);
                setEstado(dados.estado);
                setCepValido(true);
              }}
              onErro={() => setCepValido(false)}
            />
            <p className="text-xs text-muted-foreground">
              Ao informar o CEP, preenchemos endereço, bairro, cidade e UF
              automaticamente.
            </p>
          </div>
        )}

        {cepValido && (
          <>
            <div className="space-y-1.5">
              <label className={campoLabel}>Endereço</label>
              <input
                type="text"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                className={campoInput}
                placeholder="Rua, avenida..."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_1fr_120px]">
              <div className="space-y-1.5">
                <label className={campoLabel}>Bairro</label>
                <input
                  type="text"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  className={campoInput}
                  placeholder="Bairro"
                />
              </div>
              <div className="space-y-1.5">
                <label className={campoLabel}>Cidade</label>
                <input
                  type="text"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className={campoInput}
                  placeholder="Cidade"
                />
              </div>
              <div className="space-y-1.5">
                <label className={campoLabel}>UF</label>
                <input
                  type="text"
                  maxLength={2}
                  value={estado}
                  onChange={(e) => setEstado(e.target.value.toUpperCase())}
                  className={campoInput}
                  placeholder="UF"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className={campoLabel}>Número</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className={campoInput}
                  placeholder="Número"
                />
              </div>
              <div className="space-y-1.5">
                <label className={campoLabel}>Complemento</label>
                <input
                  type="text"
                  value={complemento}
                  onChange={(e) => setComplemento(e.target.value)}
                  className={campoInput}
                  placeholder="Apto, bloco..."
                />
              </div>
            </div>
          </>
        )}

        {agendar && (
          <div className="space-y-1.5 rounded-lg border bg-muted/30 p-4">
            <label className={campoLabel}>{titulo}</label>
            <p className="text-xs text-muted-foreground mb-2">
              Selecione uma data e horário disponível para a visita técnica.
            </p>
            <SlotPicker
              value={agendarSlot}
              onChange={setAgendarSlot}
              disabled={disabled}
            />
            {agendarSlot && (
              <p className="text-xs text-success font-medium mt-2">
                ✓ Agendamento selecionado: {new Date(agendarSlot).toLocaleString('pt-BR')}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);
