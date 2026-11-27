import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { podeAprovarManutencao } from '../components/layout/avisos';
import { Dialog } from '../components/ui/dialog';
import { ManutencoesVeiculosAnalyticsDashboard } from '../components/analytics/ManutencoesVeiculosAnalyticsDashboard';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { InputMoeda } from '../components/ui/input-moeda';
import { Label } from '../components/ui/label';
import { PecasEditor } from '../components/manutencao/PecasEditor';
import {
  aprovarManutencaoVeiculo,
  atualizarManutencaoVeiculo,
  criarManutencaoVeiculo,
  buscarManutencoesVeiculosLookups,
  recusarManutencaoVeiculo,
  type ManutencaoVeiculoInput,
  type ManutencaoVeiculoItem,
  listarManutencoesVeiculos,
  type ManutencoesVeiculosLookups,
  type PecaManutencaoInput,
} from '../lib/api';
import {
  dataLocalHoje,
  diasNaOficina,
  formatarData,
  formatarValor,
  fromLocalDate,
  toLocalDate,
} from '../lib/datetime';
import { cn } from '../lib/utils';
import { paraNumeroMoeda, somarMoeda } from '../lib/format';
import {
  selectClasses,
  textareaClasses,
} from '../components/ui/form-classes';

const STATUS_LABEL: Record<string, string> = {
  PENDENTE: 'Pendente',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
  AGUARDANDO_APROVACAO: 'Aguardando aprovação',
};

function BadgeStatus({ status }: { status: string }) {
  const classes: Record<string, string> = {
    PENDENTE: 'bg-amber-500/10 text-amber-600',
    EM_ANDAMENTO: 'bg-sky-500/10 text-sky-600',
    CONCLUIDA: 'bg-emerald-500/10 text-emerald-600',
    CANCELADA: 'bg-muted text-muted-foreground',
    AGUARDANDO_APROVACAO: 'bg-amber-500/10 text-amber-600',
  };
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', classes[status] ?? 'bg-muted')}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function formVazio(): ManutencaoVeiculoInput {
  return {
    veiculoId: 0,
    tipoId: 0,
    data: dataLocalHoje(),
    descricao: '',
    local: '',
    pecas: [],
    custoMaoDeObra: undefined,
    dataSaida: '',
    proximaManutencao: '',
    responsavelManutencaoId: undefined,
  };
}

