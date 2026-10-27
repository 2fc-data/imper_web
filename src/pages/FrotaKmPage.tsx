import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
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
  atualizarRegistroKm,
  listarRegistrosKm,
  listarVeiculos,
  registrarKm,
  type RegistroKmInput,
  type RegistroKmItem,
  type VeiculoItem,
} from '../lib/api';
import { listarColaboradores } from '../lib/api/lookups';
import { formatarData } from '../lib/datetime';
import { formatarKm, parseKm } from '../lib/km';
import { gerarPdfKmMensal } from '../lib/export/km-mensal-pdf';
import { selectClasses } from '../components/ui/form-classes';

const MESES_CURTOS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

function dataMes(r: RegistroKmItem): number {
  return new Date(r.data).getMonth() + 1;
}

export default function FrotaKmPage() {
  const [veiculos, setVeiculos] = useState<VeiculoItem[]>([]);
  const [colaboradores, setColaboradores] = useState<{ id: number; nome: string }[]>([]);
  const [veiculoId, setVeiculoId] = useState<number | ''>('');
  const [registros, setRegistros] = useState<RegistroKmItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<RegistroKmInput>({ odometro: 0, observacao: '' });
  const hoje = new Date();
  const [mesAtual, setMesAtual] = useState(hoje.getMonth() + 1);
  const [anoAtual] = useState(hoje.getFullYear());

  // Edição inline
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editandoOdometro, setEditandoOdometro] = useState('');
  const [editandoColaboradorId, setEditandoColaboradorId] = useState<number | ''>('');
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  const carregarVeiculos = useCallback(async () => {
    setError(null);
    try {
      const lista = await listarVeiculos();
      setVeiculos(lista.filter((v) => v.ativo));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar veículos');
    }
  }, []);

  const carregarColaboradores = useCallback(async () => {
    try {
      const lista = await listarColaboradores();
      setColaboradores(lista);
    } catch {
      // silencioso — select fica vazio
    }
  }, []);

  useEffect(() => {
    carregarVeiculos();
    carregarColaboradores();
  }, [carregarVeiculos, carregarColaboradores]);

  const carregarRegistros = useCallback(
    async (veiculo: number, mes: number, ano: number) => {
      try {
        const lista = await listarRegistrosKm(veiculo, { mes, ano });
        setRegistros(lista);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao carregar registros');
      }
    },
    [],
  );

  useEffect(() => {
    if (veiculoId === '') {
      setRegistros([]);
      return;
    }
    let cancelado = false;
    (async () => {
      try {
        const lista = await listarRegistrosKm(veiculoId, { mes: mesAtual, ano: anoAtual });
        if (!cancelado) setRegistros(lista);
      } catch (err) {
        if (!cancelado) setError(err instanceof Error ? err.message : 'Falha ao carregar registros');
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [veiculoId, mesAtual, anoAtual]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (veiculoId === '') return;
    setSaving(true);
    setError(null);
    try {
      await registrarKm(veiculoId, {
        odometro: form.odometro,
        observacao: form.observacao || undefined,
        colaboradorId: form.colaboradorId || undefined,
      });
      await carregarRegistros(veiculoId, mesAtual, anoAtual);
      setForm({ odometro: 0, observacao: '', colaboradorId: undefined });
      const veiculo = await listarVeiculos();
      setVeiculos(veiculo.filter((v) => v.ativo));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao registrar km');
    } finally {
      setSaving(false);
    }
  }

  async function handleSalvarEdicao(id: number) {
    setSalvandoEdicao(true);
    setError(null);
    try {
      const odometro = parseKm(editandoOdometro);
      if (odometro === undefined) {
        setError('Valor de odômetro inválido');
        return;
      }
      await atualizarRegistroKm(id, {
        odometro,
        ...(editandoColaboradorId !== '' && { colaboradorId: editandoColaboradorId }),
      });
      if (veiculoId !== '') {
        await carregarRegistros(veiculoId, mesAtual, anoAtual);
      }
      const veiculo = await listarVeiculos();
      setVeiculos(veiculo.filter((v) => v.ativo));
      setEditandoId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao editar registro');
    } finally {
      setSalvandoEdicao(false);
    }
  }

  function iniciarEdicao(r: RegistroKmItem) {
    setEditandoId(r.id);
    setEditandoOdometro(formatarKm(r.odometro));
    setEditandoColaboradorId(r.colaboradorId ?? '');
  }

  const veiculoSelecionado = veiculoId === '' ? null : veiculos.find((v) => v.id === veiculoId) ?? null;

  const registrosOrdenados = useMemo(
    () => [...registros].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()),
    [registros],
  );

  function handleExportarPdf() {
    if (!veiculoSelecionado || registros.length === 0) return;
    gerarPdfKmMensal({
      veiculoNome: veiculoSelecionado.nome,
      veiculoPlaca: veiculoSelecionado.placa,
      mes: mesAtual,
      ano: anoAtual,
      odometroAtual: veiculoSelecionado.odometroAtual,
      linhas: registrosOrdenados.map((r) => ({
        data: r.data,
        kmAnterior: Number(r.odometro) - Number(r.kmPercorrido),
        kmAtual: r.odometro,
        kmDoDia: r.kmPercorrido,
        observacao: r.observacao,
        colaborador: r.colaborador?.nome ?? null,
      })),
    });
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Km Diário</h1>
        <p className="text-sm text-muted-foreground">
          Informe a leitura do odômetro ao final do dia. O sistema calcula a quilometragem percorrida.
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
                {v.nome} — {v.placa} ({formatarKm(v.odometroAtual)} km)
              </option>
            ))}
          </select>
        </div>
        {veiculoSelecionado && (
          <div className="rounded-lg border bg-card px-4 py-2 text-sm">
            <span className="text-muted-foreground">Odômetro atual: </span>
            <span className="font-semibold">{formatarKm(veiculoSelecionado.odometroAtual)} km</span>
          </div>
        )}
      </div>

      {veiculoId !== '' && veiculoSelecionado && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Registrar KM</CardTitle>
            <CardDescription>Informe a leitura do odômetro ao final do dia.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="odometro">Odômetro</Label>
                  <Input
                    id="odometro"
                    inputMode="numeric"
                    required
                    placeholder={formatarKm(veiculoSelecionado.odometroAtual)}
                    value={form.odometro ? formatarKm(form.odometro) : ''}
                    onChange={(e) => setForm({ ...form, odometro: parseKm(e.target.value) ?? 0 })}
                  />
                  {form.odometro > 0 && form.odometro > Number(veiculoSelecionado.odometroAtual) && (
                    <p className="text-xs text-muted-foreground">
                      KM rodados: {formatarKm(form.odometro - Number(veiculoSelecionado.odometroAtual))}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="colaboradorId">Colaborador</Label>
                  <select
                    id="colaboradorId"
                    value={form.colaboradorId ?? ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        colaboradorId: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className={selectClasses}
                  >
                    <option value="">Nenhum</option>
                    {colaboradores.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
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
              <Button
                type="submit"
                disabled={saving || !form.odometro || form.odometro <= Number(veiculoSelecionado.odometroAtual)}
              >
                {saving ? 'Salvando...' : 'Registrar KM'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {veiculoId !== '' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Registros de KM</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={registros.length === 0}
              onClick={handleExportarPdf}
            >
              Exportar PDF
            </Button>
          </div>

          {/* Abas Jan–Dez */}
          <div className="flex flex-wrap gap-1">
            {MESES_CURTOS.map((nome, i) => {
              const mes = i + 1;
              const ativo = mes === mesAtual;
              return (
                <button
                  key={nome}
                  type="button"
                  onClick={() => setMesAtual(mes)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    ativo
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/70'
                  }`}
                >
                  {nome}
                </button>
              );
            })}
            <span className="ml-2 self-center text-sm text-muted-foreground">{anoAtual}</span>
          </div>

          {registros.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum registro de KM para este veículo neste mês.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2">Data</th>
                    <th className="px-3 py-2 text-right">KM Anterior</th>
                    <th className="px-3 py-2 text-right">KM Atual</th>
                    <th className="px-3 py-2 text-right">KM do Dia</th>
                    <th className="px-3 py-2">Colaborador</th>
                    <th className="px-3 py-2">Observação</th>
                    <th className="px-3 py-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {registrosOrdenados.map((r) => {
                    const kmAnterior = Number(r.odometro) - Number(r.kmPercorrido);
                    const emEdicao = editandoId === r.id;
                    const odometroEditado = parseKm(editandoOdometro);
                    const kmDoDiaPreview =
                      emEdicao && odometroEditado !== undefined && odometroEditado > kmAnterior
                        ? odometroEditado - kmAnterior
                        : null;
                    return (
                      <tr key={r.id} className="border-b last:border-b-0 hover:bg-muted/30">
                        <td className="px-3 py-2 font-medium">{formatarData(r.data)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatarKm(kmAnterior)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {emEdicao ? (
                            <div className="flex items-center justify-end gap-2">
                              <Input
                                inputMode="numeric"
                                className="h-8 w-28 text-right"
                                value={editandoOdometro}
                                onChange={(e) => setEditandoOdometro(e.target.value)}
                              />
                            </div>
                          ) : (
                            formatarKm(r.odometro)
                          )}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {emEdicao ? (
                            kmDoDiaPreview !== null ? formatarKm(kmDoDiaPreview) : '—'
                          ) : (
                            formatarKm(r.kmPercorrido)
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {emEdicao ? (
                            <select
                              className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
                              value={editandoColaboradorId}
                              onChange={(e) =>
                                setEditandoColaboradorId(e.target.value ? Number(e.target.value) : '')
                              }
                            >
                              <option value="">Nenhum</option>
                              {colaboradores.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.nome}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-muted-foreground">{r.colaborador?.nome ?? '—'}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {emEdicao ? (
                            <span className="text-xs">
                              {kmDoDiaPreview !== null ? `KM rodados: ${formatarKm(kmDoDiaPreview)}` : ''}
                            </span>
                          ) : (
                            r.observacao ?? '—'
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {emEdicao ? (
                            <div className="flex justify-end gap-1">
                              <Button
                                type="button"
                                size="sm"
                                disabled={salvandoEdicao}
                                onClick={() => handleSalvarEdicao(r.id)}
                              >
                                {salvandoEdicao ? '...' : 'Salvar'}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditandoId(null)}
                              >
                                Cancelar
                              </Button>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => iniciarEdicao(r)}
                            >
                              Editar
                            </Button>
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
      )}
    </div>
  );
}
