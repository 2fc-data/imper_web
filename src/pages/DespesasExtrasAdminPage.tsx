import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { RecordsFilter } from '../components/RecordsFilter';
import { ListaComprasView } from '../components/compras/ListaComprasView';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import {
  atualizarMaterial,
  criarMaterial,
  excluirMaterial,
  listarLookupsMateriais,
  listarMateriais,
  type MaterialInput,
  type MaterialItem,
  type MaterialLookups,
  type StatusMaterial,
  type UnidadeMedida,
} from '../lib/api';
import { formatarData, formatarValor } from '../lib/datetime';
import { cn } from '../lib/utils';
import TiposDespesasView from './TiposDespesasView';

function toNum(v: number | string | null | undefined): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === 'string' ? Number(v) : v;
  return Number.isNaN(n) ? 0 : n;
}

function saldoDe(m: MaterialItem): number {
  return toNum(m.saldo?.saldo);
}

function abaixoDoMinimo(m: MaterialItem): boolean {
  return (
    m.status === 'ATIVO' &&
    m.quantidadeMinima !== null &&
    saldoDe(m) < m.quantidadeMinima
  );
}

const emptyForm = {
  nome: '',
  unidadeId: '' as number | '',
  quantidadeMinima: '',
  custoUnitario: '',
  status: 'ATIVO' as StatusMaterial,
};

type DespesasExtrasFormData = typeof emptyForm;

function numOuNull(v: string): number | null {
  const n = Number(v.trim().replace(',', '.'));
  return v.trim() === '' || Number.isNaN(n) ? null : n;
}

function BadgeStatus({ status }: { status: StatusMaterial }) {
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-xs font-medium',
        status === 'ATIVO'
          ? 'bg-primary/10 text-primary'
          : 'bg-muted text-muted-foreground',
      )}
    >
      {status === 'ATIVO' ? 'Ativo' : 'Inativo'}
    </span>
  );
}

function BadgeSaldo({
  valor,
  destaque,
}: {
  valor: number;
  destaque?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        destaque
          ? 'bg-destructive/10 text-destructive'
          : 'bg-muted text-muted-foreground',
      )}
    >
      {destaque && '⚠'}
      {valor} un.
    </span>
  );
}

interface DespesasExtrasAnalisesProps {
  itens: MaterialItem[];
}

export function DespesasExtrasAnalises({ itens }: DespesasExtrasAnalisesProps) {
  const total = itens.length;
  const saldoTotal = itens.reduce((acc, m) => acc + saldoDe(m), 0);
  const semEstoque = itens.filter((m) => saldoDe(m) === 0).length;
  const abaixoMinimo = itens.filter(abaixoDoMinimo).length;
  const valorEstoque = itens.reduce(
    (acc, m) => acc + toNum(m.custoUnitario) * saldoDe(m),
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">
          Análises de Despesas Extras
        </h2>
        <p className="text-sm text-muted-foreground">
          Situação do estoque, saldo e valor dos itens de despesas extras.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Total de Itens
          </p>
          <p className="mt-2 text-2xl font-bold">{total}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Saldo em Estoque
          </p>
          <p className="mt-2 text-2xl font-bold">{saldoTotal} un.</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-destructive">
            Abaixo do Mínimo
          </p>
          <p className="mt-2 text-2xl font-bold">{abaixoMinimo}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Sem Estoque
          </p>
          <p className="mt-2 text-2xl font-bold">{semEstoque}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Valor do Estoque
          </p>
          <p className="mt-2 text-2xl font-bold">
            {formatarValor(valorEstoque)}
          </p>
        </div>
      </div>
    </div>
  );
}

interface DespesasExtrasFormProps {
  editando: boolean;
  saving: boolean;
  form: DespesasExtrasFormData;
  setForm: (f: DespesasExtrasFormData) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  unidadesMedida: UnidadeMedida[];
}

