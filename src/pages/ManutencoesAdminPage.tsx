import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { podeAprovarManutencaoEquipamento } from '../components/layout/avisos';
import { Dialog } from '../components/ui/dialog';
import { ManutencoesEquipamentosAnalyticsDashboard } from '../components/analytics/ManutencoesEquipamentosAnalyticsDashboard';
import { Button } from '../components/ui/button';
import { SearchInput } from '../components/ui/search-input';
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
  aprovarManutencao,
  atualizarManutencao,
  criarManutencao,
  type EquipamentoItem,
  excluirManutencao,
  listarEquipamentos,
  listarLookupsEquipamentos,
  listarManutencoes,
  type ManutencaoInput,
  type ManutencaoItem,
  type PecaManutencaoInput,
  recusarManutencao,
  type StatusManutencao,
} from '../lib/api';
import {
  diasNaOficina,
  formatarData,
  formatarValor,
  fromLocalDate,
  toLocalDate,
} from '../lib/datetime';
import { somarMoeda } from '../lib/format';
import { cn } from '../lib/utils';
import {
  selectClasses,
  textareaClasses,
} from '../components/ui/form-classes';

const STATUS_LABEL: Record<StatusManutencao, string> = {
  PENDENTE: 'Pendente',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
  AGUARDANDO_APROVACAO: 'Aguardando aprovação',
};

