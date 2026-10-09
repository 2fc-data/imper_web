import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  excluirRegistroKm,
  listarRegistrosKm,
  listarVeiculos,
  registrarKm,
  type RegistroKmInput,
  type RegistroKmItem,
  type VeiculoItem,
} from '../lib/api';
import { formatarData } from '../lib/datetime';

const selectClasses =
  'flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

export default function FrotaKmPage() {
  const [veiculos, setVeiculos] = useState<VeiculoItem[]>([]);
  const [veiculoId, setVeiculoId] = useState<number | ''>('');
  const [registros, setRegistros] = useState<RegistroKmItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<RegistroKmInput>({ kmPercorrido: 0, observacao: '' });
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<number | null>(null);
  const [excluindo, setExcluindo] = useState<number | null>(null);

  const carregarVeiculos = useCallback(async () => {
    setError(null);
    try {
      const lista = await listarVeiculos();
      setVeiculos(lista.filter((v) => v.ativo));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar veículos');
    }
  }, []);

  useEffect(() => {
    carregarVeiculos();
  }, [carregarVeiculos]);

  useEffect(() => {
    if (veiculoId === '') {
      setRegistros([]);
      return;
    }
    let cancelado = false;
    (async () => {
      try {
        const lista = await listarRegistrosKm(veiculoId);
        if (!cancelado) setRegistros(lista);
      } catch (err) {
        if (!cancelado) setError(err instanceof Error ? err.message : 'Falha ao carregar registros');
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [veiculoId]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (veiculoId === '') return;
    setSaving(true);
    setError(null);
    try {
      const criado = await registrarKm(veiculoId, {
        kmPercorrido: form.kmPercorrido,
        observacao: form.observacao || undefined,
      });
      setRegistros((prev) => [criado, ...prev]);
      setForm({ kmPercorrido: 0, observacao: '' });
      const veiculo = await listarVeiculos();
      setVeiculos(veiculo.filter((v) => v.ativo));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao registrar km');
    } finally {
      setSaving(false);
    }
  }

  async function handleExcluir(id: number) {
    setExcluindo(id);
    setError(null);
    try {
      await excluirRegistroKm(id);
      setRegistros((prev) => prev.filter((x) => x.id !== id));
      setConfirmandoExclusao(null);
      const veiculo = await listarVeiculos();
      setVeiculos(veiculo.filter((v) => v.ativo));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao excluir registro');
    } finally {
      setExcluindo(null);
    }
  }

  const veiculoSelecionado = veiculoId === '' ? null : veiculos.find((v) => v.id === veiculoId) ?? null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Km Diário</h1>
        <p className="text-sm text-muted-foreground">
          Registre a quilometragem diária por veículo. A data padrão é ontem (ou última sexta se ontem for fim de semana).
        </p>
      </header>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="space-y-1.5 flex-1">
          <Label htmlFor="veiculoId">Veículo</Label>
          <select
            id="veiculoId"
            value={veiculoId}
            onChange={(e) => setVeiculoId(e.target.value ? Number(e.target.value) : '')}
            className={selectClasses}
          >
            <option value="">Selecione o veículo...</option>
            {veiculos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.codigo} — {v.placa} ({v.odometroAtual.toLocaleString('pt-BR')} km)
              </option>
            ))}
          </select>
        </div>
        {veiculoSelecionado && (
          <div className="rounded-lg border bg-card px-4 py-2 text-sm">
            <span className="text-muted-foreground">Odômetro atual: </span>
            <span className="font-semibold">{veiculoSelecionado.odometroAtual.toLocaleString('pt-BR')} km</span>
          </div>
        )}
      </div>

      {veiculoId !== '' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Registrar KM</CardTitle>
            <CardDescription>Informe os km percorridos desde o último registro.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="kmPercorrido">KM percorridos</Label>
                  <Input
                    id="kmPercorrido"
                    type="number"
                    min={0.1}
                    step="0.1"
                    required
                    value={form.kmPercorrido || ''}
                    onChange={(e) => setForm({ ...form, kmPercorrido: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="observacao">Observação (opcional)</Label>
                  <Input
                    id="observacao"
                    value={form.observacao ?? ''}
                    onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? 'Salvando...' : 'Registrar KM'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {veiculoId !== '' && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Registros de KM</h2>
          {registros.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhum registro de KM para este veículo.</p>
          ) : (
            <div className="space-y-2">
              {registros.map((r) => (
                <Card key={r.id}>
                  <CardContent className="py-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm">
                      <span className="font-medium">{formatarData(r.data)}</span>
                      <span className="ml-2 text-muted-foreground">
                        {r.kmPercorrido.toLocaleString('pt-BR')} km · Odômetro: {r.odometro.toLocaleString('pt-BR')} km
                      </span>
                      {r.observacao && <span className="ml-2 text-muted-foreground">· {r.observacao}</span>}
                      {r.registradoPor && (
                        <span className="ml-2 text-xs text-muted-foreground">· por {r.registradoPor.nome}</span>
                      )}
                    </div>
                    {confirmandoExclusao === r.id ? (
                      <div className="flex gap-2">
                        <Button type="button" variant="destructive" size="sm" disabled={excluindo === r.id} onClick={() => handleExcluir(r.id)}>
                          {excluindo === r.id ? 'Excluindo...' : 'Confirmar'}
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmandoExclusao(null)}>Cancelar</Button>
                      </div>
                    ) : (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmandoExclusao(r.id)}>Excluir</Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