function DespesasExtrasForm({
  editando,
  saving,
  form,
  setForm,
  onSubmit,
  onCancel,
  unidadesMedida,
}: DespesasExtrasFormProps) {
  const inputCls =
    'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border bg-card p-5 shadow-sm space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Nome</label>
          <input
            type="text"
            required
            minLength={2}
            value={form.nome}
            onChange={(e) =>
              setForm({ ...form, nome: e.target.value.toUpperCase() })
            }
            placeholder="Ex.: Detergente, Sabonete líquido..."
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Unidade de Medida
          </label>
          <select
            value={form.unidadeId}
            onChange={(e) =>
              setForm({
                ...form,
                unidadeId: e.target.value === '' ? '' : Number(e.target.value),
              })
            }
            className={inputCls}
          >
            <option value="">Selecione...</option>
            {[...unidadesMedida]
              .sort((a, b) => a.nome.localeCompare(b.nome))
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Quantidade mínima
          </label>
          <input
            type="number"
            min={0}
            value={form.quantidadeMinima}
            onChange={(e) =>
              setForm({ ...form, quantidadeMinima: e.target.value })
            }
            placeholder="0"
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Custo unitário
          </label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.custoUnitario}
            onChange={(e) =>
              setForm({ ...form, custoUnitario: e.target.value })
            }
            placeholder="0,00"
            className={inputCls}
          />
        </div>
        {editando && (
          <div>
            <label className="mb-1 block text-sm font-medium">Status</label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as StatusMaterial })
              }
              className={inputCls}
            >
              <option value="ATIVO">Ativo</option>
              <option value="INATIVO">Inativo</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={saving}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving
            ? 'Salvando...'
            : editando
              ? 'Salvar alterações'
              : 'Cadastrar'}
        </Button>
      </div>
    </form>
  );
}