export function BadgeStatusManutencao({
  status,
}: {
  status: StatusManutencao;
}) {
  const classes: Record<StatusManutencao, string> = {
    PENDENTE: 'bg-amber-500/10 text-amber-600',
    EM_ANDAMENTO: 'bg-sky-500/10 text-sky-600',
    CONCLUIDA: 'bg-emerald-500/10 text-emerald-600',
    CANCELADA: 'bg-muted text-muted-foreground',
    AGUARDANDO_APROVACAO: 'bg-amber-500/10 text-amber-600',
  };
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-xs font-medium',
        classes[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

const vazio: ManutencaoInput = {
  equipamentoId: 0,
  tipoId: 0,
  data: '',
  descricao: '',
  pecas: [],
  custoMaoDeObra: undefined,
  dataSaida: '',
  responsavelManutencaoId: undefined,
  proximaManutencao: undefined,
};

interface ManutencoesAnalisesProps {
  manutencoes: ManutencaoItem[];
}

export function ManutencoesAnalises({ manutencoes }: ManutencoesAnalisesProps) {
  const total = manutencoes.length;
  const pendentes = manutencoes.filter((m) => m.status === 'PENDENTE').length;
  const emAndamento = manutencoes.filter(
    (m) => m.status === 'EM_ANDAMENTO',
  ).length;
  const concluidas = manutencoes.filter((m) => m.status === 'CONCLUIDA').length;
  const canceladas = manutencoes.filter((m) => m.status === 'CANCELADA').length;
  const custoTotal = manutencoes.reduce((acc, m) => acc + (m.custo ?? 0), 0);

  const porTipo = manutencoes.reduce(
    (acc, m) => {
      const nome = m.tipo?.nome ?? 'Sem tipo';
      acc[nome] = (acc[nome] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const porStatus = manutencoes.reduce(
    (acc, m) => {
      acc[m.status] = (acc[m.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">
          Análises de Manutenções
        </h2>
        <p className="text-sm text-muted-foreground">
          Visão geral das manutenções de equipamentos e seus custos.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Total de Manutenções
          </p>
          <p className="mt-2 text-2xl font-bold">{total}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-warning">Pendentes</p>
          <p className="mt-2 text-2xl font-bold">{pendentes}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-info">Em Andamento</p>
          <p className="mt-2 text-2xl font-bold">{emAndamento}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-success">Concluídas</p>
          <p className="mt-2 text-2xl font-bold">{concluidas}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Canceladas
          </p>
          <p className="mt-2 text-2xl font-bold">{canceladas}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Custo Total
          </p>
          <p className="mt-2 text-2xl font-bold">{formatarValor(custoTotal)}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
          <h3 className="font-semibold text-base">Distribuição por Tipo</h3>
          <div className="space-y-2">
            {Object.entries(porTipo).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum dado registrado.
              </p>
            ) : (
              Object.entries(porTipo).map(([tipo, qtd]) => {
                const perc = total ? Math.round((qtd / total) * 100) : 0;
                return (
                  <div key={tipo} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span>{tipo}</span>
                      <span>
                        {qtd} ({perc}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-primary/40 overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${perc}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
          <h3 className="font-semibold text-base">Distribuição por Status</h3>
          <div className="space-y-2">
            {Object.entries(porStatus).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum dado registrado.
              </p>
            ) : (
              Object.entries(porStatus).map(([status, qtd]) => {
                const perc = total ? Math.round((qtd / total) * 100) : 0;
                return (
                  <div key={status} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span>
                        {STATUS_LABEL[status as StatusManutencao] ?? status}
                      </span>
                      <span>
                        {qtd} ({perc}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-primary/40 overflow-hidden">
                      <div
                        className="h-full bg-warning transition-all"
                        style={{ width: `${perc}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ManutencoesAdminPage({
  viewAtiva = 'lista',
  onNavegar,
}: {
  viewAtiva?: 'analises' | 'lista' | 'novo';
  onNavegar?: (v: 'analises' | 'lista' | 'novo') => void;
}) {
  const { user } = useAuth();
  const podeAprovar = podeAprovarManutencaoEquipamento(user);

  const [manutencoes, setManutencoes] = useState<ManutencaoItem[]>([]);
  const [equipamentos, setEquipamentos] = useState<EquipamentoItem[]>([]);
  const [tipos, setTipos] = useState<{ id: number; nome: string }[]>([]);
  const [usuarios, setUsuarios] = useState<{ id: number; nome: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<'' | StatusManutencao>('');
  const [busca, setBusca] = useState('');
  const [saving, setSaving] = useState(false);
  const [editando, setEditando] = useState<ManutencaoItem | null>(null);
  const [form, setForm] = useState<ManutencaoInput>(vazio);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<number | null>(
    null,
  );
  const [excluindo, setExcluindo] = useState<number | null>(null);
  const [processandoId, setProcessandoId] = useState<number | null>(null);
  const [recusandoItem, setRecusandoItem] = useState<ManutencaoItem | null>(null);
  const [motivoRecusa, setMotivoRecusa] = useState('');

  const carregar = useCallback(async () => {
    setError(null);
    try {
      const [lista, lookups, eqs] = await Promise.all([
        listarManutencoes(),
        listarLookupsEquipamentos(),
        listarEquipamentos(),
      ]);
      setManutencoes(lista);
      setTipos(lookups.tiposManutencao.filter((t) => t.ativo));
      setEquipamentos(eqs);
      setUsuarios(lookups.responsaveis);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao carregar manutenções',
      );
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function pecasParaFormulario(m: ManutencaoItem): PecaManutencaoInput[] {
    if (m.pecas && m.pecas.length > 0) {
      return m.pecas.map((peca) => ({
        descricao: peca.descricao,
        acao: peca.acao,
        origem: peca.origem,
        valor: Number(peca.valor),
      }));
    }
    const legado = Number(m.custoPecas ?? 0);
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

  function comecarEdicao(m: ManutencaoItem) {
    setEditando(m);
    setForm({
      equipamentoId: m.equipamentoId,
      tipoId: m.tipoId,
      data: toLocalDate(m.data),
      descricao: m.descricao,
      pecas: pecasParaFormulario(m),
      custoMaoDeObra: Number(m.custoMaoDeObra ?? 0),
      dataSaida: toLocalDate(m.dataSaida),
      responsavelManutencaoId: m.responsavelManutencaoId ?? undefined,
      proximaManutencao: toLocalDate(m.proximaManutencao),
    });
    setError(null);
  }

  function cancelarEdicao() {
    setEditando(null);
    setForm(vazio);
    setError(null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editando) {
        const atualizado = await atualizarManutencao(editando.id, {
          equipamentoId: form.equipamentoId,
          tipoId: form.tipoId,
          data: fromLocalDate(form.data) ?? editando.data,
          descricao: form.descricao,
          pecas: form.pecas ?? [],
          custoMaoDeObra: form.custoMaoDeObra ?? 0,
          dataSaida: form.dataSaida ? fromLocalDate(form.dataSaida) : null,
          responsavelManutencaoId: form.responsavelManutencaoId ?? null,
          proximaManutencao: form.proximaManutencao
            ? (fromLocalDate(form.proximaManutencao) ?? null)
            : null,
        });
        setManutencoes((prev) =>
          prev.map((x) => (x.id === atualizado.id ? atualizado : x)),
        );
        cancelarEdicao();
      } else {
        const criado = await criarManutencao({
          equipamentoId: form.equipamentoId,
          tipoId: form.tipoId,
          data: fromLocalDate(form.data) ?? new Date().toISOString(),
          descricao: form.descricao,
          pecas: form.pecas ?? [],
          custoMaoDeObra: form.custoMaoDeObra ?? 0,
          dataSaida: form.dataSaida ? fromLocalDate(form.dataSaida) : null,
          responsavelManutencaoId: form.responsavelManutencaoId,
          proximaManutencao: form.proximaManutencao
            ? fromLocalDate(form.proximaManutencao)
            : undefined,
        });
        setManutencoes((prev) => [criado, ...prev]);
        cancelarEdicao();
        if (viewAtiva === 'novo') onNavegar?.('lista');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao salvar manutenção',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleMudarStatus(
    m: ManutencaoItem,
    status: StatusManutencao,
  ) {
    setError(null);
    try {
      const dataSaida =
        status === 'CONCLUIDA' && !m.dataSaida
          ? toLocalDate(new Date().toISOString())
          : undefined;
      const atualizado = await atualizarManutencao(m.id, {
        status,
        ...(dataSaida ? { dataSaida } : {}),
      });
      setManutencoes((prev) =>
        prev.map((x) => (x.id === atualizado.id ? atualizado : x)),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao atualizar status',
      );
    }
  }

  async function handleAprovar(id: number) {
    setProcessandoId(id);
    setError(null);
    try {
      const atualizado = await aprovarManutencao(id);
      setManutencoes((prev) =>
        prev.map((x) => (x.id === atualizado.id ? atualizado : x)),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao aprovar manutenção',
      );
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
      const atualizado = await recusarManutencao(recusandoItem.id, motivo);
      setManutencoes((prev) =>
        prev.map((x) => (x.id === atualizado.id ? atualizado : x)),
      );
      setRecusandoItem(null);
      setMotivoRecusa('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao recusar manutenção',
      );
    } finally {
      setProcessandoId(null);
    }
  }

  async function handleExcluir(id: number) {
    setExcluindo(id);
    setError(null);
    try {
      await excluirManutencao(id);
      setManutencoes((prev) => prev.filter((x) => x.id !== id));
      setConfirmandoExclusao(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao excluir manutenção',
      );
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
      m.equipamento?.descricao,
      m.equipamento?.codigo,
      m.equipamento?.numeroPatrimonio,
      m.tipo?.nome,
      m.responsavelManutencao?.nome,
    ]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(texto));
  });

  const totalPecas = somarMoeda(...(form.pecas ?? []).map((p) => p.valor));
  const custoTotal = somarMoeda(totalPecas, form.custoMaoDeObra);

  function tempoOficina(m: ManutencaoItem): string | null {
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

  const formulario = editando ? (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Editar manutenção</CardTitle>
        <CardDescription>
          Atualize as informações e salve as alterações.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="equipamentoId">Equipamento</Label>
              <select
                id="equipamentoId"
                required
                value={form.equipamentoId || ''}
                onChange={(e) =>
                  setForm({ ...form, equipamentoId: Number(e.target.value) })
                }
                className={selectClasses}
              >
                <option value="" disabled>
                  Selecione o equipamento...
                </option>
                {equipamentos.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.numeroPatrimonio
                      ? `${eq.numeroPatrimonio} — ${eq.descricao}`
                      : eq.descricao}
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
                onChange={(e) =>
                  setForm({ ...form, tipoId: Number(e.target.value) })
                }
                className={selectClasses}
              >
                <option value="" disabled>
                  Selecione o tipo...
                </option>
                {tipos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
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
              <Label htmlFor="responsavelManutencaoId">Responsável</Label>
              <select
                id="responsavelManutencaoId"
                value={form.responsavelManutencaoId || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    responsavelManutencaoId: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
                className={selectClasses}
              >
                <option value="">Sem responsável</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dataSaida">Data de saída da oficina</Label>
              <Input
                id="dataSaida"
                type="date"
                min={form.data || undefined}
                value={form.dataSaida ?? ''}
                onChange={(e) =>
                  setForm({ ...form, dataSaida: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="custoMaoDeObra">Mão de obra (R$)</Label>
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
                onChange={(e) =>
                  setForm({ ...form, proximaManutencao: e.target.value })
                }
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
            <span>Total do serviço: <span className="font-medium text-foreground">{formatarValor(custoTotal)}</span></span>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving
                ? 'Salvando...'
                : editando
                  ? 'Salvar alterações'
                  : 'Cadastrar'}
            </Button>
            {editando && (
              <Button type="button" variant="outline" onClick={cancelarEdicao}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  ) : (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Nova manutenção</CardTitle>
        <CardDescription>
          Registre uma manutenção e acompanhe o status até a conclusão.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="equipamentoId">Equipamento</Label>
              <select
                id="equipamentoId"
                required
                value={form.equipamentoId || ''}
                onChange={(e) =>
                  setForm({ ...form, equipamentoId: Number(e.target.value) })
                }
                className={selectClasses}
              >
                <option value="" disabled>
                  Selecione o equipamento...
                </option>
                {equipamentos.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.numeroPatrimonio
                      ? `${eq.numeroPatrimonio} — ${eq.descricao}`
                      : eq.descricao}
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
                onChange={(e) =>
                  setForm({ ...form, tipoId: Number(e.target.value) })
                }
                className={selectClasses}
              >
                <option value="" disabled>
                  Selecione o tipo...
                </option>
                {tipos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
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
              <Label htmlFor="responsavelManutencaoId">Responsável</Label>
              <select
                id="responsavelManutencaoId"
                value={form.responsavelManutencaoId || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    responsavelManutencaoId: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
                className={selectClasses}
              >
                <option value="">Sem responsável</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dataSaida">Data de saída da oficina</Label>
              <Input
                id="dataSaida"
                type="date"
                min={form.data || undefined}
                value={form.dataSaida ?? ''}
                onChange={(e) =>
                  setForm({ ...form, dataSaida: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="custoMaoDeObra">Mão de obra (R$)</Label>
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
                onChange={(e) =>
                  setForm({ ...form, proximaManutencao: e.target.value })
                }
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
            <span>Total do serviço: <span className="font-medium text-foreground">{formatarValor(custoTotal)}</span></span>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving
                ? 'Salvando...'
                : editando
                  ? 'Salvar alterações'
                  : 'Cadastrar'}
            </Button>
            {editando && (
              <Button type="button" variant="outline" onClick={cancelarEdicao}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );

  if (viewAtiva === 'analises') {
    return (
      <div className="space-y-6">
        <ManutencoesEquipamentosAnalyticsDashboard manutencoes={manutencoes} />
      </div>
    );
  }

  if (viewAtiva === 'novo') {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">
            Nova manutenção
          </h1>
          <p className="text-sm text-muted-foreground">
            Registre uma manutenção e acompanhe o status até a conclusão.
          </p>
        </header>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {formulario}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Manutenções</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie a manutenção preventiva e corretiva dos equipamentos.
        </p>
      </header>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchInput
          placeholder="Buscar por descrição, equipamento ou responsável..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <select
          value={filtroStatus}
          onChange={(e) =>
            setFiltroStatus(e.target.value as '' | StatusManutencao)
          }
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">TODOS OS STATUS</option>
          {(
            ['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA', 'AGUARDANDO_APROVACAO'] as const
          ).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      {editando && formulario}

      <div className="space-y-3">
        {filtradas.map((m) => (
          <Card key={m.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base">
                    {m.equipamento?.numeroPatrimonio ??
                      m.equipamento?.codigo ??
                      '—'}{' '}
                    — {m.equipamento?.descricao ?? `#${m.equipamentoId}`}
                  </CardTitle>
                  <BadgeStatusManutencao status={m.status} />
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatarData(m.data)}
                </span>
              </div>
              <CardDescription>{m.descricao}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-muted-foreground">
                  {m.tipo && <span>Tipo: {m.tipo.nome} · </span>}
                  {m.responsavelManutencao && (
                    <span>Resp.: {m.responsavelManutencao.nome} · </span>
                  )}
                  {m.criadoPor && (
                    <span>Criado por: {m.criadoPor.nome} · </span>
                  )}
                  {m.aprovadoPor && (
                    <span>Aprovado por: {m.aprovadoPor.nome} · </span>
                  )}
                  {(m.pecas && m.pecas.length > 0) || Number(m.custoPecas ?? 0) > 0 ? (
                    <span>
                      Peças: {formatarValor(m.custoPecas)} · Mão de obra: {formatarValor(m.custoMaoDeObra)} · Total: {formatarValor(m.custo)}
                    </span>
                  ) : (
                    <span>Custo: {formatarValor(m.custo)}</span>
                  )}
                  {m.dataSaida && (
                    <span> · Saída: {formatarData(m.dataSaida)}</span>
                  )}
                  {tempoOficina(m) && <span> · {tempoOficina(m)}</span>}
                  {m.proximaManutencao && (
                    <span> · Próx.: {formatarData(m.proximaManutencao)}</span>
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleMudarStatus(m, 'EM_ANDAMENTO')}
                    >
                      Iniciar
                    </Button>
                  )}
                  {m.status === 'EM_ANDAMENTO' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleMudarStatus(m, 'CONCLUIDA')}
                    >
                      Concluir
                    </Button>
                  )}
                  {(m.status === 'PENDENTE' || m.status === 'EM_ANDAMENTO') && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMudarStatus(m, 'CANCELADA')}
                    >
                      Cancelar
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => comecarEdicao(m)}
                  >
                    Editar
                  </Button>
                  {confirmandoExclusao === m.id ? (
                    <>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={excluindo === m.id}
                        onClick={() => handleExcluir(m.id)}
                      >
                        {excluindo === m.id
                          ? 'Excluindo...'
                          : 'Confirmar exclusão'}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmandoExclusao(null)}
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmandoExclusao(m.id)}
                    >
                      Excluir
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {!error && filtradas.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma manutenção encontrada.
          </p>
        )}
      </div>

      {/* Dialog para motivo de recusa de manutenção de equipamento */}
      <Dialog
        open={recusandoItem !== null}
        onClose={() => setRecusandoItem(null)}
        title="Recusar Manutenção de Equipamento"
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
            Informe o motivo da recusa para a manutenção do equipamento{' '}
            <strong>
              {recusandoItem?.equipamento?.codigo} ({recusandoItem?.equipamento?.descricao})
            </strong>.
            O solicitante receberá uma notificação com esta justificativa.
          </p>
          <div className="space-y-1">
            <label htmlFor="motivo-recusa-equip" className="text-xs font-medium">
              Motivo da recusa (mínimo 5 caracteres) *
            </label>
            <textarea
              id="motivo-recusa-equip"
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
