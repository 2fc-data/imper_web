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
  atualizarAbastecimento,
  criarAbastecimento,
  type AbastecimentoInput,
  type AbastecimentoItem,
  excluirAbastecimento,
  listarAbastecimentos,
  listarVeiculos,
  type VeiculoItem,
} from '../lib/api';
import { formatarData, formatarValor } from '../lib/datetime';

const selectClasses =
  'flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

const emptyForm: AbastecimentoInput = {
  veiculoId: 0,
  litros: 0,
  valorTotal: 0,
  odometro: undefined,
};

export default function AbastecimentosPage() {
  const [veiculos, setVeiculos] = useState<VeiculoItem[]>([]);
  const [abastecimentos, setAbastecimentos] = useState<AbastecimentoItem[]>([]);
  const [veiculoFiltro, setVeiculoFiltro] = useState<number | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editando, setEditando] = useState<AbastecimentoItem | null>(null);
  const [form, setForm] = useState<AbastecimentoInput>(emptyForm);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<number | null>(null);
  const [excluindo, setExcluindo] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    setError(null);
    try {
      const [veics, abasts] = await Promise.all([
        listarVeiculos(),
        veiculoFiltro === '' ? listarAbastecimentos() : listarAbastecimentos({ veiculoId: veiculoFiltro }),
      ]);
      setVeiculos(veics.filter((v) => v.ativo));
      setAbastecimentos(abasts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar abastecimentos');
    }
  }, [veiculoFiltro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function comecarEdicao(a: AbastecimentoItem) {
    setEditando(a);
    setForm({
      veiculoId: a.veiculoId,
      litros: a.litros,
      valorTotal: a.valorTotal,
      odometro: a.odometro,
    });
    setError(null);
  }

  function cancelarEdicao() {
    setEditando(null);
    setForm(emptyForm);
    setError(null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload: AbastecimentoInput = {
        veiculoId: form.veiculoId || 0,
        litros: form.litros,
        valorTotal: form.valorTotal,
        odometro: form.odometro,
      };
      if (editando) {
        const atualizado = await atualizarAbastecimento(editando.id, payload);
        setAbastecimentos((prev) => prev.map((x) => (x.id === atualizado.id ? atualizado : x)));
        cancelarEdicao();
      } else {
        const criado = await criarAbastecimento(payload);
        setAbastecimentos((prev) => [criado, ...prev]);
        cancelarEdicao();
      }
      const veics = await listarVeiculos();
      setVeiculos(veics.filter((v) => v.ativo));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar abastecimento');
    } finally {
      setSaving(false);
    }
  }

  async function handleExcluir(id: number) {
    setExcluindo(id);
    setError(null);
    try {
      await excluirAbastecimento(id);
      setAbastecimentos((prev) => prev.filter((x) => x.id !== id));
      setConfirmandoExclusao(null);
      const veics = await listarVeiculos();
      setVeiculos(veics.filter((v) => v.ativo));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao excluir abastecimento');
    } finally {
      setExcluindo(null);
    }
  }

  const precoLitroCalculado =
    form.litros > 0 && form.valorTotal > 0 ? form.valorTotal / form.litros : null;

  const formulario = (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{editando ? 'Editar abastecimento' : 'Novo abastecimento'}</CardTitle>
        <CardDescription>
          Preço por litro e km/litro são calculados automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="veiculoId">Veículo</Label>
              <select
                id="veiculoId"
                required
                value={form.veiculoId || ''}
                onChange={(e) => setForm({ ...form, veiculoId: Number(e.target.value) })}
                className={selectClasses}
              >
                <option value="" disabled>Selecione o veículo...</option>
                {veiculos.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.codigo} — {v.placa}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="odometro">Odômetro (km) — opcional</Label>
              <Input
                id="odometro"
                type="number"
                min={0}
                step="0.1"
                placeholder="Usa odômetro atual se vazio"
                value={form.odometro ?? ''}
                onChange={(e) => setForm({ ...form, odometro: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="litros">Litros</Label>
              <Input
                id="litros"
                type="number"
                min={0.01}
                step="0.01"
                required
                value={form.litros || ''}
                onChange={(e) => setForm({ ...form, litros: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="valorTotal">Valor total (R$)</Label>
              <Input
                id="valorTotal"
                type="number"
                min={0.01}
                step="0.01"
                required
                value={form.valorTotal || ''}
                onChange={(e) => setForm({ ...form, valorTotal: Number(e.target.value) })}
              />
            </div>
          </div>
          {precoLitroCalculado !== null && (
            <p className="text-sm text-muted-foreground">
              Preço por litro calculado: <span className="font-medium">{formatarValor(precoLitroCalculado)}</span>
            </p>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : editando ? 'Salvar alterações' : 'Cadastrar'}
            </Button>
            {editando && (
              <Button type="button" variant="outline" onClick={cancelarEdicao}>Cancelar</Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Abastecimentos</h1>
        <p className="text-sm text-muted-foreground">Registro de abastecimentos da frota.</p>
      </header>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      {(editando || true) && formulario}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="space-y-1.5 flex-1">
          <Label htmlFor="veiculoFiltro">Filtrar por veículo</Label>
          <select
            id="veiculoFiltro"
            value={veiculoFiltro}
            onChange={(e) => setVeiculoFiltro(e.target.value ? Number(e.target.value) : '')}
            className={selectClasses}
          >
            <option value="">Todos os veículos</option>
            {veiculos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.codigo} — {v.placa}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Histórico</h2>
        {abastecimentos.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhum abastecimento registrado.</p>
        ) : (
          <div className="space-y-2">
            {abastecimentos.map((a) => (
              <Card key={a.id}>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-base">
                      {a.veiculo ? `${a.veiculo.codigo} — ${a.veiculo.placa}` : `Veículo #${a.veiculoId}`}
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">{formatarData(a.data)}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    <span>{a.litros.toFixed(2)} L · {formatarValor(a.valorTotal)}</span>
                    <span> · R$/L: {formatarValor(a.precoLitro)}</span>
                    {a.kmDesdeUltimo != null && (
                      <span> · {a.kmDesdeUltimo.toLocaleString('pt-BR')} km desde último</span>
                    )}
                    {a.kmPorLitro != null && (
                      <span> · {a.kmPorLitro.toFixed(2)} km/L</span>
                    )}
                    <span> · Odômetro: {a.odometro.toLocaleString('pt-BR')} km</span>
                    {a.fornecedor && <span> · {a.fornecedor.nome}</span>}
                    {a.registradoPor && (
                      <span className="text-xs"> · por {a.registradoPor.nome}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => comecarEdicao(a)}>Editar</Button>
                    {confirmandoExclusao === a.id ? (
                      <>
                        <Button type="button" variant="destructive" size="sm" disabled={excluindo === a.id} onClick={() => handleExcluir(a.id)}>
                          {excluindo === a.id ? 'Excluindo...' : 'Confirmar exclusão'}
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmandoExclusao(null)}>Cancelar</Button>
                      </>
                    ) : (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmandoExclusao(a.id)}>Excluir</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