export default function DespesasExtrasAdminPage({
  viewAtiva = 'lista',
  onNavegar,
}: {
  viewAtiva?: 'analises' | 'lista' | 'novo' | 'compras' | 'tipos';
  onNavegar?: (
    v: 'analises' | 'lista' | 'novo' | 'compras' | 'tipos',
  ) => void;
}) {
  const [itens, setItens] = useState<MaterialItem[]>([]);
  const [lookups, setLookups] = useState<MaterialLookups | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [itensPorPagina, setItensPorPagina] = useState(25);
  const [saving, setSaving] = useState(false);
  const [editando, setEditando] = useState<MaterialItem | null>(null);
  const [form, setForm] = useState<DespesasExtrasFormData>(emptyForm);
  const [toggling, setToggling] = useState<number | null>(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<number | null>(
    null,
  );
  const [excluindo, setExcluindo] = useState<number | null>(null);

  const carregarTodos = useCallback(async () => {
    setError(null);
    try {
      const lista = await listarMateriais({ tipo: 'DESPESAS_EXTRAS' });
      setItens(lista);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao carregar despesas extras',
      );
    }
  }, []);

  useEffect(() => {
    carregarTodos();
    listarLookupsMateriais()
      .then(setLookups)
      .catch(() => {});
  }, [carregarTodos]);

  function comecarEdicao(m: MaterialItem) {
    setEditando(m);
    setForm({
      nome: m.nome,
      unidadeId: m.unidadeId ?? '',
      quantidadeMinima:
        m.quantidadeMinima === null ? '' : String(m.quantidadeMinima),
      custoUnitario:
        m.custoUnitario === null ? '' : String(toNum(m.custoUnitario)),
      status: m.status,
    });
    setError(null);
    onNavegar?.('novo');
  }

  function cancelarEdicao() {
    setEditando(null);
    setForm(emptyForm);
    setError(null);
    onNavegar?.('lista');
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editando) {
        const atualizado = await atualizarMaterial(editando.id, {
          nome: form.nome,
          unidadeId: form.unidadeId === '' ? undefined : form.unidadeId,
          quantidadeMinima: numOuNull(form.quantidadeMinima),
          custoUnitario: numOuNull(form.custoUnitario),
          status: form.status,
        });
        setItens((prev) =>
          prev.map((x) => (x.id === atualizado.id ? atualizado : x)),
        );
        cancelarEdicao();
      } else {
        const payload: MaterialInput = {
          nome: form.nome,
          tipo: 'DESPESAS_EXTRAS',
          unidadeId: form.unidadeId === '' ? undefined : form.unidadeId,
          quantidadeMinima: numOuNull(form.quantidadeMinima) ?? undefined,
          custoUnitario: numOuNull(form.custoUnitario) ?? undefined,
        };
        const criado = await criarMaterial(payload);
        setItens((prev) => [criado, ...prev]);
        cancelarEdicao();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao salvar item',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(m: MaterialItem) {
    setToggling(m.id);
    setError(null);
    try {
      const atualizado = await atualizarMaterial(m.id, {
        status: m.status === 'ATIVO' ? 'INATIVO' : 'ATIVO',
      });
      setItens((prev) =>
        prev.map((x) => (x.id === atualizado.id ? atualizado : x)),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao alterar item',
      );
    } finally {
      setToggling(null);
    }
  }

  async function handleExcluir(id: number) {
    setExcluindo(id);
    setError(null);
    try {
      await excluirMaterial(id);
      setItens((prev) => prev.filter((x) => x.id !== id));
      setConfirmandoExclusao(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao excluir item',
      );
    } finally {
      setExcluindo(null);
    }
  }

  const filtrados = itens.filter((m) =>
    busca.trim()
      ? m.nome.toLowerCase().includes(busca.trim().toLowerCase())
      : true,
  );

  if (viewAtiva === 'tipos') {
    return <TiposDespesasView />;
  }

  if (viewAtiva === 'compras') {
    return <ListaComprasView tipo="DESPESAS_EXTRAS" titulo="Despesas Extras" />;
  }

  if (viewAtiva === 'analises') {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">
            Despesas Extras
          </h1>
          <p className="text-sm text-muted-foreground">
            Cadastro e gestão de estoque de itens de despesas extras.
          </p>
        </header>

        <DespesasExtrasAnalises itens={itens} />

        {onNavegar && (
          <Button
            type="button"
            variant="outline"
            onClick={() => onNavegar('lista')}
          >
            ← Voltar para a lista
          </Button>
        )}
      </div>
    );
  }

  if (viewAtiva === 'novo') {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">
            {editando ? `Editar ${editando.nome}` : 'Novo Item de Despesas Extras'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Cadastre ou edite um item de despesas extras e seu estoque mínimo.
          </p>
        </header>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <DespesasExtrasForm
          editando={!!editando}
          saving={saving}
          form={form}
          setForm={setForm}
          onSubmit={handleSubmit}
          onCancel={cancelarEdicao}
          unidadesMedida={lookups?.unidadesMedida ?? []}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Despesas Extras
        </h1>
        <p className="text-sm text-muted-foreground">
          Cadastro e gestão de estoque de itens de despesas extras.
        </p>
      </header>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="relative">
        <input
          type="text"
          placeholder="Buscar item por nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <RecordsFilter
          value={itensPorPagina}
          onChange={setItensPorPagina}
          total={filtrados.length}
        />
      </div>

      <div className="space-y-3">
        {(itensPorPagina > 0
          ? filtrados.slice(0, itensPorPagina)
          : filtrados
        ).map((m) => {
          const baixo = abaixoDoMinimo(m);
          return (
            <Card key={m.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base">{m.nome}</CardTitle>
                    <BadgeStatus status={m.status} />
                  </div>
                  <BadgeSaldo valor={saldoDe(m)} destaque={baixo} />
                </div>
                <CardDescription>
                  Unidade: {m.unidade?.nome}
                  {m.quantidadeMinima !== null &&
                    ` · mín. ${m.quantidadeMinima}`}
                  {m.custoUnitario !== null &&
                    ` · custo ${formatarValor(toNum(m.custoUnitario))}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    {baixo
                      ? 'Estoque abaixo do mínimo recomendado. Programe a reposição.'
                      : `Cadastrado em ${formatarData(m.createdAt)}`}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => comecarEdicao(m)}
                    >
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={toggling === m.id}
                      onClick={() => handleToggleStatus(m)}
                    >
                      {toggling === m.id
                        ? 'Salvando...'
                        : m.status === 'ATIVO'
                          ? 'Desativar'
                          : 'Ativar'}
                    </Button>
                    {confirmandoExclusao === m.id ? (
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={excluindo === m.id}
                          onClick={() => handleExcluir(m.id)}
                        >
                          {excluindo === m.id ? 'Excluindo...' : 'Confirmar'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={excluindo === m.id}
                          onClick={() => setConfirmandoExclusao(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => setConfirmandoExclusao(m.id)}
                      >
                        Excluir
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {!error && filtrados.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum item de despesas extras encontrado.
          </p>
        )}
      </div>
    </div>
  );
}
