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
  atualizarVeiculo,
  type AnalisesFrota,
  criarVeiculo,
  excluirVeiculo,
  listarVeiculos,
  buscarAnalisesFrota,
  buscarVeiculoLookups,
  obterProximoCodigoVeiculo,
  type VeiculoInput,
  type VeiculoItem,
  type VeiculoLookups,
} from '../lib/api';
import { formatarData, formatarValor } from '../lib/datetime';
import { cn } from '../lib/utils';

const selectClasses =
  'flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

const textareaClasses =
  'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

function BadgeAtivo({ ativo }: { ativo: boolean }) {
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-xs font-medium',
        ativo
          ? 'bg-emerald-500/10 text-emerald-600'
          : 'bg-muted text-muted-foreground',
      )}
    >
      {ativo ? 'Ativo' : 'Inativo'}
    </span>
  );
}

type View = 'analises' | 'lista' | 'novo';

interface Props {
  view: View;
  onViewChange: (view: View) => void;
}

const emptyForm: VeiculoInput = {
  codigo: '',
  placa: '',
  descricao: '',
  modelo: '',
  ano: undefined,
  combustivel: 'GASOLINA',
  odometroAtual: undefined,
  observacoes: '',
  marcaId: undefined,
  corId: undefined,
  tipoId: 0,
  statusId: 0,
  responsavelId: undefined,
};

