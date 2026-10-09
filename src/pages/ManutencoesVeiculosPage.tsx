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
  atualizarManutencaoVeiculo,
  criarManutencaoVeiculo,
  excluirManutencaoVeiculo,
  buscarManutencoesVeiculosLookups,
  type ManutencaoVeiculoInput,
  type ManutencaoVeiculoItem,
  listarManutencoesVeiculos,
  type ManutencoesVeiculosLookups,
} from '../lib/api';
import { formatarData, formatarValor, fromLocalDateTime, toLocalDateTime } from '../lib/datetime';
import { cn } from '../lib/utils';

const selectClasses =
  'flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

const textareaClasses =
  'flex min-h-[110px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

const STATUS_LABEL: Record<string, string> = {
  PENDENTE: 'Pendente',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

function BadgeStatus({ status }: { status: string }) {
  const classes: Record<string, string> = {
    PENDENTE: 'bg-amber-500/10 text-amber-600',
    EM_ANDAMENTO: 'bg-sky-500/10 text-sky-600',
    CONCLUIDA: 'bg-emerald-500/10 text-emerald-600',
    CANCELADA: 'bg-muted text-muted-foreground',
  };
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', classes[status] ?? 'bg-muted')}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

const emptyForm: ManutencaoVeiculoInput = {
  veiculoId: 0,
  tipoId: 0,
  data: '',
  descricao: '',
  local: '',
  custoPecas: undefined,
  custoMaoDeObra: undefined,
  proximaManutencao: '',
  status: 'PENDENTE',
  responsavelManutencaoId: undefined,
};

export default function ManutencoesVeiculosPage() {
  const [manutencoes, setManutencoes] = useState<ManutencaoVeiculoItem[]>([]);
  const [lookups, setLookups] = useState<ManutencoesVeiculosLookups | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [busca, setBusca] = useState('');
  const [saving, setSaving] = useState(false);
  const [editando, setEditando] = useState<ManutencaoVeiculoItem | null>(null);
  const [form, setForm] = useState<ManutencaoVeiculoInput>(emptyForm);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<number | null>(null);
  const [excluindo, setExcluindo] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    setError(null);
    try {
      const [lista, lk] = await Promise.all([
        listarManutencoesVeiculos(),
        buscarManutencoesVeiculosLookups(),
      ]);
      setManutencoes(lista);
      setLookups(lk);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar manutenções');
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function comecarEdicao(m: ManutencaoVeiculoItem) {
    setEditando(m);
    setForm({
      veiculoId: m.veiculoId,
      tipoId: m.tipoId,
      data: toLocalDateTime(m.data),
      descricao: m.descricao,
      local: m.local ?? undefined,
      custoPecas: m.custoPecas,
      custoMaoDeObra: m.custoMaoDeObra,
      proximaManutencao: toLocalDateTime(m.proximaManutencao),
      status: m.status,
      responsavelManutencaoId: m.responsavelManutencaoId ?? undefined,
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
      const payload: ManutencaoVeiculoInput = {
        veiculoId: form.veiculoId || 0,
        tipoId: form.tipoId || 0,
        data: fromLocalDateTime(form.data) ?? new Date().toISOString(),
        descricao: form.descricao,
        local: form.local || undefined,
        custoPecas: form.custoPecas,
        custoMaoDeObra: form.custoMaoDeObra,
        proximaManutencao: form.proximaManutencao ? fromLocalDateTime(form.proximaManutencao) : undefined,
        status: form.status,
        responsavelManutencaoId: form.responsavelManutencaoId,
      };
      if (editando) {
        const atualizado = await atualizarManutencaoVeiculo(editando.id, payload);
        setManutencoes((prev) => prev.map((x) => (x.id === atualizado.id ? atualizado : x)));
        cancelarEdicao();
      } else {
        const criado = await criarManutencaoVeiculo(payload);
        setManutencoes((prev) => [criado, ...prev]);
        cancelarEdicao();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar manutenção');
    } finally {
      setSaving(false);
    }
  }

  async function handleMudarStatus(m: ManutencaoVeiculoItem, status: string) {
    setError(null);
    try {
      const atualizado = await atualizarManutencaoVeiculo(m.id, { status });
      setManutencoes((prev) => prev.map((x) => (x.id === atualizado.id ? atualizado : x)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar status');
    }
  }

  async function handleExcluir(id: number) {
    setExcluindo(id);
    setError(null);
    try {
      await excluirManutencaoVeiculo(id);
      setManutencoes((prev) => prev.filter((x) => x.id !== id));
      setConfirmandoExclusao(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao excluir manutenção');
    } finally {
      setExcluindo(null);
    }
  }

  const filtradas = manutencoes.filter((m) => {
    if (filtroStatus && m.status !== filtroStatus) return false;
    const texto = busca.trim().toLowerCase();
    if (!texto) return true;
    return [
      m.descricao,
      m.veiculo?.codigo,
      m.veiculo?.placa,
      m.tipo?.nome,
      m.local,
      m.responsavelManutencao?.nome,
    ]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(texto));
  });

  const custoTotalCalculado = (form.custoPecas ?? 0) + (form.custoMaoDeObra ?? 0);

  const formulario = (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{editando ? 'Editar manutenção' : 'Nova manutenção'}</CardTitle>
        <CardDescription>Registre uma manutenção de veículo.</CardDescription>
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
                {(lookups?.veiculos ?? []).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.codigo} — {v.placa}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tipoId">Tipo de manutenção</Label>
              <select
                id="tipoId"
                required
                value={form.tipoId || ''}
                onChange={(e) => setForm({ ...form, tipoId: Number(e.target.value) })}
                className={selectClasses}
              >
                <option value="" disabled>Selecione o tipo...</option>
                {(lookups?.tiposManutencao ?? []).filter((t) => t.ativo).map((t) => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="datetime-local"
                required
                value={form.data}
                onChange={(e) => setForm({ ...form, data: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={form.status ?? 'PENDENTE'}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className={selectClasses}
              >
                {Object.entries(STATUS_LABEL).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="custoPecas">Custo peças (R$)</Label>
              <Input
                id="custoPecas"
                type="number"
                min={0}
                step="0.01"
                placeholder="0,00"
                value={form.custoPecas ?? ''}
                onChange={(e) => setForm({ ...form, custoPecas: e.target.value === '' ? undefined : Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="custoMaoDeObra">Custo mão de obra (R$)</Label>
              <Input
                id="custoMaoDeObra"
                type="number"
                min={0}
                step="0.01"
                placeholder="0,00"
                value={form.custoMaoDeObra ?? ''}
                onChange={(e) => setForm({ ...form, custoMaoDeObra: e.target.value === '' ? undefined : Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proximaManutencao">Próxima manutenção</Label>
              <Input
                id="proximaManutencao"
                type="datetime-local"
                value={form.proximaManutencao ?? ''}
                onChange={(e) => setForm({ ...form, proximaManutencao: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="responsavelManutencaoId">Responsável</Label>
              <select
                id="responsavelManutencaoId"
                value={form.responsavelManutencaoId || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    responsavelManutencaoId: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className={selectClasses}
              >
                <option value="">Sem responsável</option>
                {(lookups?.responsaveis ?? []).map((u) => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="local">Local da manutenção</Label>
            <Input
              id="local"
              placeholder="Ex.: Oficina Central, Oficina Parceira..."
              value={form.local ?? ''}
              onChange={(e) => setForm({ ...form, local: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="descricao">Descrição</Label>
            <textarea
              id="descricao"
              required
              minLength={2}
              placeholder="Descreva a manutenção realizada ou a realizar..."
              className={textareaClasses}
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Custo total calculado: <span className="font-medium">{formatarValor(custoTotalCalculado)}</span>
          </p>
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
        <h1 className="text-2xl font-semibold tracking-tight">Manutenções de Veículos</h1>
        <p className="text-sm text-muted-foreground">Acompanhe manutenções preventivas e corretivas da frota.</p>
      </header>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      {formulario}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar por veículo, tipo ou descrição..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">TODOS OS STATUS</option>
          {Object.entries(STATUS_LABEL).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {filtradas.map((m) => (
          <Card key={m.id}>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base">
                    {m.veiculo ? `${m.veiculo.codigo} — ${m.veiculo.placa}` : `Veículo #${m.veiculoId}`}
                  </CardTitle>
                  <BadgeStatus status={m.status} />
                </div>
                <span className="text-xs text-muted-foreground">{formatarData(m.data)}</span>
              </div>
              <CardDescription className="text-sm">{m.descricao}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-xs text-muted-foreground">
                {m.tipo && <span>Tipo: {m.tipo.nome} · </span>}
                {m.local && <span>Local: {m.local} · </span>}
                <span>
                  Peças: {formatarValor(m.custoPecas)} · Mão de obra: {formatarValor(m.custoMaoDeObra)} · Total: {formatarValor(m.custoTotal)}
                </span>
                {m.proximaManutencao && (
                  <span> · Próx.: {formatarData(m.proximaManutencao)}</span>
                )}
                {m.responsavelManutencao && (
                  <span> · Resp.: {m.responsavelManutencao.nome}</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {m.status === 'PENDENTE' && (
                  <Button type="button" variant="outline" size="sm" onClick={() => handleMudarStatus(m, 'EM_ANDAMENTO')}>
                    Iniciar
                  </Button>
                )}
                {m.status === 'EM_ANDAMENTO' && (
                  <Button type="button" variant="outline" size="sm" onClick={() => handleMudarStatus(m, 'CONCLUIDA')}>
                    Concluir
                  </Button>
                )}
                <Button type="button" variant="outline" size="sm" onClick={() => comecarEdicao(m)}>Editar</Button>
                {confirmandoExclusao === m.id ? (
                  <>
                    <Button type="button" variant="destructive" size="sm" disabled={excluindo === m.id} onClick={() => handleExcluir(m.id)}>
                      {excluindo === m.id ? 'Excluindo...' : 'Confirmar exclusão'}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmandoExclusao(null)}>Cancelar</Button>
                  </>
                ) : (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmandoExclusao(m.id)}>Excluir</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {!error && filtradas.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma manutenção encontrada.</p>
        )}
      </div>
    </div>
  );
}