export default function ManutencoesVeiculosPage({
  viewAtiva: propViewAtiva,
  onNavegar: propOnNavegar,
}: {
  viewAtiva?: 'analises' | 'lista' | 'novo';
  onNavegar?: (view: 'analises' | 'lista' | 'novo') => void;
} = {}) {
  const [internalView, setInternalView] = useState<'analises' | 'lista' | 'novo'>('lista');
  const viewAtiva = propViewAtiva ?? internalView;
  const setViewAtiva = propOnNavegar ?? setInternalView;

  const { user } = useAuth();
  const podeAprovar = podeAprovarManutencao(user);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [manutencoes, setManutencoes] = useState<ManutencaoVeiculoItem[]>([]);
  const [lookups, setLookups] = useState<ManutencoesVeiculosLookups | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [filtroVeiculo, setFiltroVeiculo] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [editando, setEditando] = useState<ManutencaoVeiculoItem | null>(null);
  const [form, setForm] = useState<ManutencaoVeiculoInput>(formVazio);
  const [processandoId, setProcessandoId] = useState<number | null>(null);
  const [recusandoItem, setRecusandoItem] = useState<ManutencaoVeiculoItem | null>(null);
  const [motivoRecusa, setMotivoRecusa] = useState('');
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

  useEffect(() => {
    if (viewAtiva === 'novo') {
      setMostrarForm(true);
    } else {
      setMostrarForm(false);
    }
  }, [viewAtiva]);

  function pecasParaFormulario(m: ManutencaoVeiculoItem): PecaManutencaoInput[] {
    if (m.pecas && m.pecas.length > 0) {
      return m.pecas.map((peca) => ({
        descricao: peca.descricao,
        acao: peca.acao,
        origem: peca.origem,
        valor: paraNumeroMoeda(peca.valor),
      }));
    }
    const legado = paraNumeroMoeda(m.custoPecas) ?? 0;
    if (legado > 0) {
      return [
        {
          descricao: 'Peças registradas anteriormente',
          acao: 'CONSERTADA',
          origem: null,
          valor: legado,
        },
      ];
    }
    return [];
  }

  function comecarEdicao(m: ManutencaoVeiculoItem) {
    setEditando(m);
    setForm({
      veiculoId: m.veiculoId,
      tipoId: m.tipoId,
      data: toLocalDate(m.data),
      descricao: m.descricao,
      local: m.local ?? undefined,
      pecas: pecasParaFormulario(m),
      custoMaoDeObra: paraNumeroMoeda(m.custoMaoDeObra) ?? undefined,
      dataSaida: toLocalDate(m.dataSaida),
      proximaManutencao: toLocalDate(m.proximaManutencao),
      responsavelManutencaoId: m.responsavelManutencaoId ?? undefined,
    });
    setError(null);
    setMostrarForm(true);
  }

  function cancelarEdicao() {
    setEditando(null);
    setForm(formVazio());
    setError(null);
    setMostrarForm(false);
    if (viewAtiva === 'novo') setViewAtiva('lista');
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload: ManutencaoVeiculoInput = {
        veiculoId: form.veiculoId || 0,
        tipoId: form.tipoId || 0,
        data: fromLocalDate(form.data) ?? new Date().toISOString(),
        descricao: form.descricao,
        local: form.local || undefined,
        pecas: form.pecas ?? [],
        custoMaoDeObra: form.custoMaoDeObra ?? 0,
        dataSaida: form.dataSaida ? fromLocalDate(form.dataSaida) : null,
        proximaManutencao: form.proximaManutencao
          ? fromLocalDate(form.proximaManutencao)
          : undefined,
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
      const dataSaida =
        status === 'CONCLUIDA' && !m.dataSaida
          ? toLocalDate(new Date().toISOString())
          : undefined;
      const atualizado = await atualizarManutencaoVeiculo(m.id, {
        status,
        ...(dataSaida ? { dataSaida } : {}),
      });
      setManutencoes((prev) => prev.map((x) => (x.id === atualizado.id ? atualizado : x)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar status');
    }
  }

  async function handleAprovar(id: number) {
    setProcessandoId(id);
    setError(null);
    try {
      const atualizado = await aprovarManutencaoVeiculo(id);
      setManutencoes((prev) => prev.map((x) => (x.id === atualizado.id ? atualizado : x)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao aprovar manutenção');
    } finally {
      setProcessandoId(null);
    }
  }

  async function confirmarRecusa() {
    if (!recusandoItem) return;
    const motivo = motivoRecusa.trim();
    if (motivo.length < 5) {
      setError('O motivo deve ter pelo menos 5 caracteres.');
      return;
    }
    setProcessandoId(recusandoItem.id);
    setError(null);
    try {
      const atualizado = await recusarManutencaoVeiculo(recusandoItem.id, motivo);
      setManutencoes((prev) => prev.map((x) => (x.id === atualizado.id ? atualizado : x)));
      setRecusandoItem(null);
      setMotivoRecusa('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao recusar manutenção');
    } finally {
      setProcessandoId(null);
    }
  }

  const filtradas = manutencoes.filter((m) => {
    if (filtroStatus && m.status !== filtroStatus) return false;
    if (filtroVeiculo && String(m.veiculoId) !== filtroVeiculo) return false;
    return true;
  });

  const totalPecas = somarMoeda(...(form.pecas ?? []).map((p) => p.valor));
  const custoTotalCalculado = somarMoeda(totalPecas, form.custoMaoDeObra);

  function tempoOficina(m: ManutencaoVeiculoItem): string | null {
    if (m.dataSaida) {
      const dias = diasNaOficina(m.data, m.dataSaida);
      if (dias === null) return null;
      return `${dias} ${dias === 1 ? 'dia' : 'dias'} na oficina`;
    }
    if (m.status === 'CONCLUIDA' || m.status === 'CANCELADA') return null;
    const dias = diasNaOficina(m.data);
    if (dias === null) return null;
    return `Em oficina há ${dias} ${dias === 1 ? 'dia' : 'dias'}`;
  }

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
                    {v.nome} — {v.placa}
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
                type="date"
                required
                value={form.data}
                onChange={(e) => setForm({ ...form, data: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dataSaida">Data de saída da oficina</Label>
              <Input
                id="dataSaida"
                type="date"
                min={form.data || undefined}
                value={form.dataSaida ?? ''}
                onChange={(e) => setForm({ ...form, dataSaida: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="custoMaoDeObra">Custo mão de obra (R$)</Label>
              <InputMoeda
                id="custoMaoDeObra"
                value={form.custoMaoDeObra}
                onChange={(v) => setForm({ ...form, custoMaoDeObra: v })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proximaManutencao">Próxima manutenção</Label>
              <Input
                id="proximaManutencao"
                type="date"
                value={form.proximaManutencao ?? ''}
                onChange={(e) => setForm({ ...form, proximaManutencao: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="responsavelManutencaoId">Responsável</Label>
              <select
                id="responsavelManutencaoId"
                value={form.responsavelManutencaoId ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    responsavelManutencaoId: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className={selectClasses}
              >
                <option value="">Selecione o responsável...</option>
                {(lookups?.responsaveis ?? []).map((r) => (
                  <option key={r.id} value={r.id}>{r.nome}</option>
                ))}
              </select>
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
          </div>
          <PecasEditor
            pecas={form.pecas ?? []}
            onChange={(pecas) => setForm({ ...form, pecas })}
          />
          <div className="space-y-1.5">
            <Label htmlFor="descricao">Descrição dos serviços</Label>
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
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>Peças: <span className="font-medium text-foreground">{formatarValor(totalPecas)}</span></span>
            <span>Mão de obra: <span className="font-medium text-foreground">{formatarValor(form.custoMaoDeObra ?? 0)}</span></span>
            <span>Total do serviço: <span className="font-medium text-foreground">{formatarValor(custoTotalCalculado)}</span></span>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
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
        <p className="text-sm text-muted-foreground">Registro e análise de manutenções preventivas e corretivas da frota.</p>
      </header>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      {viewAtiva === 'analises' && (
        <ManutencoesVeiculosAnalyticsDashboard
          manutencoes={manutencoes}
          lookups={lookups}
        />
      )}

      {viewAtiva !== 'analises' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row">
              <select
                value={filtroVeiculo}
                onChange={(e) => setFiltroVeiculo(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500"
              >
                <option value="">Todos os veículos</option>
                {(lookups?.veiculos ?? []).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nome} — {v.placa}
                  </option>
                ))}
              </select>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500"
              >
                <option value="">TODOS OS STATUS</option>
                {Object.entries(STATUS_LABEL).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {(mostrarForm || editando) && formulario}

          <div className="space-y-3">
            {filtradas.map((m) => (
              <Card key={m.id}>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base">
                        {m.veiculo ? `${m.veiculo.nome} — ${m.veiculo.placa}` : `Veículo #${m.veiculoId}`}
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
                    {m.dataSaida && (
                      <span> · Saída: {formatarData(m.dataSaida)}</span>
                    )}
                    {tempoOficina(m) && (
                      <span> · {tempoOficina(m)}</span>
                    )}
                    {m.proximaManutencao && (
                      <span> · Próx.: {formatarData(m.proximaManutencao)}</span>
                    )}
                    {m.responsavelManutencao && (
                      <span> · Motorista: {m.responsavelManutencao.nome}</span>
                    )}
                    {m.criadoPor && (
                      <span> · Criado por: {m.criadoPor.nome}</span>
                    )}
                    {m.aprovadoPor && (
                      <span> · Aprovado por: {m.aprovadoPor.nome}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {m.status === 'AGUARDANDO_APROVACAO' && podeAprovar && user?.id !== m.criadoPor?.id && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
                          disabled={processandoId === m.id}
                          onClick={() => handleAprovar(m.id)}
                        >
                          {processandoId === m.id ? 'Aprovando...' : 'Aprovar'}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          disabled={processandoId === m.id}
                          onClick={() => {
                            setError(null);
                            setMotivoRecusa('');
                            setRecusandoItem(m);
                          }}
                        >
                          Recusar
                        </Button>
                      </>
                    )}
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
                  </div>
                </CardContent>
              </Card>
            ))}
            {!error && filtradas.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma manutenção encontrada.</p>
            )}
          </div>
        </div>
      )}

      {/* Dialog para motivo de recusa */}
      <Dialog
        open={recusandoItem !== null}
        onClose={() => setRecusandoItem(null)}
        title="Recusar Manutenção de Frota"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setRecusandoItem(null)}
              disabled={processandoId !== null}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmarRecusa}
              disabled={processandoId !== null || motivoRecusa.trim().length < 5}
            >
              {processandoId !== null ? 'Recusando...' : 'Confirmar Recusa'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Informe o motivo da recusa para a manutenção do veículo{' '}
            <strong>{recusandoItem?.veiculo?.nome} ({recusandoItem?.veiculo?.placa})</strong>.
            O solicitante receberá uma notificação com esta justificativa.
          </p>
          <div className="space-y-1">
            <label htmlFor="motivo-recusa-pagina" className="text-xs font-medium">
              Motivo da recusa (mínimo 5 caracteres) *
            </label>
            <textarea
              id="motivo-recusa-pagina"
              rows={3}
              className="w-full rounded-lg border border-input bg-background p-2.5 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500"
              placeholder="Ex.: Manutenção postergada para o próximo mês devido a restrição orçamentária."
              value={motivoRecusa}
              onChange={(e) => setMotivoRecusa(e.target.value)}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