function AnalisesFrota({ analises }: { analises: AnalisesFrota | null }) {
  if (!analises) return null;
  const { kmTotalMes, abastecimentosMes, manutencoesPorStatus, veiculosSemKm, mes, ano } = analises;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Análises de Frota</h2>
        <p className="text-sm text-muted-foreground">
          Visão geral de KM, abastecimentos e manutenções do mês {mes}/{ano}.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">KM total do mês</p>
          <p className="mt-2 text-2xl font-bold">{kmTotalMes.toLocaleString('pt-BR')}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Abastecimentos</p>
          <p className="mt-2 text-2xl font-bold">{abastecimentosMes.quantidade}</p>
          <p className="text-xs text-muted-foreground">
            {abastecimentosMes.totalLitros.toFixed(2)} L · {formatarValor(abastecimentosMes.totalValor)}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm lg:col-span-2">
          <p className="text-xs font-medium text-muted-foreground">Manutenções por status</p>
          <div className="mt-2 space-y-1">
            {manutencoesPorStatus.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma manutenção registrada.</p>
            ) : (
              manutencoesPorStatus.map((s) => (
                <div key={s.status} className="flex justify-between text-sm">
                  <span>{s.status}</span>
                  <span className="font-medium">{s.quantidade}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
        <h3 className="font-semibold text-base">Veículos sem KM há mais de 5 dias úteis</h3>
        {veiculosSemKm.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todos os veículos com registro recente.</p>
        ) : (
          <ul className="space-y-1">
            {veiculosSemKm.map((v) => (
              <li key={v.id} className="flex justify-between text-sm">
                <span>{v.codigo} — {v.placa}</span>
                <span className="text-muted-foreground">
                  Último: {formatarData(v.ultimoRegistro)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function VeiculosAdminPage({ view, onViewChange }: Props) {
  const [veiculos, setVeiculos] = useState<VeiculoItem[]>([]);
  const [lookups, setLookups] = useState<VeiculoLookups | null>(null);
  const [analises, setAnalises] = useState<AnalisesFrota | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<number | ''>('');
  const [tipoFiltro, setTipoFiltro] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);
  const [editando, setEditando] = useState<VeiculoItem | null>(null);
  const [form, setForm] = useState<VeiculoInput>(emptyForm);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<number | null>(null);
  const [excluindo, setExcluindo] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    setError(null);
    try {
      const [lista, lk, an] = await Promise.all([
        listarVeiculos(),
        buscarVeiculoLookups(),
        buscarAnalisesFrota(),
      ]);
      setVeiculos(lista);
      setLookups(lk);
      setAnalises(an);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar veículos');
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (view !== 'novo' || editando) return;
    let cancelado = false;
    obterProximoCodigoVeiculo()
      .then((r) => {
        if (!cancelado) setForm((prev) => ({ ...prev, codigo: r.codigo }));
      })
      .catch(() => {
        /* silencioso — campo fica editável */
      });
    return () => {
      cancelado = true;
    };
  }, [view, editando]);

  function comecarEdicao(v: VeiculoItem) {
    setEditando(v);
    setForm({
      codigo: v.codigo,
      placa: v.placa,
      descricao: v.descricao,
      modelo: v.modelo ?? '',
      ano: v.ano ?? undefined,
      combustivel: v.combustivel,
      odometroAtual: v.odometroAtual,
      observacoes: v.observacoes ?? '',
      marcaId: v.marcaId ?? undefined,
      corId: v.corId ?? undefined,
      tipoId: v.tipoId,
      statusId: v.statusId,
      responsavelId: v.responsavelId ?? undefined,
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
      const payload: VeiculoInput = {
        ...form,
        modelo: form.modelo || undefined,
        ano: form.ano || undefined,
        observacoes: form.observacoes || undefined,
        odometroAtual: form.odometroAtual,
        tipoId: form.tipoId || 0,
        statusId: form.statusId || 0,
      };
      if (editando) {
        const atualizado = await atualizarVeiculo(editando.id, payload);
        setVeiculos((prev) => prev.map((x) => (x.id === atualizado.id ? atualizado : x)));
        cancelarEdicao();
      } else {
        const criado = await criarVeiculo(payload);
        setVeiculos((prev) => [criado, ...prev]);
        cancelarEdicao();
        onViewChange('lista');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar veículo');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAtivo(v: VeiculoItem) {
    setError(null);
    try {
      const atualizado = await atualizarVeiculo(v.id, { ativo: !v.ativo });
      setVeiculos((prev) => prev.map((x) => (x.id === atualizado.id ? atualizado : x)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar veículo');
    }
  }

  async function handleExcluir(id: number) {
    setExcluindo(id);
    setError(null);
    try {
      await excluirVeiculo(id);
      setVeiculos((prev) => prev.filter((x) => x.id !== id));
      setConfirmandoExclusao(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao excluir veículo');
    } finally {
      setExcluindo(null);
    }
  }

  const formulario = (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{editando ? 'Editar veículo' : 'Novo veículo'}</CardTitle>
        <CardDescription>
          {editando ? 'Atualize as informações e salve as alterações.' : 'Cadastre um veículo da frota.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="codigo">Código</Label>
              <Input id="codigo" required value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="placa">Placa</Label>
              <Input id="placa" required value={form.placa} onChange={(e) => setForm({ ...form, placa: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input id="descricao" required value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="modelo">Modelo</Label>
              <Input id="modelo" value={form.modelo ?? ''} onChange={(e) => setForm({ ...form, modelo: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ano">Ano</Label>
              <Input id="ano" type="number" min={1900} max={2100} value={form.ano ?? ''} onChange={(e) => setForm({ ...form, ano: e.target.value ? Number(e.target.value) : undefined })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="combustivel">Combustível</Label>
              <select id="combustivel" value={form.combustivel ?? 'GASOLINA'} onChange={(e) => setForm({ ...form, combustivel: e.target.value })} className={selectClasses}>
                <option value="GASOLINA">Gasolina</option>
                <option value="ALCOOL">Álcool</option>
                <option value="FLEX">Flex</option>
                <option value="DIESEL">Diesel</option>
                <option value="GNV">GNV</option>
                <option value="ELETRICO">Elétrico</option>
                <option value="HIBRIDO">Híbrido</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="odometroAtual">Odômetro atual (km)</Label>
              <Input id="odometroAtual" type="number" min={0} step="0.1" value={form.odometroAtual ?? ''} onChange={(e) => setForm({ ...form, odometroAtual: e.target.value ? Number(e.target.value) : undefined })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tipoId">Tipo</Label>
              <select id="tipoId" required value={form.tipoId || ''} onChange={(e) => setForm({ ...form, tipoId: Number(e.target.value) })} className={selectClasses}>
                <option value="" disabled>Selecione o tipo...</option>
                {(lookups?.tiposVeiculo ?? []).filter((t) => t.ativo).map((t) => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="statusId">Status</Label>
              <select id="statusId" required value={form.statusId || ''} onChange={(e) => setForm({ ...form, statusId: Number(e.target.value) })} className={selectClasses}>
                <option value="" disabled>Selecione o status...</option>
                {(lookups?.statusVeiculos ?? []).filter((s) => s.ativo).map((s) => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="marcaId">Marca</Label>
              <select id="marcaId" value={form.marcaId || ''} onChange={(e) => setForm({ ...form, marcaId: e.target.value ? Number(e.target.value) : undefined })} className={selectClasses}>
                <option value="">Sem marca</option>
                {(lookups?.marcas ?? []).filter((m) => m.ativo).map((m) => (
                  <option key={m.id} value={m.id}>{m.nome}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="corId">Cor</Label>
              <select id="corId" value={form.corId || ''} onChange={(e) => setForm({ ...form, corId: e.target.value ? Number(e.target.value) : undefined })} className={selectClasses}>
                <option value="">Sem cor</option>
                {(lookups?.cores ?? []).filter((c) => c.ativo).map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="responsavelId">Responsável</Label>
              <select id="responsavelId" value={form.responsavelId || ''} onChange={(e) => setForm({ ...form, responsavelId: e.target.value ? Number(e.target.value) : undefined })} className={selectClasses}>
                <option value="">Sem responsável</option>
                {(lookups?.responsaveis ?? []).map((r) => (
                  <option key={r.id} value={r.id}>{r.nome}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="observacoes">Observações</Label>
            <textarea id="observacoes" className={textareaClasses} value={form.observacoes ?? ''} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : editando ? 'Salvar alterações' : 'Cadastrar'}</Button>
            {editando && (
              <Button type="button" variant="outline" onClick={() => { cancelarEdicao(); onViewChange('lista'); }}>Cancelar</Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Gestão de Veículos</h1>
        <p className="text-sm text-muted-foreground">Cadastro e controle da frota.</p>
      </header>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      {view === 'analises' && <AnalisesFrota analises={analises} />}
      {(view === 'novo' || editando) && formulario}

      {view === 'lista' && !editando && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Buscar por código, placa ou descrição..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <select
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value ? Number(e.target.value) : '')}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">TODOS OS STATUS</option>
              {(lookups?.statusVeiculos ?? []).map((s) => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>
            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value ? Number(e.target.value) : '')}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">TODOS OS TIPOS</option>
              {(lookups?.tiposVeiculo ?? []).map((t) => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
          </div>

          {(() => {
            const filtrados = veiculos.filter(
              (v) =>
                (!statusFiltro || v.statusId === statusFiltro) &&
                (!tipoFiltro || v.tipoId === tipoFiltro) &&
                (!busca ||
                  `${v.codigo} ${v.placa} ${v.descricao}`.toLowerCase().includes(busca.toLowerCase())),
            );
            return (
              <div className="space-y-3">
                {filtrados.map((v) => (
                  <Card key={v.id}>
                    <CardHeader className="pb-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle className="text-base">{v.descricao}</CardTitle>
                          <BadgeAtivo ativo={v.ativo} />
                        </div>
                        <span className="text-xs text-muted-foreground">{v.status?.nome}</span>
                      </div>
                      <CardDescription className="text-sm">
                        {v.codigo} · {v.placa}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        {v.tipo && <span>Tipo: {v.tipo.nome} · </span>}
                        {v.marca && <span>Marca: {v.marca.nome} · </span>}
                        {v.modelo && <span>{v.modelo}</span>}
                        {v.ano && <span> · {v.ano}</span>}
                        <span> · Odômetro: {v.odometroAtual.toLocaleString('pt-BR')} km</span>
                        {v.responsavel && <span> · Resp.: {v.responsavel.nome}</span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => comecarEdicao(v)}>Editar</Button>
                        <Button type="button" variant="outline" size="sm" disabled={excluindo === v.id} onClick={() => handleToggleAtivo(v)}>
                          {v.ativo ? 'Desativar' : 'Ativar'}
                        </Button>
                        {confirmandoExclusao === v.id ? (
                          <>
                            <Button type="button" variant="destructive" size="sm" disabled={excluindo === v.id} onClick={() => handleExcluir(v.id)}>
                              {excluindo === v.id ? 'Excluindo...' : 'Confirmar exclusão'}
                            </Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmandoExclusao(null)}>Cancelar</Button>
                          </>
                        ) : (
                          <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmandoExclusao(v.id)}>Excluir</Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {!error && filtrados.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">Nenhum veículo encontrado.</p>
                )}
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
